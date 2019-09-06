

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


#===========================================================================================================
# FONTFORGE
#-----------------------------------------------------------------------------------------------------------
@rewrite_with_fontforge = ( path ) ->
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
  FS.writeFileSync path, buffer = Buffer.from otjsfont.toArrayBuffer()
  return buffer.length

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
@glyph_and_pathdata_from_cid = ( otjsfont, cid ) ->
  XXXXX_metrics       = @new_metrics()
  validate.positive_integer cid
  fglyph              = otjsfont.charToGlyph String.fromCodePoint cid
  return null unless fglyph.unicode?
  path_obj            = fglyph.getPath 0, 0, XXXXX_metrics.font_size
  pathdata            = path_obj.toPathData path_precision
  return null if pathdata.length is 0
  svg_path            = new SvgPath pathdata
  global_glyph_scale  = XXXXX_metrics.global_glyph_scale ? 1
  scale_factor        = XXXXX_metrics.scale_factor * global_glyph_scale
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








