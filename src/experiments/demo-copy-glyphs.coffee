
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DEMO-OPENTYPE'
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
FSP                       = FS.promises
PATH                      = require 'path'
{ assign
  jr }                    = CND
{ cwd_abspath
  cwd_relpath
  here_abspath
  _drop_extension
  project_abspath }       = require '../helpers'
@types                    = require '../types'
#...........................................................................................................
{ isa
  validate
  declare
  size_of
  last_of
  type_of }               = @types
#...........................................................................................................
# _glob                     = require 'glob'
# glob                      = ( require 'util' ).promisify _glob
require                   '../exception-handler'
# PD                        = require 'pipedreams'
# SP                        = require 'steampipes'
# { $
#   $async
#   $watch
#   $show  }                = SP.export()
#...........................................................................................................
OT                        = require 'opentype.js'
path_precision            = 5
SvgPath                   = require 'svgpath'
SVGTTF                    = require '../main'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@load_font = ( path ) -> OT.loadSync path

#-----------------------------------------------------------------------------------------------------------
@save_font = ( path, font ) ->
  # FS.writeFileSync path, buffer = font.toBuffer() # deprecated
  FS.writeFileSync path, buffer = Buffer.from font.toArrayBuffer()
  return buffer.length

#-----------------------------------------------------------------------------------------------------------
@list_glyphs_in_font = ( font_or_path ) ->
  if isa.text font_or_path
    return @list_glyphs_in_font @load_font font_or_path
  #.........................................................................................................
  font  = font_or_path
  R     = new Set()
  #.........................................................................................................
  for idx, glyph of font.glyphs.glyphs
    if glyph.name in [ '.notdef', ] or ( not glyph.unicode? ) or ( glyph.unicode < 0x20 )
      warn "skipping glyph #{rpr glyph.name}"
      continue
    unicodes  = glyph.unicodes
    unicodes  = [ glyph.unicode, ] if ( not unicodes? ) or ( unicodes.length is 0 )
    # debug rpr glyph
    # debug rpr unicodes
    for cid in unicodes
      # debug rpr cid
      R.add String.fromCodePoint cid
  #.........................................................................................................
  return [ R... ].sort()


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@demo = ->
  debug '^ot#332', ( k for k of OT )
  fonts_home  = project_abspath '.', 'materials'
  filepath    = PATH.resolve PATH.join fonts_home, 'Sun-ExtA-excerpts.ttf'
  # debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/EBGaramond-InitialsF2.otf'
  font = @load_font filepath
  urge ( k for k of font )
  # info 'font.usWeightClasses    ', font.usWeightClasses
  # info 'font.encoding           ', ( k for k of font.encoding )
  # info 'font.ascender           ', font.ascender
  # info 'font.descender          ', font.descender
  keys = [
    'familyName'
    'styleName'
    'unitsPerEm'
    'ascender'
    'descender'
    'glyphNames'
    ]
  for key in keys
    info key, font[ key ]
  # font.forEachGlyph ( P... ) -> debug P
  debug type_of font.glyphs
  debug font.glyphs.length
  debug '^xx#1^ font               ', ( k for k of font                 ).sort()
  debug '^xx#2^ font.glyphs        ', ( k for k of font.glyphs          ).sort()
  debug '^xx#3^ font.glyphs.glyphs ', ( k for k of font.glyphs.glyphs   ).sort()
  for idx in [ 0, 123, 456, 0x4e00 ]
    unless ( glyph = font.glyphs.glyphs[ idx ] )?
      warn "^xxx#3773^ no such glyph: 0x#{idx.toString 16}"
      continue
    debug "#{glyph.index} #{glyph.name ? './.'} 0x#{(glyph.unicode ? 0).toString 16} #{glyph.unicodes}"
  # help ( @list_glyphs_in_font font ).join ''
  info ( @list_glyphs_in_font PATH.resolve PATH.join fonts_home, 'FandolSong-Regular.subset.otf' ).join ''

