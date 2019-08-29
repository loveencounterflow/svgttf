(function() {
  'use strict';
  /* https://github.com/fontello/svg2ttf */
  var CHR, CND, DOMParser, FS, PATH, SVGTTF, SvgPath, T, XPATH, alert, badge, cwd_relpath, debug, declare, echo, first_of, glob, help, info, isa, last_of, log, rpr, select, size_of, svg2ttf, type_of, urge, validate, warn, whisper,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

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

  //...........................................................................................................
  this.types = require('./types');

  ({isa, validate, declare, first_of, last_of, size_of, type_of} = this.types);

  //...........................................................................................................
  ({cwd_relpath} = require('./helpers'));

  //...........................................................................................................
  /* https://github.com/loveencounterflow/coffeenode-teacup */
  T = require('coffeenode-teacup');

  glob = require('glob');

  DOMParser = (require('xmldom-silent')).DOMParser;

  XPATH = require('xpath');

  SvgPath = require('svgpath');

  svg2ttf = require('svg2ttf');

  SVGTTF = this;

  // options                   = require './options'
  select = XPATH.useNamespaces({
    'SVG': 'http://www.w3.org/2000/svg'
  });

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.generate = function(me) {
    /* !!!!!!!!!!!!!!!!!!!!!!!!!! */
    var _, actual_row, block_count, center, cid, col, dx, dy, entry, fallback, fallback_count, fallback_source, glyph_count, glyphs, i, j, k, len, len1, local_glyph_count, local_max_cid, local_min_cid, match, max_cid, max_cid_hex, min_cid, min_cid_hex, parser, path, path_count, paths, prefix, ref, ref1, row, selector, source, svg_path, svgfont, transform, x, y;
    glyphs = {};
    glyph_count = 0;
    parser = new DOMParser();
    fallback = null;
    fallback_count = 0;
    fallback_source = null;
    min_cid = +2e308;
    max_cid = -2e308;
    me.fontname = me.fontname;
    info(`^svgttf#1234^ reading files for font ${rpr(me.fontname)}`);
    //.........................................................................................................
    // for route in input_routes
    local_min_cid = +2e308;
    local_max_cid = -2e308;
    local_glyph_count = 0;
    source = FS.readFileSync(me.sourcepath, {
      encoding: 'utf-8'
    });
    me.doc = parser.parseFromString(source, 'application/xml');
    //.......................................................................................................
    this._find_origin(me);
    urge(`^svgttf#334 found origin at ${[me.x0, me.y0]}`);
    selector = "//SVG:svg//SVG:g[@id='layer:glyphs']//SVG:path";
    paths = select(selector, me.doc);
    path_count = paths.length;
    whisper(`^svgttf#1888^ ${me.fontname}: found ${paths.length} outlines`);
//.......................................................................................................
//.......................................................................................................
//.......................................................................................................
    for (i = 0, len = paths.length; i < len; i++) {
      path = paths[i];
      //.....................................................................................................
      if (((transform = path.getAttribute('transform')) != null) && transform.length > 0) {
        match = transform.match(/^translate\(([-+.0-9]+),([-+.0-9]+)\)$/);
        if (match == null) {
          throw new Error(`unable to parse transform ${rpr(transform)}`);
        }
        [_, x, y] = match;
        x = parseFloat(x);
        y = parseFloat(y);
        validate.number(x);
        validate.number(y);
        transform = ['translate', x, y];
      } else {
        //.....................................................................................................
        transform = null;
      }
      //.....................................................................................................
      svg_path = (new SvgPath(path.getAttribute('d'))).abs();
      if (transform != null) {
        svg_path = svg_path.translate(transform[1], transform[2]);
      }
      center = this.center_from_absolute_path(svg_path);
      [x, y] = center;
      debug('^7765-1^', path.getAttribute('id'));
      debug('^7765-1^', (path.getAttribute('d')).slice(0, 101));
      debug('^7765-1^', `center at ${rpr(center)}`);
      col = Math.floor((x - me.x0) / me.module);
      row = Math.floor((y - me.y0) / me.module);
      debug('^7765-1^', `col, row ${col}, ${row}`);
      // debug '^7765-2^', "col #{col}, row #{row}, block_count #{block_count}, actual_row #{actual_row}, cid 0x#{cid.toString 16}"
      /* !!!!!!!!!!!!!!!!!!!!!!!!!! */
      dx = -(col * me.module); // - me.offset[ 0 ]
      dy = -(row * me.module); // - me.offset[ 1 ]
      svg_path = svg_path.translate(dx, dy).scale(1, -1).translate(0, 64.9)./* TAINT magic number, equals ( me.module * 2 - 7.1 ) for some reason */scale(me.scale).round(0);
      cid = ('@'.codePointAt(0)) + (modulo(col, 16)) + (row * 16);
      /* TAINT magic number 16: glyphs per row */      glyphs[cid] = [cid, svg_path];
    }
    glyphs = (function() {
      var results;
      results = [];
      for (_ in glyphs) {
        entry = glyphs[_];
        results.push(entry);
      }
      return results;
    })();
    svgfont = this.svgfont_from_name_and_glyphs(me, me.fontname, glyphs);
    return this._write_ttf(me, svgfont);
    return null;
//.......................................................................................................
//.......................................................................................................
//.......................................................................................................
//.......................................................................................................
//.......................................................................................................
    for (j = 0, len1 = paths.length; j < len1; j++) {
      path = paths[j];
      //.....................................................................................................
      if (((transform = path.getAttribute('transform')) != null) && transform.length > 0) {
        match = transform.match(/^translate\(([-+.0-9]+),([-+.0-9]+)\)$/);
        if (match == null) {
          throw new Error(`unable to parse transform ${rpr(transform)}`);
        }
        [_, x, y] = match;
        x = parseFloat(x);
        y = parseFloat(y);
        validate.number(x);
        validate.number(y);
        transform = ['translate', x, y];
      } else {
        //.....................................................................................................
        transform = null;
      }
      //.....................................................................................................
      path = (new SvgPath(path.getAttribute('d'))).abs();
      if (transform != null) {
        path = path.translate(transform[1], transform[2]);
      }
      if (me.correction != null) {
        path = path.translate(me.correction[0], me.correction[1]);
      }
      path = path.translate(-me.x0, -me.y0);
      center = this.center_from_absolute_path(path);
      [x, y] = center;
      x -= me.offset[0];
      y -= me.offset[1];
      col = Math.floor(x / me.module);
      row = Math.floor(y / me.module);
      block_count = Math.floor(row / me.block_height);
      actual_row = row - block_count;
      cid = me.cid0 + actual_row * me.row_length + col;
      debug('^7765-1^', `center at ${rpr(center)}`);
      debug('^7765-2^', `col ${col}, row ${row}, block_count ${block_count}, actual_row ${actual_row}, cid 0x${cid.toString(16)}`);
      debug('^7765-3^', [x - me.x0, y - me.y0]);
      dx = -(col * me.module) - me.offset[0];
      dy = -(row * me.module) - me.offset[1];
      //.....................................................................................................
      path = path.translate(dx, dy).scale(1, -1).translate(0, me.module).scale(me.scale).round(0);
      //.....................................................................................................
      if (cid < me.cid0) {
        prefix = fallback != null ? 're-' : '';
        fallback = path;
        fallback_source = me.sourcepath; // filename
        whisper(`^svgttf#2542^ ${cwd_relpath(me.sourcepath)}: ${prefix}assigned fallback`);
      } else {
        //.....................................................................................................
        min_cid = Math.min(min_cid, cid);
        max_cid = Math.max(max_cid, cid);
        local_min_cid = Math.min(local_min_cid, cid);
        local_max_cid = Math.max(local_max_cid, cid);
        if (glyphs[cid] != null) {
          warn(`^svgttf#3196^ ${cwd_relpath(me.sourcepath)}: duplicate CID: 0x${cid.toString(16)}`);
        } else {
          glyphs[cid] = [cid, path];
          glyph_count += 1;
          local_glyph_count += 1;
        }
      }
    }
    //.......................................................................................................
    if (local_glyph_count > 0) {
      min_cid_hex = '0x' + local_min_cid.toString(16);
      max_cid_hex = '0x' + local_max_cid.toString(16);
      help(`^svgttf#3850^ ${cwd_relpath(me.sourcepath)}: added ${local_glyph_count} glyph outlines to [ ${min_cid_hex} .. ${max_cid_hex} ]`);
    } else {
      warn(`^svgttf#4504^ ${cwd_relpath(me.sourcepath)}: no glyphs found`);
    }
    //.........................................................................................................
    //.........................................................................................................
    //.........................................................................................................
    //.........................................................................................................
    //.........................................................................................................
    //.........................................................................................................
    if (glyph_count === 0) {
      warn("^svgttf#5158^ no glyphs found; terminating");
      process.exit(1);
    }
//.........................................................................................................
    for (cid = k = ref = min_cid, ref1 = max_cid; (ref <= ref1 ? k <= ref1 : k >= ref1); cid = ref <= ref1 ? ++k : --k) {
      if (glyphs[cid] == null) {
        glyphs[cid] = [cid, fallback];
        fallback_count += 1;
      }
    }
    if (fallback_count > 0) {
      whisper(`^svgttf#5812^ filled ${fallback_count} positions with fallback outline from ${fallback_source}`);
    }
    min_cid_hex = '0x' + min_cid.toString(16);
    max_cid_hex = '0x' + max_cid.toString(16);
    help(`^svgttf#6466^ added ${glyph_count} glyph outlines to [ ${min_cid_hex} .. ${max_cid_hex} ]`);
    //.........................................................................................................
    glyphs = (function() {
      var results;
      results = [];
      for (_ in glyphs) {
        entry = glyphs[_];
        results.push(entry);
      }
      return results;
    })();
    glyphs.sort(function(a, b) {
      if (a[0] > b[0]) {
        return +1;
      }
      if (a[0] < b[0]) {
        return -1;
      }
      return 0;
    });
    //.........................................................................................................
    svgfont = this.svgfont_from_name_and_glyphs(me.fontname, glyphs);
    return this._write_ttf(me, svgfont);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._find_origin = function(me) {
    var elements, origin;
    if ((elements = select("//SVG:circle[@id='origin']", me.doc)).length !== 1) {
      throw new Error("^svgttf#409 unable to find element with id `origin`");
    }
    origin = elements[0];
    me.x0 = parseFloat(origin.getAttribute('cx'));
    me.y0 = parseFloat(origin.getAttribute('cy'));
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._write_ttf = function(me, svgfont) {
    var targetpath;
    targetpath = me.targetpath;
    /* svg2ttf has a strange API and returns a buffer that isn't a `Buffer`...  */
    FS.writeFileSync(targetpath, new Buffer.from((svg2ttf(svgfont)).buffer));
    return help(`^svgttf#7120^ output written to ${targetpath}`);
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.center_from_absolute_path = function(path) {
    return this.center_from_absolute_points(this.points_from_absolute_path(path));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.center_from_absolute_points = function(path) {
    var i, len, node_count, sum_x, sum_y, x, y;
    node_count = path.length;
    sum_x = 0;
    sum_y = 0;
    for (i = 0, len = path.length; i < len; i++) {
      [x, y] = path[i];
      if (!((x != null) && (y != null))) {
        throw new Error("found undefined points in path");
      }
      sum_x += x; // if x?
      sum_y += y; // if y?
    }
    return [sum_x / node_count, sum_y / node_count];
  };

  //-----------------------------------------------------------------------------------------------------------
  this.points_from_absolute_path = function(path) {
    var R, command, i, idx, j, k, l, last_x, last_y, len, node, ref, ref1, ref2, ref3, x, xy, y;
    R = [];
    ref = path['segments'];
    //.........................................................................................................
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      [command, ...xy] = node;
      if (/^[zZ]$/.test(command)) {
        //.......................................................................................................
        /* Ignore closepath command: */
        continue;
      }
      if (!/^[MLHVCSQTA]$/.test(command)) {
        //.......................................................................................................
        // urge '©99052', node
        throw new Error(`unknown command ${rpr(command)} in path ${rpr(path)}`);
      }
      //.......................................................................................................
      switch (command) {
        //.....................................................................................................
        case 'H':
          [x, y] = [xy[0], last_y];
          R.push([x, y]);
          break;
        //.....................................................................................................
        case 'V':
          [x, y] = [last_x, xy[0]];
          R.push([x, y]);
          break;
        //.....................................................................................................
        case 'M':
        case 'L':
          for (idx = j = 0, ref1 = xy.length; j < ref1; idx = j += +2) {
            [x, y] = [xy[idx], xy[idx + 1]];
            R.push([x, y]);
          }
          break;
        //.....................................................................................................
        case 'C':
          for (idx = k = 0, ref2 = xy.length; k < ref2; idx = k += +6) {
            [x, y] = [xy[idx + 4], xy[idx + 5]];
            R.push([x, y]);
          }
          break;
        //.....................................................................................................
        case 'S':
          for (idx = l = 0, ref3 = xy.length; l < ref3; idx = l += +4) {
            [x, y] = [xy[idx + 2], xy[idx + 3]];
            R.push([x, y]);
          }
          break;
        //.....................................................................................................
        case 'Q':
          warn(rpr(path));
          throw new Error("quadratic splines (SVG path commands `q` and `Q` not yet supported; in case you're\nworking with Inkscape, identify the offending path and nudge one of its control points\nslightly and save the document; this will cause Inkscape to convert the outline to a\ncubic spline.\n\nsee http://inkscape.13.x6.nabble.com/Quadratic-beziers-td2856790.html");
        default:
          //.....................................................................................................
          warn(rpr(path));
          throw new Error(`unknown command ${rpr(command)} in path`);
      }
      // help [ null, null, ]
      // [ x, y, ] = [ null, null, ]
      // R.push [ x, y, ]
      //.......................................................................................................
      last_x = x;
      last_y = y;
    }
    //.........................................................................................................
    return R;
  };

  //===========================================================================================================
  // SVG GENERATION
  //-----------------------------------------------------------------------------------------------------------
  T.SVG = function(...P) {
    var Q;
    Q = {
      'xmlns': 'http://www.w3.org/2000/svg'
    };
    return T.TAG('svg', Q, ...P);
  };

  // <font id="icomoon" horiz-adv-x="512">
  // <font-face units-per-em="512" ascent="480" descent="-32" />

  //-----------------------------------------------------------------------------------------------------------
  T.DEFS = function(...P) {
    return T.TAG('defs', ...P);
  };

  //-----------------------------------------------------------------------------------------------------------
  T.FONT = function(me, font_name, ...P) {
    var Q;
    Q = {
      'id': font_name,
      'horiz-adv-x': me.module * me.scale
    };
    // 'horiz-origin-x':   0
    // 'horiz-origin-y':   0
    // 'vert-origin-x':    0
    // 'vert-origin-y':    0
    // 'vert-adv-y':       0
    return T.TAG('font', Q, ...P);
  };

  //-----------------------------------------------------------------------------------------------------------
  T.FONT_FACE = function(me, font_family) {
    var Q;
    Q = {
      'font-family': font_family,
      'units-per-em': me.module * me.scale,
      /* TAINT probably wrong values */
      'ascent': me.ascent,
      'descent': me.descent
    };
    /* TAINT kludge */
    // return T.selfClosingTag 'font-face', Q
    return T.RAW((T.render(() => {
      return T.TAG('font-face', Q);
    })).replace(/><\/font-face>$/, ' />'));
  };

  //-----------------------------------------------------------------------------------------------------------
  T.GLYPH = function(cid, path) {
    var Q;
    Q = {
      // unicode:  T.TEXT CHR.as_ncr cid
      unicode: CHR.as_chr(cid),
      d: SVGTTF._path_data_from_svg_path(path)
    };
    return T.TAG('glyph', Q);
  };

  //-----------------------------------------------------------------------------------------------------------
  T.MARKER = function(xy, r = 10) {
    return T.TAG('circle', {
      cx: xy[0],
      cy: xy[1],
      r: r,
      fill: '#f00'
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this._path_data_from_svg_path = function(me) {
    var s;
    return ((function() {
      var i, len, ref, results;
      ref = me.segments;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results.push(s[0] + s.slice(1).join(','));
      }
      return results;
    })()).join(' ');
  };

  //-----------------------------------------------------------------------------------------------------------
  T.path = function(path) {
    var path_txt;
    path_txt = SVGTTF._path_data_from_svg_path(path);
    return T.TAG('path', {
      d: path_txt,
      fill: '#000'
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svgfont_from_name_and_glyphs = function(me, font_name, glyphs) {
    return T.render(() => {
      //.........................................................................................................
      T.RAW("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
      /* must preserve space at end of DOCTYPE declaration */
      T.RAW("<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n");
      return T.SVG(() => {
        T.TEXT('\n');
        T.DEFS(() => {
          T.TEXT('\n');
          T.FONT(me, font_name, () => {
            var cid, i, len, path, results;
            T.TEXT('\n');
            T.FONT_FACE(me, font_name);
            T.TEXT('\n');
            results = [];
            for (i = 0, len = glyphs.length; i < len; i++) {
              [cid, path] = glyphs[i];
              T.RAW(`<!-- ${cid.toString(16)} -->`);
              T.GLYPH(cid, path);
              results.push(T.TEXT('\n'));
            }
            return results;
          });
          return T.TEXT('\n');
        });
        return T.TEXT('\n');
      });
    });
    //.........................................................................................................
    return null;
  };

  //===========================================================================================================
  // HELPERS
  //-----------------------------------------------------------------------------------------------------------
  this.demo = function() {
    var d, path;
    d = "M168,525.89c38,36,48,48,46,81s5,47-46,52 s-88,35-91-27s-21-73,11-92S168,525.89,168,525.89z";
    path = new SvgPath(d).scale(0.5).translate(100, 200).abs().round(0);
    // .rel()
    // .round(1) # Fix js floating point error/garbage after rel()
    // .toString()
    debug(JSON.stringify(path));
    // debug path.toString()
    help(this.points_from_absolute_path(path));
    help(this.center_from_absolute_path(path));
    return debug(this.f(path));
  };

  //-----------------------------------------------------------------------------------------------------------
  this._join_routes = function(...P) {
    return PATH.resolve(process.cwd(), PATH.join(...P));
  };

}).call(this);
