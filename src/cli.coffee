
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr.bind CND
badge                     = 'SVGTTF/CLI'
log                       = CND.get_logger 'plain',   badge
info                      = CND.get_logger 'info',    badge
alert                     = CND.get_logger 'alert',   badge
debug                     = CND.get_logger 'debug',   badge
warn                      = CND.get_logger 'warn',    badge
urge                      = CND.get_logger 'urge',    badge
whisper                   = CND.get_logger 'whisper', badge
help                      = CND.get_logger 'help',    badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
PATH                      = require 'path'
#...........................................................................................................
@types                    = require './types'
{ isa
  validate
  declare
  first_of
  last_of
  size_of
  type_of }               = @types
#...........................................................................................................
CHR                       = require 'coffeenode-chr'
### https://github.com/loveencounterflow/coffeenode-teacup ###
# T                         = require 'coffeenode-teacup'
glob                      = require 'glob'
SVGTTF                    = require '..'
{ cwd_abspath }           = require './helpers'

#-----------------------------------------------------------------------------------------------------------
@_compile_settings = ( settings ) ->
  R                   = settings
  R.sourcepath = cwd_abspath            R.sourcepath
  R.fontname   = @_font_name_from_route R.sourcepath
  R.cid0       = @_cid0_from_route      R.sourcepath
  R.targetpath = cwd_abspath            ( PATH.dirname R.sourcepath ), R.fontname + '.ttf'
  return R

  # @_get_input_routes R
  # @_get_output_route R
  # #.........................................................................................................
  # for name in ( name for name of R ).sort()
  #   whisper ( ( name + ':' ).padEnd 20 ), rpr R[ name ]
  # #.........................................................................................................
  # debug '^5542^', R

# #-----------------------------------------------------------------------------------------------------------
# @_get_output_route = ( settings ) ->
#   output_format     = settings[ 'output-format'     ]
#   output            = settings[ 'output_directory'  ]
#   font_name         = settings[ 'fontname'         ]
#   #.........................................................................................................
#   switch output_format
#     when 'ttf'
#       extension = settings[ 'output-extension' ] = 'ttf'
#     else throw new Error "output format not supported: #{rpr output_format}"
#   #.........................................................................................................
#   R = settings[ 'output-route' ] = @_join_routes output, "#{font_name}.#{extension}"
#   if ( not settings[ 'overwrite' ] ) and FS.existsSync R
#     warn "target already exists: #{R}"
#     help "either"
#     help "  * correct your input"
#     help "  * or remove target first"
#     help "  * or use the `-f` option"
#     throw new Error "target exists"

# #-----------------------------------------------------------------------------------------------------------
# @_get_input_routes = ( settings ) ->
#   input_format      = settings[ 'input-format'    ]
#   input_directory   = settings[ 'input_directory' ]
#   font_name         = settings[ 'fontname'       ]
#   #.........................................................................................................
#   switch input_format
#     when 'svg', 'svgfont'
#       extension = settings[ 'input-extension' ] = 'svg'
#     else throw new Error "input format not supported: #{rpr input_format}"
#   #.........................................................................................................
#   name_glob   = "#{font_name}-+([0-9a-f]).#{extension}"
#   route_glob  = settings[ 'input-glob'    ] = @_join_routes input_directory, name_glob
#   R           = settings[ 'input-routes'  ] = glob.sync route_glob
#   return R

#-----------------------------------------------------------------------------------------------------------
@_font_name_from_route = ( route ) ->
  match = route.match /([^\/]+)-[0-9a-f]+?\.svg$/
  unless match?
    throw new Error "unable to parse route #{rpr route}"
  R = match[ 1 ]
  unless R.length > 0
    throw new Error "illegal font name in route #{rpr route}"
  return R

#-----------------------------------------------------------------------------------------------------------
@_cid0_from_route = ( route ) ->
  match = route.match /-([0-9a-f]+)\.svg$/
  unless match?
    throw new Error "unable to parse route #{rpr route}"
  R = parseInt match[ 1 ], 16
  unless 0x0000 <= R <= 0x10ffff
    throw new Error "illegal CID in route #{rpr route}"
  return R

#-----------------------------------------------------------------------------------------------------------
unless require.main is module then do =>
  throw new Error "^svgttf#332^ this module cannot be imported"

#-----------------------------------------------------------------------------------------------------------
program       = require 'commander'
is_recognized = false

#-----------------------------------------------------------------------------------------------------------
program
  .version ( require '../package.json' ).version
  .command      'generate <sourcepath> [targetpath]'
  .description  "generate a *.ttf font from an SVG source"
  .option       '-f, --force', "overwrite existing *.ttf file where present"
  .action ( sourcepath, targetpath, options ) =>
    is_recognized = true
    #.......................................................................................................
    if options.targetpath?
      throw new Error "^svgttf#3309 setting `targetpath` not yet implemented"
    #.......................................................................................................
    settings      =
      sourcepath:       sourcepath
      targetpath:       options.targetpath ? null
      force_overwrite:  options.force      ? false
    settings      = @_compile_settings settings
    settings      = { ( require './options' )..., settings..., }
    debug '^7773^', settings
    # SVGTTF.generate settings

#-----------------------------------------------------------------------------------------------------------
program.parse process.argv
if not is_recognized
  console.error ( CND.yellow CND.reverse '^svgttf#3342^\n' ) + CND.red CND.reverse """
    Invalid command: #{process.argv[ 2 .. ].join ' '}
    See --help for a list of available commands."""
  process.exit 1

#.........................................................................................................
#   usage     = """
#   Usage: svgttf [-f] <input_directory> <fontname> <input-format> <output_directory> <output-format>

#         Currently the only allowed arguments are:
#         <input-format>:     must be `svg`
#         <output-format>:    must be `ttf`
#         <input_directory>:  route to directory with your SVG design sheets
#         <fontname>:        name of your font
#         <output_directory>: directory where output is written to

#         Please observe:

#         * The structure of your SVG design sheets must follow the guidelines as detailed in the
#           project README.md.

#         * Your font files must be named like `myfontname-e100.svg`, `myfontname-e200.svg`, ..., i.e.
#           each filename has the font name first and ends with an indication of the first CID (Unicode
#           codepoint, in hexadecimal) and the filename extension `.svg`.

#         * Use `.` (dot) to get a file named `myfontname.ttf` in the current directory.

#         * `svgttf` will not overwrite an existing file unless given the `--force` (or `-f`) option.

#   Options:
#     -h, --help
#     -v, --version
#     -f, --force
#   """
#   #.........................................................................................................
#   cli_options = docopt usage, version: version, help: ( left, collected ) ->
#     help '\n' + usage
#     urge '^svgttf#673^', left
#     help '^svgttf#674^', collected
#   #.........................................................................................................
#   if cli_options?
#     @main @_compile_settings cli_options

# # node lib/main.js --force art        svgttf-sample-font  svg /tmp      ttf
# # node lib/main.js --force materials  someglyphs          svg materials ttf









