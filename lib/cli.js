(function() {
  'use strict';
  var CHR, CND, FS, PATH, SVGTTF, alert, badge, cwd_abspath, debug, declare, echo, first_of, glob, help, info, is_recognized, isa, last_of, log, program, rpr, size_of, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'SVGTTF/CLI';

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
  CHR = require('coffeenode-chr');

  /* https://github.com/loveencounterflow/coffeenode-teacup */
  // T                         = require 'coffeenode-teacup'
  glob = require('glob');

  SVGTTF = require('..');

  ({cwd_abspath} = require('./helpers'));

  //-----------------------------------------------------------------------------------------------------------
  this._compile_settings = function(settings) {
    var R;
    R = settings;
    R.sourcepath = cwd_abspath(R.sourcepath);
    R.fontname = this._font_name_from_route(R.sourcepath);
    R.cid0 = this._cid0_from_route(R.sourcepath);
    R.targetpath = cwd_abspath(PATH.dirname(R.sourcepath), R.fontname + '.ttf');
    return R;
  };

  // @_get_input_routes R
  // @_get_output_route R
  // #.........................................................................................................
  // for name in ( name for name of R ).sort()
  //   whisper ( ( name + ':' ).padEnd 20 ), rpr R[ name ]
  // #.........................................................................................................
  // debug '^5542^', R

  // #-----------------------------------------------------------------------------------------------------------
  // @_get_output_route = ( settings ) ->
  //   output_format     = settings[ 'output-format'     ]
  //   output            = settings[ 'output_directory'  ]
  //   font_name         = settings[ 'fontname'         ]
  //   #.........................................................................................................
  //   switch output_format
  //     when 'ttf'
  //       extension = settings[ 'output-extension' ] = 'ttf'
  //     else throw new Error "output format not supported: #{rpr output_format}"
  //   #.........................................................................................................
  //   R = settings[ 'output-route' ] = @_join_routes output, "#{font_name}.#{extension}"
  //   if ( not settings[ 'overwrite' ] ) and FS.existsSync R
  //     warn "target already exists: #{R}"
  //     help "either"
  //     help "  * correct your input"
  //     help "  * or remove target first"
  //     help "  * or use the `-f` option"
  //     throw new Error "target exists"

  // #-----------------------------------------------------------------------------------------------------------
  // @_get_input_routes = ( settings ) ->
  //   input_format      = settings[ 'input-format'    ]
  //   input_directory   = settings[ 'input_directory' ]
  //   font_name         = settings[ 'fontname'       ]
  //   #.........................................................................................................
  //   switch input_format
  //     when 'svg', 'svgfont'
  //       extension = settings[ 'input-extension' ] = 'svg'
  //     else throw new Error "input format not supported: #{rpr input_format}"
  //   #.........................................................................................................
  //   name_glob   = "#{font_name}-+([0-9a-f]).#{extension}"
  //   route_glob  = settings[ 'input-glob'    ] = @_join_routes input_directory, name_glob
  //   R           = settings[ 'input-routes'  ] = glob.sync route_glob
  //   return R

  //-----------------------------------------------------------------------------------------------------------
  this._font_name_from_route = function(route) {
    var R, match;
    match = route.match(/([^\/]+)-[0-9a-f]+?\.svg$/);
    if (match == null) {
      throw new Error(`^svgttfcli#555^ unable to parse route ${rpr(route)}`);
    }
    R = match[1];
    if (!(R.length > 0)) {
      throw new Error(`^svgttfcli#587^ illegal font name in route ${rpr(route)}`);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._cid0_from_route = function(route) {
    var R, match;
    match = route.match(/-([0-9a-f]+)\.svg$/);
    if (match == null) {
      throw new Error(`^svgttfcli#619^ unable to parse route ${rpr(route)}`);
    }
    R = parseInt(match[1], 16);
    if (!((0x0000 <= R && R <= 0x10ffff))) {
      throw new Error(`^svgttfcli#651^ illegal CID in route ${rpr(route)}`);
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  if (require.main !== module) {
    (() => {
      throw new Error("^svgttfcli#683^ this module cannot be imported");
    })();
  }

  //-----------------------------------------------------------------------------------------------------------
  program = require('commander');

  is_recognized = false;

  //-----------------------------------------------------------------------------------------------------------
  program.version((require('../package.json')).version).command('generate <sourcepath> [targetpath]').description("generate a *.ttf font from an SVG source").option('-f, --force', "overwrite existing *.ttf file where present").action((sourcepath, targetpath, options) => {
    var ref, ref1, settings;
    is_recognized = true;
    //.......................................................................................................
    if (options.targetpath != null) {
      throw new Error("^svgttfcli#715 setting `targetpath` not yet implemented");
    }
    //.......................................................................................................
    settings = {
      sourcepath: sourcepath,
      targetpath: (ref = options.targetpath) != null ? ref : null,
      force_overwrite: (ref1 = options.force) != null ? ref1 : false
    };
    settings = this._compile_settings(settings);
    settings = {...(require('./options')), ...settings};
    // debug '^7773^', settings
    return SVGTTF.generate(settings);
  });

  //-----------------------------------------------------------------------------------------------------------
  program.parse(process.argv);

  if (!is_recognized) {
    console.error((CND.yellow(CND.reverse("^svgttfcli#747^\n"))) + CND.red(CND.reverse(`Invalid command: ${process.argv.slice(2).join(' ')}\nSee --help for a list of available commands.`)));
    process.exit(1);
  }

  //.........................................................................................................
//   usage     = """
//   Usage: svgttf [-f] <input_directory> <fontname> <input-format> <output_directory> <output-format>

//         Currently the only allowed arguments are:
//         <input-format>:     must be `svg`
//         <output-format>:    must be `ttf`
//         <input_directory>:  route to directory with your SVG design sheets
//         <fontname>:        name of your font
//         <output_directory>: directory where output is written to

//         Please observe:

//         * The structure of your SVG design sheets must follow the guidelines as detailed in the
//           project README.md.

//         * Your font files must be named like `myfontname-e100.svg`, `myfontname-e200.svg`, ..., i.e.
//           each filename has the font name first and ends with an indication of the first CID (Unicode
//           codepoint, in hexadecimal) and the filename extension `.svg`.

//         * Use `.` (dot) to get a file named `myfontname.ttf` in the current directory.

//         * `svgttf` will not overwrite an existing file unless given the `--force` (or `-f`) option.

//   Options:
//     -h, --help
//     -v, --version
//     -f, --force
//   """
//   #.........................................................................................................
//   cli_options = docopt usage, version: version, help: ( left, collected ) ->
//     help '\n' + usage
//     urge '^svgttf#673^', left
//     help '^svgttf#674^', collected
//   #.........................................................................................................
//   if cli_options?
//     @main @_compile_settings cli_options

// # node lib/main.js --force art        svgttf-sample-font  svg /tmp      ttf
// # node lib/main.js --force materials  someglyphs          svg materials ttf

}).call(this);
