(function() {
  'use strict';
  var CND, OT, badge, debug, echo, help, info, isa, rpr, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'SVGTTF/MAIN';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  this.types = require('./types');

  ({isa, validate, type_of} = this.types);

  OT = require('opentype.js');

  //-----------------------------------------------------------------------------------------------------------
  this.get_metrics = function(me) {
    var R;
    R = {};
    R.ascent = me.otjsfont.tables.os2.sTypoAscender;
    R.upm = me.otjsfont.unitsPerEm;
    R.baseline = R.ascent;
    R.descent = R.upm - R.baseline;
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._transform_fn_as_text = function(transform_fn) {
    var name, p;
    validate.svgttf_svg_transform_fn(transform_fn);
    [name, ...p] = transform_fn;
    if (p.length === 1) {
      p = p[0];
    }
    if ((isa.text(p)) || (isa.float(p))) {
      return `${name}(${p})`;
    }
    if (isa.list(p)) {
      return `${name}(${p.join(',')})`;
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this._transform_as_text = function(transform) {
    var tf;
    if (transform == null) {
      return null;
    }
    validate.list(transform);
    if (transform.length === 0) {
      return null;
    }
    return `transform='${((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = transform.length; i < len; i++) {
        tf = transform[i];
        results.push(this._transform_fn_as_text(tf));
      }
      return results;
    }).call(this)).join(' ')}'`;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.pathelement_from_glyphidx = function(me, glyph_idx, size = null, transform) {
    var pathdata;
    pathdata = this.pathdata_from_glyphidx(me, glyph_idx, size);
    if ((pathdata == null) || (pathdata === '')) {
      return null;
    }
    return this._pathelement_from_pathdata(me, pathdata, transform);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.pathdata_from_glyphidx = function(me, glyph_idx, size = null) {
    /* TAINT should implement fallback value for case when glyph not found */
    validate.svgttf_font(me);
    validate.count(glyph_idx);
    if (size != null) {
      validate.nonnegative(size);
    }
    return this._fast_pathdata_from_glyphidx(me, glyph_idx, size);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._fast_pathdata_from_glyphidx = function(me, glyph_idx, size = null) {
    /* TAINT should implement fallback value for case when glyph not found */
    var glyph, path, path_precision, x, y;
    path_precision = 0;
    x = 0;
    y = 0;
    glyph = me.otjsfont.glyphs.glyphs[glyph_idx];
    if (glyph == null) {
      return null;
    }
    size = size != null ? size : me.otjsfont.unitsPerEm;
    path = glyph.getPath(x, y, size);
    return path.toPathData(path_precision);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.pathdataplus_from_glyphidx = function(me, glyph_idx, size = null) {
    /* TAINT should implement fallback value for case when glyph not found */
    validate.svgttf_font(me);
    validate.count(glyph_idx);
    if (size != null) {
      validate.nonnegative(size);
    }
    return this._fast_pathdataplus_from_glyphidx(me, glyph_idx, size);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._fast_pathdataplus_from_glyphidx = function(me, glyph_idx, size = null) {
    /* TAINT should implement fallback value for case when glyph not found */
    var cid, glyph, glyphname, path, path_precision, pathdata, x, y;
    pathdata = null;
    glyphname = null;
    path_precision = 0;
    x = 0;
    y = 0;
    glyph = me.otjsfont.glyphs.glyphs[glyph_idx];
    if (glyph != null) {
      size = size != null ? size : me.otjsfont.unitsPerEm;
      path = glyph.getPath(x, y, size);
      pathdata = path.toPathData(path_precision);
      glyphname = glyph.name;
      if ((cid = glyph.unicode) != null) {
        return {
          pathdata,
          glyphname,
          chr: String.fromCodePoint(cid)
        };
      }
    }
    return {
      pathdata,
      glyphname,
      chr: ''
    };
  };

  //-----------------------------------------------------------------------------------------------------------
  this._pathelement_from_pathdata = function(me, pathdata, transform = null) {
    var tf_txt;
    if ((tf_txt = this._transform_as_text(transform)) != null) {
      return `<path ${tf_txt} d='${pathdata}'/>`;
    }
    return `<path d='${pathdata}'/>`;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_svg = function(me, x1, y1, x2, y2, content) {
    var R, type;
    validate.float(x1);
    validate.float(y1);
    validate.float(x2);
    validate.float(y2);
    R = [];
    R.push("<?xml version='1.0' standalone='no'?>");
    R.push("<svg xmlns='http://www.w3.org/2000/svg' ");
    /* TAINT make optional to adapt to SVG v2, see https://css-tricks.com/on-xlinkhref-being-deprecated-in-svg/ */
    R.push("xmlns:xlink='http://www.w3.org/1999/xlink' ");
    R.push(`viewBox='${x1} ${y1} ${x2} ${y2}'>`);
    switch (type = type_of(content)) {
      case 'text':
        R.push(content);
        break;
      case 'list':
        R = R.concat(content);
        break;
      default:
        throw new Error(`^svgttf/_get_svg_from_glyphidx@3337^ expected a text or a list, got a ${type}`);
    }
    R.push("</svg>");
    return R.join('');
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svg_from_glyphidx = function(me, glyph_idx, size) {
    var pathelement;
    pathelement = this.pathelement_from_glyphidx(me, glyph_idx, size); //, transform
    /* TAINT derive coordinates from metrics */
    return this._get_svg(me, 0, -800, 1000, 1000, pathelement);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_coordinate_hints = function(me) {
    var R;
    R = [];
    R.push("<circle cx='0' cy='0' r='20' style='fill:red;'/>");
    R.push("<circle cx='0' cy='0' r='100' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='200' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='300' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='400' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='500' style='fill-opacity:0;stroke:red;stroke-width:20;'/>");
    R.push("<circle cx='0' cy='0' r='600' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='700' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='800' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='900' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    R.push("<circle cx='0' cy='0' r='1000' style='fill-opacity:0;stroke:red;stroke-width:20;'/>");
    R.push("<line x1='0' y1='0' x2='950' y2='950' style='stroke:red;stroke-width:10;'/>");
    R.push("<rect x='0' y='0' width='1000' height='1000' style='fill-opacity:0;stroke:red;stroke-width:10;'/>");
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svg_from_harfbuzz_linotype = function(me, harfbuzz_linotype, size) {
    var R, i, len, pathelement, sort, transform, x, y;
    /* TAINT code duplication */
    validate.svgttf_harfbuzz_linotype(harfbuzz_linotype);
    x = 0;
    y = 0;
    R = [];
    for (i = 0, len = harfbuzz_linotype.length; i < len; i++) {
      sort = harfbuzz_linotype[i];
      transform = [['translate', x, y]];
      /* TAINT figure out relationship between size and upem */
      x += sort.x_advance * size;
      if ((pathelement = this.pathelement_from_glyphidx(me, sort.gid, size, transform)) != null) {
        R.push('\n' + `<!--gid:${sort.gid}-->` + pathelement);
      }
    }
    R.push('\n');
    return this._get_svg(me, 0, -800, x, 1000, R);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.get_svg_symbol_font = function(me) {
    var R, cid, cid_hex, glyph, glyph_idx, id, name, pathdata, ref, ref1, sfncr, uglyph, vbx_txt, x1, x2, y1, y2;
    // debug '^33431^', ( k for k of me.otjsfont.glyphs.glyphs ) #.glyphs[ glyph_idx ]
    // debug '^33431^', ( type_of me.otjsfont.glyphs.glyphs ) #.glyphs[ glyph_idx ]
    R = [];
    ref = me.otjsfont.glyphs.glyphs;
    for (glyph_idx in ref) {
      glyph = ref[glyph_idx];
      // continue unless 12 < glyph_idx < 22 ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
      // debug glyph_idx, glyph
      /* TAINT must derive bounding box from outline */
      // glyph.advanceWidth
      // glyph.leftSideBearing
      x1 = 0;
      y1 = -800;
      x2 = 1000;
      y2 = 1000;
      vbx_txt = `'${x1},${y1},${x2},${y2}'`;
      name = (ref1 = glyph.name) != null ? ref1 : 'UNKNOWN';
      id = `g${glyph_idx}`;
      /* TAINT set width, height; */
      // width='1000' height='1000' viewBox='0,-800,1000,1000'
      R.push(`<symbol id='${id}' viewBox=${vbx_txt}>`);
      if ((cid = glyph.unicode) != null) {
        // glyph.unicodes
        cid_hex = (cid.toString(16)).padStart(4, '0');
        sfncr = `u/${cid_hex}`;
        uglyph = String.fromCodePoint(cid);
        R.push(`<!-- ${sfncr} ${uglyph} -->`);
      } else {
        R.push(`<!-- ${name} -->`);
      }
      pathdata = this._fast_pathdata_from_glyphidx(me, glyph_idx, null);
      /* TAINT might consider to leave out glyphs without outline altogether, but OTOH symbol should not
         cause 404 not found when requested, so we leave those in FTM: */
      if ((pathdata != null) && (pathdata !== '')) {
        R.push(this._pathelement_from_pathdata(me, pathdata));
      }
      R.push("</symbol>\n");
    }
    /* TAINT we don't need a bounding box at all for an SVG with only symbols */
    /* TAINT alternatively, may display some sample glyphs in font symbol SVG so to have visual feedback on opening */
    return this._get_svg(me, 0, 0, 10000, 10000, R);
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.font_from_path = function(path) {
    var otjsfont;
    validate.nonempty_text(path);
    otjsfont = OT.loadSync(path);
    return {path, otjsfont};
  };

  // ############################################################################################################
// if require.main is module then do =>

}).call(this);

//# sourceMappingURL=main.js.map