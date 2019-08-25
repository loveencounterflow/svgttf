(function() {
  // "coffee-script": "^1.8.0",
  // "coffeenode-chr": "^0.1.3",
  // "coffeenode-teacup": "0.0.17",
  // "coffeenode-CND": "^0.1.20",
  // "glob": "^4.0.6",
  // "svgpath": "~ 1.0.0",
  // "xmldom-silent": "~ 0.1.16",
  // "xpath": "0.0.7"

  //###########################################################################################################
  var CHR, CND, DOMParser, FS, PATH, SvgPath, T, alert, badge, debug, declare, echo, em_size, first_of, glob, help, info, isa, last_of, log, module, options, rpr, size_of, svg2ttf, type_of, urge, validate, warn, whisper, xpath;

  CND = require('cnd');

  CHR = require('coffeenode-chr');

  rpr = CND.rpr.bind(CND);

  badge = 'SVGTTF/main';

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

  DOMParser = (require('xmldom-silent')).DOMParser;

  xpath = require('xpath');

  //...........................................................................................................
  this.types = require('./types');

  ({isa, validate, declare, first_of, last_of, size_of, type_of} = this.types);

  //...........................................................................................................
  SvgPath = require('svgpath');

  //...........................................................................................................
  /* https://github.com/loveencounterflow/coffeenode-teacup */
  T = require('coffeenode-teacup');

  //...........................................................................................................
  /* https://github.com/isaacs/node-glob */
  glob = require('glob');

  //...........................................................................................................
  /* https://github.com/fontello/svg2ttf */
  svg2ttf = require('svg2ttf');

  //===========================================================================================================
  // OPTIONS
  //-----------------------------------------------------------------------------------------------------------
  module = 36;

  em_size = 4096;

  options = {
    /* Coordinates of first glyph outline: */
    'offset': [module * 4, module * 4],
    /* Ad hoc correction: */
    'correction': [0, module * 0.075],
    /* Size of grid and font design size: */
    'module': module,
    // 'scale':            256 / module
    // 'scale':            1024 / module
    /* Number of glyph rows between two rulers plus one: */
    'block-height': 9,
    /* CID of first glyph outline: */
    'row-length': 16,
    'em-size': em_size,
    'ascent': +0.8 * em_size,
    'descent': -0.2 * em_size
  };

  //...........................................................................................................
  options['scale'] = em_size / module;

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.main = function(settings) {
    var _, actual_row, block_count, center, cid, cid0, col, correction, doc, dx, dy, entry, fallback, fallback_count, fallback_source, filename, font_name, glyph_count, glyphs, i, input_routes, j, k, len, len1, local_glyph_count, local_max_cid, local_min_cid, match, max_cid, max_cid_hex, min_cid, min_cid_hex, parser, path, path_count, paths, prefix, ref, ref1, route, row, select, selector, source, svgfont, transform, x, y;
    input_routes = settings['input-routes'];
    // debug settings
    glyphs = {};
    glyph_count = 0;
    parser = new DOMParser();
    select = xpath.useNamespaces({
      'SVG': 'http://www.w3.org/2000/svg'
    });
    selector = '//SVG:svg/SVG:path';
    fallback = null;
    fallback_count = 0;
    fallback_source = null;
    min_cid = +2e308;
    max_cid = -2e308;
    font_name = settings['font-name'];
    correction = options['correction'];
    info(`reading files for font ${rpr(font_name)}`);
//.........................................................................................................
    for (i = 0, len = input_routes.length; i < len; i++) {
      route = input_routes[i];
      local_min_cid = +2e308;
      local_max_cid = -2e308;
      local_glyph_count = 0;
      filename = PATH.basename(route);
      cid0 = this._cid0_from_route(route);
      source = FS.readFileSync(route, {
        encoding: 'utf-8'
      });
      doc = parser.parseFromString(source, 'application/xml');
      paths = select(selector, doc);
      path_count = paths.length;
      whisper(`${filename}: found ${paths.length} outlines`);
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
          x = parseFloat(x, 10);
          y = parseFloat(y, 10);
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
        if (correction != null) {
          path = path.translate(correction[0], correction[1]);
        }
        center = this.center_from_absolute_path(path);
        [x, y] = center;
        x -= options['offset'][0];
        y -= options['offset'][1];
        col = Math.floor(x / options['module']);
        row = Math.floor(y / options['module']);
        block_count = Math.floor(row / options['block-height']);
        actual_row = row - block_count;
        cid = cid0 + actual_row * options['row-length'] + col;
        dx = -(col * options['module']) - options['offset'][0];
        dy = -(row * options['module']) - options['offset'][1];
        //.....................................................................................................
        path = path.translate(dx, dy).scale(1, -1).translate(0, options['module']).scale(options['scale']).round(0);
        //.....................................................................................................
        if (cid < cid0) {
          prefix = fallback != null ? 're-' : '';
          fallback = path;
          fallback_source = filename;
          whisper(`${filename}: ${prefix}assigned fallback`);
        } else {
          //.....................................................................................................
          min_cid = Math.min(min_cid, cid);
          max_cid = Math.max(max_cid, cid);
          local_min_cid = Math.min(local_min_cid, cid);
          local_max_cid = Math.max(local_max_cid, cid);
          if (glyphs[cid] != null) {
            warn(`${filename}: duplicate CID: 0x${cid.toString(16)}`);
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
        help(`${filename}: added ${local_glyph_count} glyph outlines to [ ${min_cid_hex} .. ${max_cid_hex} ]`);
      } else {
        warn(`${filename}: no glyphs found`);
      }
    }
    //.........................................................................................................
    if (glyph_count === 0) {
      warn("no glyphs found; terminating");
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
      whisper(`filled ${fallback_count} positions with fallback outline from ${fallback_source}`);
    }
    min_cid_hex = '0x' + min_cid.toString(16);
    max_cid_hex = '0x' + max_cid.toString(16);
    help(`added ${glyph_count} glyph outlines to [ ${min_cid_hex} .. ${max_cid_hex} ]`);
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
    svgfont = this.svgfont_from_name_and_glyphs(font_name, glyphs);
    return this._write_ttf(svgfont, settings);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._write_ttf = function(svgfont, settings) {
    var output_route;
    output_route = settings['output-route'];
    /* svg2ttf has a strange API and returns a buffer that isn't a `Buffer`...  */
    FS.writeFileSync(output_route, new Buffer.from((svg2ttf(svgfont)).buffer));
    return help(`output written to ${output_route}`);
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
  T.FONT = function(font_name, ...P) {
    var Q;
    Q = {
      'id': font_name,
      'horiz-adv-x': options['module'] * options['scale']
    };
    // 'horiz-origin-x':   0
    // 'horiz-origin-y':   0
    // 'vert-origin-x':    0
    // 'vert-origin-y':    0
    // 'vert-adv-y':       0
    return T.TAG('font', Q, ...P);
  };

  //-----------------------------------------------------------------------------------------------------------
  T.FONT_FACE = function(font_family) {
    var Q;
    Q = {
      'font-family': font_family,
      'units-per-em': options['module'] * options['scale'],
      /* TAINT probably wrong values */
      'ascent': options['ascent'],
      'descent': options['descent']
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
      d: T._rpr_path(path)
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
  T._rpr_path = function(path) {
    var s;
    return ((function() {
      var i, len, ref, results;
      ref = path['segments'];
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
    path_txt = T._rpr_path(path);
    return T.TAG('path', {
      d: path_txt,
      fill: '#000'
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.svgfont_from_name_and_glyphs = function(font_name, glyphs) {
    return T.render(() => {
      //.........................................................................................................
      T.RAW("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
      /* must preserve space at end of DOCTYPE declaration */
      T.RAW("<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n");
      return T.SVG(() => {
        T.TEXT('\n');
        T.DEFS(() => {
          T.TEXT('\n');
          T.FONT(font_name, () => {
            var cid, i, len, path, results;
            T.TEXT('\n');
            T.FONT_FACE(font_name);
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

  //###########################################################################################################
  // HANDLE SETTINGS
  //-----------------------------------------------------------------------------------------------------------
  this._compile_settings = function(cli_options) {
    var R, i, len, name, ref;
    R = {
      'overwrite': cli_options['--force'],
      'input-format': cli_options['<input-format>'],
      'output-format': cli_options['<output-format>'],
      'input-directory': cli_options['<input-directory>'],
      'font-name': cli_options['<font-name>'],
      'output-directory': cli_options['<output-directory>']
    };
    this._get_input_routes(R);
    this._get_output_route(R);
    ref = ((function() {
      var results;
      results = [];
      for (name in R) {
        results.push(name);
      }
      return results;
    })()).sort();
    //.........................................................................................................
    for (i = 0, len = ref.length; i < len; i++) {
      name = ref[i];
      whisper((name + ':').padEnd(20), rpr(R[name]));
    }
    //.........................................................................................................
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_output_route = function(settings) {
    var R, extension, font_name, output, output_format;
    output_format = settings['output-format'];
    output = settings['output-directory'];
    font_name = settings['font-name'];
    //.........................................................................................................
    switch (output_format) {
      case 'ttf':
        extension = settings['output-extension'] = 'ttf';
        break;
      default:
        throw new Error(`output format not supported: ${rpr(output_format)}`);
    }
    //.........................................................................................................
    R = settings['output-route'] = this._join_routes(output, `${font_name}.${extension}`);
    if ((!settings['overwrite']) && FS.existsSync(R)) {
      warn(`target already exists: ${R}`);
      help("either");
      help("  * correct your input");
      help("  * or remove target first");
      help("  * or use the `-f` option");
      throw new Error("target exists");
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_input_routes = function(settings) {
    var R, extension, font_name, input_directory, input_format, name_glob, route_glob;
    input_format = settings['input-format'];
    input_directory = settings['input-directory'];
    font_name = settings['font-name'];
    //.........................................................................................................
    switch (input_format) {
      case 'svg':
      case 'svgfont':
        extension = settings['input-extension'] = 'svg';
        break;
      default:
        throw new Error(`input format not supported: ${rpr(input_format)}`);
    }
    //.........................................................................................................
    name_glob = `${font_name}-+([0-9a-f]).${extension}`;
    route_glob = settings['input-glob'] = this._join_routes(input_directory, name_glob);
    R = settings['input-routes'] = glob.sync(route_glob);
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._font_name_from_route = function(route) {
    var R, match;
    match = route.match(/([^\/]+)-[0-9a-f]+?\.svg$/);
    if (match == null) {
      throw new Error(`unable to parse route ${rpr(route)}`);
    }
    R = match[1];
    if (!(R.length > 0)) {
      throw new Error(`illegal font name in route ${rpr(route)}`);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._cid0_from_route = function(route) {
    var R, match;
    match = route.match(/-([0-9a-f]+)\.svg$/);
    if (match == null) {
      throw new Error(`unable to parse route ${rpr(route)}`);
    }
    R = parseInt(match[1], 16);
    if (!((0x0000 <= R && R <= 0x10ffff))) {
      throw new Error(`illegal CID in route ${rpr(route)}`);
    }
    return R;
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

  //###########################################################################################################
  if (module.parent == null) {
    (() => {
      var cli_options, docopt, usage, version;
      docopt = (require('coffeenode-docopt')).docopt;
      // filename  = ( require 'path' ).basename __filename
      version = (require('../package.json'))['version'];
      //.........................................................................................................
      // Usage: #{filename} svg svgfont <directory> <font-name> [<output>]
      //        #{filename} svg ttf <directory> <font-name> [<output>]
      // Usage: svgttf [-f] <input-format> <output-format> <input-directory> <font-name> <output>
      usage = "Usage: svgttf [-f] <input-directory> <font-name> <input-format> <output-directory> <output-format>\n\n      Currently the only allowed arguments are:\n      <input-format>:     must be `svg`\n      <output-format>:    must be `ttf`\n      <input-directory>:  route to directory with your SVG design sheets\n      <font-name>:        name of your font\n      <output-directory>: directory where output is written to\n\n      Please observe:\n\n      * The structure of your SVG design sheets must follow the guidelines as detailed in the\n        project README.md.\n\n      * Your font files must be named like `myfontname-e100.svg`, `myfontname-e200.svg`, ..., i.e.\n        each filename has the font name first and ends with an indication of the first CID (Unicode\n        codepoint, in hexadecimal) and the filename extension `.svg`.\n\n      * Use `.` (dot) to get a file named `myfontname.ttf` in the current directory.\n\n      * `svgttf` will not overwrite an existing file unless given the `--force` (or `-f`) option.\n\nOptions:\n  -h, --help\n  -v, --version\n  -f, --force";
      //.........................................................................................................
      cli_options = docopt(usage, {
        version: version,
        help: function(left, collected) {
          // urge left
          // help collected
          return help('\n' + usage);
        }
      });
      //.........................................................................................................
      if (cli_options != null) {
        return this.main(this._compile_settings(cli_options));
      }
    })();
  }

}).call(this);