#-----------------------------------------------------------------------------------------------------------
@demo_glyph_copying = ->
  fonts_home  = project_abspath '.', 'materials'
  entries     = [
    { filename: 'Sun-ExtA-excerpts.ttf',          glyphs: '冰串丳', }
    { filename: 'FandolSong-Regular.subset.otf',  glyphs: '与丐', }
    ]
  #.........................................................................................................
  output_filepath = project_abspath 'materials', 'someglyphs.svg'
  FS.writeFileSync output_filepath, ''
  write           = ( text ) -> FS.appendFileSync output_filepath, text + '\n'
  #.........................................................................................................
  write """<?xml version="1.0" encoding="utf-8"?>"""
  write """<svg width="576" height="576">"""
  write """  <sodipodi:namedview
      pagecolor="#ffffff"
      bordercolor="#666666"
      borderopacity="1"
      objecttolerance="10"
      gridtolerance="10"
      guidetolerance="10"
      inkscape:pageopacity="0"
      inkscape:pageshadow="2"
      inkscape:window-width="1366"
      inkscape:window-height="713"
      id="namedview532"
      showgrid="true"
      inkscape:zoom="3.2332991"
      inkscape:cx="134.11925"
      inkscape:cy="119.87498"
      inkscape:window-x="0"
      inkscape:window-y="0"
      inkscape:window-maximized="1"
      inkscape:current-layer="layer:glyphs"
      inkscape:snap-global="false">
    <inkscape:grid type='xygrid' id='grid490' units='px' spacingx='36' spacingy='36'/>
  </sodipodi:namedview>
  """
  write """<g id='layer:glyphs' inkscape:groupmode='layer' inkscape:label='layer:glyphs'>"""
  #.........................................................................................................
  nr = 0
  for { filename, glyphs, } in entries
    filepath    = PATH.resolve PATH.join fonts_home, filename
    font        = @load_font filepath
    for glyph in Array.from glyphs
      nr++
      cid         = glyph.codePointAt 0
      cid_hex     = "0x#{cid.toString 16}"
      fglyph      = font.charToGlyph glyph
      path_obj    = fglyph.getPath()
      path_data   = path_obj.toPathData path_precision
      svg_path    = ( new SvgPath path_data ).abs()
      svg_path    = svg_path.abs()
      svg_path    = svg_path.scale 0.5, 0.5
      svg_path    = svg_path.translate 0 + ( nr - 1 ) * 36, 0
      svg_path    = svg_path.round path_precision
      # debug ( k for k of svg_path )
      path_data   = svg_path.toString()
      # debug path_data
      # path_data   = SVGTTF._path_data_from_svg_path svg_path
      write "<g><!-- ^xxx#3422' #{cid_hex} #{glyph} --><path d='#{path_data}'/></g>"
  #.........................................................................................................
  write """</g>"""
  write """</svg>"""
  # debug font.toTables()
  # path = '/tmp/myfont.ttf'
  # whisper "^xxx#4763^ saving font to #{path}"
  # @save_font path, font
  help "^xxx#4763^ output written to #{cwd_relpath output_filepath}"

#-----------------------------------------------------------------------------------------------------------
@demo2 = ->
  # Create the bézier paths for each of the glyphs.
  # Note that the .notdef glyph is required.
  notdefGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 650,
      path: new opentype.Path()
  })

  aPath = new opentype.Path()
  aPath.moveTo(100, 0)
  aPath.lineTo(100, 700)
  # more drawing instructions...
  aGlyph = new opentype.Glyph({
      name: 'A',
      unicode: 65,
      advanceWidth: 650,
      path: aPath
  })

  glyphs = [notdefGlyph, aGlyph]
  font = new opentype.Font({
      familyName: 'OpenTypeSans',
      styleName: 'Medium',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: glyphs})
  font.download()

############################################################################################################
if require.main is module then do =>
  # await @demo()
  await @demo_glyph_copying()

