(function() {
  'use strict';
  var CND, FS, FSP, OT, PATH, SVGTTF, SvgPath, _drop_extension, alert, assign, badge, cwd_abspath, cwd_relpath, debug, declare, echo, help, here_abspath, info, isa, jr, last_of, log, path_precision, project_abspath, rpr, size_of, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DEMO-OPENTYPE';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  FSP = FS.promises;

  PATH = require('path');

  ({assign, jr} = CND);

  ({cwd_abspath, cwd_relpath, here_abspath, _drop_extension, project_abspath} = require('../helpers'));

  this.types = require('../types');

  //...........................................................................................................
  ({isa, validate, declare, size_of, last_of, type_of} = this.types);

  //...........................................................................................................
  // _glob                     = require 'glob'
  // glob                      = ( require 'util' ).promisify _glob
  require('../exception-handler');

  // PD                        = require 'pipedreams'
  // SP                        = require 'steampipes'
  // { $
  //   $async
  //   $watch
  //   $show  }                = SP.export()
  //...........................................................................................................
  OT = require('opentype.js');

  path_precision = 5;

  SvgPath = require('svgpath');

  SVGTTF = require('../main');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.load_font = function(path) {
    return OT.loadSync(path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.save_font = function(path, font) {
    var buffer;
    // FS.writeFileSync path, buffer = font.toBuffer() # deprecated
    FS.writeFileSync(path, buffer = Buffer.from(font.toArrayBuffer()));
    return buffer.length;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.list_glyphs_in_font = function(font_or_path) {
    var R, cid, font, glyph, i, idx, len, ref, ref1, unicodes;
    if (isa.text(font_or_path)) {
      return this.list_glyphs_in_font(this.load_font(font_or_path));
    }
    //.........................................................................................................
    font = font_or_path;
    R = new Set();
    ref = font.glyphs.glyphs;
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

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.demo = function() {
    var filepath, font, fonts_home, glyph, i, idx, j, k, key, keys, len, len1, ref, ref1, ref2;
    debug('^ot#332', (function() {
      var results;
      results = [];
      for (k in OT) {
        results.push(k);
      }
      return results;
    })());
    fonts_home = project_abspath('.', 'materials');
    filepath = PATH.resolve(PATH.join(fonts_home, 'Sun-ExtA-excerpts.ttf'));
    // debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/EBGaramond-InitialsF2.otf'
    font = this.load_font(filepath);
    urge((function() {
      var results;
      results = [];
      for (k in font) {
        results.push(k);
      }
      return results;
    })());
    // info 'font.usWeightClasses    ', font.usWeightClasses
    // info 'font.encoding           ', ( k for k of font.encoding )
    // info 'font.ascender           ', font.ascender
    // info 'font.descender          ', font.descender
    keys = ['familyName', 'styleName', 'unitsPerEm', 'ascender', 'descender', 'glyphNames'];
    for (i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      info(key, font[key]);
    }
    // font.forEachGlyph ( P... ) -> debug P
    debug(type_of(font.glyphs));
    debug(font.glyphs.length);
    debug('^xx#1^ font               ', ((function() {
      var results;
      results = [];
      for (k in font) {
        results.push(k);
      }
      return results;
    })()).sort());
    debug('^xx#2^ font.glyphs        ', ((function() {
      var results;
      results = [];
      for (k in font.glyphs) {
        results.push(k);
      }
      return results;
    })()).sort());
    debug('^xx#3^ font.glyphs.glyphs ', ((function() {
      var results;
      results = [];
      for (k in font.glyphs.glyphs) {
        results.push(k);
      }
      return results;
    })()).sort());
    ref = [0, 123, 456, 0x4e00];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      idx = ref[j];
      if ((glyph = font.glyphs.glyphs[idx]) == null) {
        warn(`^xxx#3773^ no such glyph: 0x${idx.toString(16)}`);
        continue;
      }
      debug(`${glyph.index} ${(ref1 = glyph.name) != null ? ref1 : './.'} 0x${((ref2 = glyph.unicode) != null ? ref2 : 0).toString(16)} ${glyph.unicodes}`);
    }
    // help ( @list_glyphs_in_font font ).join ''
    return info((this.list_glyphs_in_font(PATH.resolve(PATH.join(fonts_home, 'FandolSong-Regular.subset.otf')))).join(''));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo_glyph_copying = function() {
    var cid, cid_hex, entries, fglyph, filename, filepath, font, fonts_home, glyph, glyphs, i, j, len, len1, nr, output_filepath, path_data, path_obj, ref, svg_path, write;
    fonts_home = project_abspath('.', 'materials');
    entries = [
      {
        filename: 'Sun-ExtA-excerpts.ttf',
        glyphs: '冰串丳'
      },
      {
        filename: 'FandolSong-Regular.subset.otf',
        glyphs: '与丐'
      }
    ];
    //.........................................................................................................
    output_filepath = project_abspath('materials', 'someglyphs.svg');
    FS.writeFileSync(output_filepath, '');
    write = function(text) {
      return FS.appendFileSync(output_filepath, text + '\n');
    };
    //.........................................................................................................
    write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    write("<svg width=\"576\" height=\"576\">");
    write("  <sodipodi:namedview\n    pagecolor=\"#ffffff\"\n    bordercolor=\"#666666\"\n    borderopacity=\"1\"\n    objecttolerance=\"10\"\n    gridtolerance=\"10\"\n    guidetolerance=\"10\"\n    inkscape:pageopacity=\"0\"\n    inkscape:pageshadow=\"2\"\n    inkscape:window-width=\"1366\"\n    inkscape:window-height=\"713\"\n    id=\"namedview532\"\n    showgrid=\"true\"\n    inkscape:zoom=\"3.2332991\"\n    inkscape:cx=\"134.11925\"\n    inkscape:cy=\"119.87498\"\n    inkscape:window-x=\"0\"\n    inkscape:window-y=\"0\"\n    inkscape:window-maximized=\"1\"\n    inkscape:current-layer=\"layer:glyphs\"\n    inkscape:snap-global=\"false\">\n  <inkscape:grid type='xygrid' id='grid490' units='px' spacingx='36' spacingy='36'/>\n</sodipodi:namedview>");
    write("<g id='layer:glyphs' inkscape:groupmode='layer' inkscape:label='layer:glyphs'>");
    //.........................................................................................................
    nr = 0;
    for (i = 0, len = entries.length; i < len; i++) {
      ({filename, glyphs} = entries[i]);
      filepath = PATH.resolve(PATH.join(fonts_home, filename));
      font = this.load_font(filepath);
      ref = Array.from(glyphs);
      for (j = 0, len1 = ref.length; j < len1; j++) {
        glyph = ref[j];
        nr++;
        cid = glyph.codePointAt(0);
        cid_hex = `0x${cid.toString(16)}`;
        fglyph = font.charToGlyph(glyph);
        path_obj = fglyph.getPath();
        path_data = path_obj.toPathData(path_precision);
        svg_path = (new SvgPath(path_data)).abs();
        svg_path = svg_path.abs();
        svg_path = svg_path.scale(0.5, 0.5);
        svg_path = svg_path.translate(0 + (nr - 1) * 36, 0);
        svg_path = svg_path.round(path_precision);
        // debug ( k for k of svg_path )
        path_data = svg_path.toString();
        // debug path_data
        // path_data   = SVGTTF._path_data_from_svg_path svg_path
        write(`<g><!-- ^xxx#3422' ${cid_hex} ${glyph} --><path d='${path_data}'/></g>`);
      }
    }
    //.........................................................................................................
    write("</g>");
    write("</svg>");
    // debug font.toTables()
    // path = '/tmp/myfont.ttf'
    // whisper "^xxx#4763^ saving font to #{path}"
    // @save_font path, font
    return help(`^xxx#4763^ output written to ${cwd_relpath(output_filepath)}`);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo2 = function() {
    var aGlyph, aPath, font, glyphs, notdefGlyph;
    // Create the bézier paths for each of the glyphs.
    // Note that the .notdef glyph is required.
    notdefGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 650,
      path: new opentype.Path()
    });
    aPath = new opentype.Path();
    aPath.moveTo(100, 0);
    aPath.lineTo(100, 700);
    // more drawing instructions...
    aGlyph = new opentype.Glyph({
      name: 'A',
      unicode: 65,
      advanceWidth: 650,
      path: aPath
    });
    glyphs = [notdefGlyph, aGlyph];
    font = new opentype.Font({
      familyName: 'OpenTypeSans',
      styleName: 'Medium',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: glyphs
    });
    return font.download();
  };

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      // await @demo()
      return (await this.demo_glyph_copying());
    })();
  }

}).call(this);
