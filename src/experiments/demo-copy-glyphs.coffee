
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


#-----------------------------------------------------------------------------------------------------------
@load_font = ( path ) -> OT.loadSync path

#-----------------------------------------------------------------------------------------------------------
@save_font = ( path, font ) ->
  # FS.writeFileSync path, buffer = font.toBuffer() # deprecated
  FS.writeFileSync path, buffer = Buffer.from font.toArrayBuffer()
  return buffer.length

#-----------------------------------------------------------------------------------------------------------
@demo = ->
  debug '^ot#332', ( k for k of OT )
  fonts_home  = project_abspath '.', 'font-sources'
  # debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/simfang.ttf'
  # debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/BabelStoneHan.ttf'
  # debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/HanaMinB.ttf'
  debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/sun-exta.ttf'
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

#-----------------------------------------------------------------------------------------------------------
@demo_glyph_copying = ->
  fonts_home  = project_abspath '.', 'font-sources'
  filepath    = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/sun-exta.ttf'
  font        = @load_font filepath
  echo """<?xml version="1.0" encoding="utf-8"?><svg>"""
  for cid in [ 0x5e00 .. 0x5e01 ]
    chr   = String.fromCodePoint cid
    glyph = font.charToGlyph chr
    # debug ( k for k of glyph )
    # info glyph.getContours()
    path = glyph.getPath()
    # info path.toPathData 3 # precision
    echo '<!-- ^xxx#3422', "0x#{cid.toString 16} #{chr} -->"
    echo "<g>#{path.toSVG 3}</g>"
  echo """</svg>"""
  # debug font.toTables()
  path = '/tmp/myfont.ttf'
  whisper "^xxx#4763^ saving font to #{path}"
  # @save_font path, font
  help "^xxx#4763^ ok"

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
unless module.parent?
  do =>
    await @demo_glyph_copying()

