

'use strict'

############################################################################################################
CND                       = require 'cnd'
CHR                       = require 'coffeenode-chr'
rpr                       = CND.rpr.bind CND
badge                     = 'SVGTTF/MAIN'
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
# exec                      = ( require 'util' ).promisify ( require 'child_process' ).exec
spawn_sync                = ( require 'child_process' ).spawnSync
# CP                        = require 'child_process'
jr                        = JSON.stringify
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
require                   './exception-handler'
#...........................................................................................................
OT                        = @_OT      = require 'opentype.js'
SvgPath                   = @_SvgPath = require 'svgpath'
path_precision            = 5

#===========================================================================================================
# METRICS
#-----------------------------------------------------------------------------------------------------------
@new_metrics = ->
  R =
    em_size:          4096  ### a.k.a. design size, grid size ###
    ascender:         null,
    descender:        null,
    font_size:        360   ### in pixels ###
    scale_factor:     null
    # ### TAINT magic number
    # for whatever reason, we have to calculate advanceWidth with an additional tracking factor:
    # advanceWidth = glyph.advanceWidth * metrics.scale_factor * metrics.tracking_factor ###
    # tracking_factor:  256 / 182
  R.scale_factor        =  R.em_size / R.font_size
  R.ascender            =  R.em_size / ( 256 / 220 )
  R.descender           = -R.em_size / 5
  # R.global_glyph_scale  = 50 / 48.5 ### TAINT value must come from configuration ###
  R.global_glyph_scale  = 256 / 248 ### TAINT value must come from configuration ###
  # R.global_glyph_scale  = 1 ### TAINT value must come from configuration ###
  return R

#-----------------------------------------------------------------------------------------------------------
@new_otjs_font = ( me, name, glyphs ) ->
  validate.nonempty_text name
  return new OT.Font {
    familyName:   name,
    styleName:    'Medium',
    unitsPerEm:   me.em_size,
    ascender:     me.ascender,
    descender:    me.descender,
    glyphs:       glyphs }

#-----------------------------------------------------------------------------------------------------------
@_find_ideographic_advance_factor = ( otjsfont ) ->
  ### In some fonts, the advance width of CJK ideographs differs from the font design size; this is
  especially true for fonts from the `cwTeXQ` series. This routine probes the font with a number of CJK
  codepoints and returns the ratio of the font design size and the advance width of the first CJK glyph.
  The function always returns 1 for fonts that do not contain CJK characters. ###
  probe = Array.from '一丁乘㐀㑔㙜𠀀𠀁𠀈𪜵𪝘𪜲𫝀𫝄𫠢𫡄𫡦𬺰𬻂'
  for chr in probe
    cid = chr.codePointAt 0
    continue unless ( glyph = @glyph_from_cid otjsfont, cid )?
    return otjsfont.unitsPerEm / glyph.advanceWidth
  return 1

#===========================================================================================================
# FONTFORGE
#-----------------------------------------------------------------------------------------------------------
@exec_fontforge_script = ( script, parameters = null ) ->
  command     = 'fontforge'
  parameters  = [ '--lang=ff', '-c', script, ( parameters ? [] )..., ]
  settings    =
    cwd:        process.cwd()
    timeout:    3 * 60 * 1000 ### TAINT make timeout configurable ###
    encoding:   'utf-8'
    shell:      false
  #.........................................................................................................
  { status
    stderr }  = spawn_sync command, parameters, settings
  #.........................................................................................................
  unless status is 0
    throw new Error """^svgttf#3309 when trying to execute `#{command} #{jr parameters}`, an error occurred:
      #{stderr}"""
  return null

#-----------------------------------------------------------------------------------------------------------
@rewrite_with_fontforge = ( path ) ->
  ### TAINT rewrite using `exec_fontforge_script()` ###
  help "^svgttf#0091 size before normalisation: #{CND.format_number @_size_from_path path} B"
  #.........................................................................................................
  command     = 'fontforge'
  parameters  = [ '--lang=ff', '-c', "Open($1); Generate($1);", path, ]
  settings    =
    cwd:        process.cwd()
    timeout:    3 * 60 * 1000
    encoding:   'utf-8'
    shell:      false
  #.........................................................................................................
  { status
    stderr }  = spawn_sync command, parameters, settings
  #.........................................................................................................
  unless status is 0
    throw new Error """^svgttf#3309 when trying to execute #{jr command} #{jr parameters}, an error occurred:
      #{stderr}"""
  #.........................................................................................................
  help "^svgttf#0091 size  after normalisation: #{CND.format_number @_size_from_path path} B"
  return null

#-----------------------------------------------------------------------------------------------------------
@_size_from_path = ( path ) ->
  try
    return ( FS.statSync path ).size
  catch error
    return null if error.code is 'ENOENT'
    throw error

#===========================================================================================================
# OPENTYPE.JS
#-----------------------------------------------------------------------------------------------------------
@otjsfont_from_path = ( path ) -> OT.loadSync path

