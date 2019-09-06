(function() {
  'use strict';
  var CHR, CND, FS, OT, PATH, SvgPath, alert, badge, debug, declare, echo, first_of, help, info, isa, jr, last_of, log, path_precision, rpr, size_of, spawn_sync, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  CHR = require('coffeenode-chr');

  rpr = CND.rpr.bind(CND);

  badge = 'SVGTTF/MAIN';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  urge = CND.get_logger('urge', badge);

  whisper = CND.get_logger('whisper', badge);

  help = CND.get_logger('help', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  // exec                      = ( require 'util' ).promisify ( require 'child_process' ).exec
  spawn_sync = (require('child_process')).spawnSync;

  // CP                        = require 'child_process'
  jr = JSON.stringify;

  //...........................................................................................................
  this.types = require('./types');

  ({isa, validate, declare, first_of, last_of, size_of, type_of} = this.types);

  //...........................................................................................................
  require('./exception-handler');

  //...........................................................................................................
  OT = this._OT = require('opentype.js');

  SvgPath = this._SvgPath = require('svgpath');

  path_precision = 5;

  //===========================================================================================================
  // METRICS
  //-----------------------------------------------------------------------------------------------------------
  this.new_metrics = function() {
    var R;
    R = {
      em_size: 4096/* a.k.a. design size, grid size */,
      ascender: null,
      descender: null,
      font_size: 360/* in pixels */,
      scale_factor: null
    };
    // ### TAINT magic number
    // for whatever reason, we have to calculate advanceWidth with an additional tracking factor:
    // advanceWidth = glyph.advanceWidth * metrics.scale_factor * metrics.tracking_factor ###
    // tracking_factor:  256 / 182
    R.scale_factor = R.em_size / R.font_size;
    R.ascender = R.em_size / (256 / 220);
    R.descender = -R.em_size / 5;
    // R.global_glyph_scale  = 50 / 48.5 ### TAINT value must come from configuration ###
    R.global_glyph_scale = 256 / 248/* TAINT value must come from configuration */
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.new_otjs_font = function(me, name, glyphs) {
    validate.nonempty_text(name);
    return new OT.Font({
      familyName: name,
      styleName: 'Medium',
      unitsPerEm: me.em_size,
      ascender: me.ascender,
      descender: me.descender,
      glyphs: glyphs
    });
  };

  //===========================================================================================================
  // FONTFORGE
  //-----------------------------------------------------------------------------------------------------------
  this.rewrite_with_fontforge = function(path) {
    var command, parameters, settings, status, stderr;
    help(`^svgttf#0091 size before normalisation: ${CND.format_number(this._size_from_path(path))} B`);
    //.........................................................................................................
    command = 'fontforge';
    parameters = ['--lang=ff', '-c', "Open($1); Generate($1);", path];
    settings = {
      cwd: process.cwd(),
      timeout: 3 * 60 * 1000,
      encoding: 'utf-8',
      shell: false
    };
    //.........................................................................................................
    ({status, stderr} = spawn_sync(command, parameters, settings));
    //.........................................................................................................
    if (status !== 0) {
      throw new Error(`^svgttf#3309 when trying to execute ${jr(command)} ${jr(parameters)}, an error occurred:\n${stderr}`);
    }
    //.........................................................................................................
    help(`^svgttf#0091 size  after normalisation: ${CND.format_number(this._size_from_path(path))} B`);
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._size_from_path = function(path) {
    var error;
    try {
      return (FS.statSync(path)).size;
    } catch (error1) {
      error = error1;
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  };

  //===========================================================================================================
  // OPENTYPE.JS
  //-----------------------------------------------------------------------------------------------------------
  this.otjsfont_from_path = function(path) {
    return OT.loadSync(path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.save_otjsfont = function(path, otjsfont) {
    var buffer;
    // FS.writeFileSync path, buffer = otjsfont.toBuffer() # deprecated
    FS.writeFileSync(path, buffer = Buffer.from(otjsfont.toArrayBuffer()));
    return buffer.length;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.list_glyphs_in_otjsfont = function(otjsfont) {
    var R, cid, glyph, i, idx, len, ref, ref1, unicodes;
    R = new Set();
    ref = otjsfont.glyphs.glyphs;
    //.........................................................................................................
    for (idx in ref) {
      glyph = ref[idx];
      if (((ref1 = glyph.name) === '.notdef') || (glyph.unicode == null) || (glyph.unicode < 0x20)) {
        warn(`skipping glyph ${rpr(glyph.name)}`);
        continue;
      }
      unicodes = glyph.unicodes;
      if ((unicodes == null) || (unicodes.length === 0)) {
        unicodes = [glyph.unicode];
      }
// debug rpr glyph
// debug rpr unicodes
      for (i = 0, len = unicodes.length; i < len; i++) {
        cid = unicodes[i];
        // debug rpr cid
        R.add(String.fromCodePoint(cid));
      }
    }
    //.........................................................................................................
    return [...R].sort();
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svg_path_from_cid = function(otjsfont, cid) {
    var cid_hex, glyph, pathdata;
    pathdata = this.svg_pathdata_from_cid(otjsfont, cid);
    glyph = String.fromCodePoint(cid);
    cid_hex = `0x${cid.toString(16)}`;
    return `<!-- ${cid_hex} ${glyph} --><path d='${pathdata}'/>`;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.glyph_and_pathdata_from_cid = function(otjsfont, cid) {
    var XXXXX_metrics, fglyph, global_glyph_scale, path_obj, pathdata, ref, scale_factor, svg_path;
    XXXXX_metrics = this.new_metrics();
    validate.positive_integer(cid);
    fglyph = otjsfont.charToGlyph(String.fromCodePoint(cid));
    if (fglyph.unicode == null) {
      return null;
    }
    path_obj = fglyph.getPath(0, 0, XXXXX_metrics.font_size);
    pathdata = path_obj.toPathData(path_precision);
    if (pathdata.length === 0) {
      return null;
    }
    svg_path = new SvgPath(pathdata);
    global_glyph_scale = (ref = XXXXX_metrics.global_glyph_scale) != null ? ref : 1;
    scale_factor = XXXXX_metrics.scale_factor * global_glyph_scale;
    svg_path = svg_path.scale(scale_factor, -scale_factor);
    return {
      glyph: fglyph,
      pathdata: svg_path.toString()
    };
  };

  //-----------------------------------------------------------------------------------------------------------
  this.otjspath_from_pathdata = function(pathdata) {
    var R, d, i, len, ref, svg_path, tail, type, x, x1, x2, y, y1, y2;
    validate.nonempty_text(pathdata);
    svg_path = new SvgPath(pathdata);
    R = new OT.Path();
    d = R.commands;
    ref = svg_path.segments;
    for (i = 0, len = ref.length; i < len; i++) {
      [type, ...tail] = ref[i];
      // debug '^svgttf#3342', [ type, tail..., ]
      /* TAINT consider to use API (moveTo, lineTo etc) */
      switch (type) {
        case 'M':
        case 'L':
          [x, y] = tail;
          d.push({type, x, y});
          break;
        case 'C':
          [x1, y1, x2, y2, x, y] = tail;
          d.push({type, x1, y1, x2, y2, x, y});
          break;
        case 'Q':
          [x1, y1, x, y] = tail;
          d.push({type, x1, y1, x, y});
          break;
        case 'Z':
          d.push({type});
          break;
        default:
          throw new Error(`^svgttf#2231 unknown SVG path element ${rpr(type)}`);
      }
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.get_fallback_glyph = function(me, shape = 'square') {
    var advanceWidth, name, path, unicode, width, x0, x1, xm, y0, y1, ym;
    // validate.svgttf_metrics me
    validate.nonempty_text(shape);
    //.........................................................................................................
    width = Math.floor(3 * me.em_size / 4);
    x0 = Math.floor(me.em_size / 8);
    x1 = x0 + width;
    y0 = 0;
    y1 = width;
    path = new OT.Path();
    //.........................................................................................................
    switch (shape) {
      case 'square':
        path.moveTo(x0, y0);
        path.lineTo(x1, y0);
        path.lineTo(x1, y1);
        path.lineTo(x0, y1);
        path.close();
        break;
      case 'uptriangle':
        xm = Math.floor((x0 + x1) / 2);
        path.moveTo(x0, y0);
        path.lineTo(x1, y0);
        path.lineTo(xm, y1);
        path.close();
        break;
      case 'round':
        xm = Math.floor((x0 + x1) / 2);
        ym = Math.floor((y0 + y1) / 2);
        path.moveTo(xm, y0);
        path.quadTo(x1, y0, x1, ym);
        path.quadTo(x1, y1, xm, y1);
        path.quadTo(x0, y1, x0, ym);
        path.quadTo(x0, y0, xm, y0);
        path.close();
        break;
      default:
        throw new Error(`^svgttf#3391 unknown shape ${rpr(shape)}`);
    }
    //.........................................................................................................
    name = '.notdef';
    unicode = 0;
    advanceWidth = me.em_size;
    return new OT.Glyph({name, unicode, advanceWidth, path});
  };

}).call(this);