#-----------------------------------------------------------------------------------------------------------
@save_otjsfont = ( path, otjsfont ) ->
  # FS.writeFileSync path, buffer = otjsfont.toBuffer() # deprecated
  # buffer = Buffer.from otjsfont.toArrayBuffer()
  buffer = Buffer.from @_otjsfont_toArrayBuffer otjsfont
  FS.writeFileSync path, buffer
  return buffer.length

@_otjsfont_toArrayBuffer = ( otjsfont ) ->
  sfntTable = otjsfont.toTables();
  bytes     = sfntTable.encode();
  buffer    = new ArrayBuffer(bytes.length);
  intArray  = new Uint8Array(buffer);
  ```
  for (let i = 0; i < bytes.length; i++) {
      intArray[i] = bytes[i];
  }
  ```
  return buffer;

#-----------------------------------------------------------------------------------------------------------
@list_glyphs_in_otjsfont = ( otjsfont ) ->
  R = new Set()
  #.........................................................................................................
  for idx, glyph of otjsfont.glyphs.glyphs
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

#-----------------------------------------------------------------------------------------------------------
@svg_path_from_cid = ( otjsfont, cid ) ->
  pathdata    = @svg_pathdata_from_cid otjsfont, cid
  glyph       = String.fromCodePoint cid
  cid_hex     = "0x#{cid.toString 16}"
  return "<!-- #{cid_hex} #{glyph} --><path d='#{pathdata}'/>"

#-----------------------------------------------------------------------------------------------------------
@glyph_from_cid = ( otjsfont, cid ) ->
  validate.positive_integer cid
  R = otjsfont.charToGlyph String.fromCodePoint cid
  return if R.unicode? then R else null

#-----------------------------------------------------------------------------------------------------------
@glyph_and_pathdata_from_cid = ( me, otjsfont, cid ) ->
  validate.positive_integer cid
  fglyph              = @glyph_from_cid otjsfont, cid
  return null unless fglyph?
  path_obj            = fglyph.getPath 0, 0, me.font_size
  pathdata            = path_obj.toPathData path_precision
  return null if pathdata.length is 0
  svg_path            = new SvgPath pathdata
  global_glyph_scale  = me.global_glyph_scale ? 1
  scale_factor        = me.scale_factor * global_glyph_scale
  svg_path            = svg_path.scale scale_factor, -scale_factor
  return { glyph: fglyph, pathdata: svg_path.toString(), }

#-----------------------------------------------------------------------------------------------------------
@otjspath_from_pathdata = ( pathdata ) ->
  validate.nonempty_text pathdata
  svg_path  = new SvgPath pathdata
  R         = new OT.Path()
  d = R.commands
  for [ type, tail..., ] in svg_path.segments
    # debug '^svgttf#3342', [ type, tail..., ]
    ### TAINT consider to use API (moveTo, lineTo etc) ###
    switch type
      when 'M', 'L'
        [ x, y, ] = tail
        d.push { type, x, y, }
      when 'C'
        [ x1, y1, x2, y2, x, y, ] = tail
        d.push { type, x1, y1, x2, y2, x, y, }
      when 'Q'
        [ x1, y1, x, y, ] = tail
        d.push { type, x1, y1, x, y, }
      when 'Z'
        d.push { type, }
      else throw new Error "^svgttf#2231 unknown SVG path element #{rpr type}"
  return R

#-----------------------------------------------------------------------------------------------------------
@get_fallback_glyph = ( me, shape = 'square' ) ->
  # validate.svgttf_metrics me
  '❶❷❸❹❺❻❼❽❾❿'
  validate.nonempty_text shape
  #.........................................................................................................
  width         = 3 * me.em_size // 4
  x0            = me.em_size // 8
  x1            = x0 + width
  y0            = 0
  y1            = width
  path          = new OT.Path()
  #.........................................................................................................
  switch shape
    when 'square'
      path.moveTo x0, y0
      path.lineTo x1, y0
      path.lineTo x1, y1
      path.lineTo x0, y1
      path.close()
    when 'uptriangle'
      xm = ( x0 + x1 ) // 2
      path.moveTo x0, y0
      path.lineTo x1, y0
      path.lineTo xm, y1
      path.close()
    when 'round'
      xm = ( x0 + x1 ) // 2
      ym = ( y0 + y1 ) // 2
      path.moveTo   xm, y0
      path.quadTo   x1, y0, x1, ym
      path.quadTo   x1, y1, xm, y1
      path.quadTo   x0, y1, x0, ym
      path.quadTo   x0, y0, xm, y0
      path.close()
    else throw new Error "^svgttf#3391 unknown shape #{rpr shape}"
  #.........................................................................................................
  name          = '.notdef'
  unicode       = 0
  advanceWidth  = me.em_size
  return new OT.Glyph { name, unicode, advanceWidth, path, }







