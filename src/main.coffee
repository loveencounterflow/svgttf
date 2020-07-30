

'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'SVGTTF/MAIN'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
test                      = require 'guy-test'
PATH                      = require 'path'
#...........................................................................................................
@types                    = require './types'
{ isa
  validate
  type_of }               = @types
OT                        = require 'opentype.js'

#-----------------------------------------------------------------------------------------------------------
@_transform_fn_as_text = ( transform_fn ) ->
  validate.svgttf_svg_transform_fn transform_fn
  [ name, p..., ] = transform_fn
  if p.length is 1 then p = p[ 0 ]
  return "#{name}(#{p})" if ( isa.text p ) or ( isa.float p )
  return "#{name}(#{p.join ','})" if isa.list p

#-----------------------------------------------------------------------------------------------------------
@_transform_as_text = ( transform ) ->
  return null unless transform?
  validate.list transform
  return null if transform.length is 0
  return "transform='#{(@_transform_fn_as_text tf for tf in transform).join ' '}'"

#-----------------------------------------------------------------------------------------------------------
@pathelement_from_glyphidx = ( me, glyph_idx, size = null, transform ) ->
  pathdata = @pathdata_from_glyphidx me, glyph_idx, size
  return null if ( not pathdata? ) or ( pathdata is '' )
  @_pathelement_from_pathdata me, pathdata, transform

#-----------------------------------------------------------------------------------------------------------
@pathdata_from_glyphidx = ( me, glyph_idx, size = null ) ->
  validate.svgttf_font me
  validate.count glyph_idx
  validate.nonnegative size if size?
  return @_fast_pathdata_from_glyphidx me, glyph_idx, size

#-----------------------------------------------------------------------------------------------------------
@_fast_pathdata_from_glyphidx = ( me, glyph_idx, size = null ) ->
  path_precision  = 0
  x               = 0
  y               = 0
  glyph           = me.otjsfont.glyphs.glyphs[ glyph_idx ]
  size            = size ? me.otjsfont.unitsPerEm
  path            = glyph.getPath x, y, size
  return path.toPathData path_precision

#-----------------------------------------------------------------------------------------------------------
@_pathelement_from_pathdata = ( me, pathdata, transform = null ) ->
  if ( tf_txt = @_transform_as_text transform )?
    return "<path #{tf_txt} d='#{pathdata}'/>"
  return "<path d='#{pathdata}'/>"

#-----------------------------------------------------------------------------------------------------------
@_get_svg = ( me, x1, y1, x2, y2, content ) ->
  validate.float x1
  validate.float y1
  validate.float x2
  validate.float y2
  R = []
  R.push "<?xml version='1.0' standalone='no'?>"
  R.push "<svg xmlns='http://www.w3.org/2000/svg' "
  ### TAINT make optional to adapt to SVG v2, see https://css-tricks.com/on-xlinkhref-being-deprecated-in-svg/ ###
  R.push "xmlns:xlink='http://www.w3.org/1999/xlink' "
  R.push "viewBox='#{x1} #{y1} #{x2} #{y2}'>"
  switch type = type_of content
    when 'text'   then R.push content
    when 'list'   then R = R.concat content
    else throw new Error "^svgttf/_get_svg_from_glyphidx@3337^ expected a text or a list, got a #{type}"
  R.push "</svg>"
  return R.join ''

#-----------------------------------------------------------------------------------------------------------
@svg_from_glyphidx = ( me, glyph_idx, size ) ->
  pathelement = @pathelement_from_glyphidx me, glyph_idx, size #, transform
  ### TAINT derive coordinates from metrics ###
  return @_get_svg me, 0, -800, 1000, 1000, pathelement

#-----------------------------------------------------------------------------------------------------------
@_get_coordinate_hints = ( me ) ->
  R = []
  R.push "<circle cx='0' cy='0' r='20' style='fill:red;'/>"
  R.push "<circle cx='0' cy='0' r='100' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='200' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='300' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='400' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='500' style='fill-opacity:0;stroke:red;stroke-width:20;'/>"
  R.push "<circle cx='0' cy='0' r='600' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='700' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='800' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='900' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  R.push "<circle cx='0' cy='0' r='1000' style='fill-opacity:0;stroke:red;stroke-width:20;'/>"
  R.push "<line x1='0' y1='0' x2='950' y2='950' style='stroke:red;stroke-width:10;'/>"
  R.push "<rect x='0' y='0' width='1000' height='1000' style='fill-opacity:0;stroke:red;stroke-width:10;'/>"
  return R

#-----------------------------------------------------------------------------------------------------------
@svg_from_harfbuzz_linotype = ( me, harfbuzz_linotype, size ) ->
  ### TAINT code duplication ###
  validate.svgttf_harfbuzz_linotype harfbuzz_linotype
  x = 0
  y = 0
  R = []
  for sort in harfbuzz_linotype
    transform   = [ [ 'translate', x, y, ], ]
    ### TAINT figure out relationship between size and upem ###
    x          += sort.x_advance * size
    if ( pathelement = @pathelement_from_glyphidx me, sort.gid, size, transform )?
      R.push '\n' + "<!--gid:#{sort.gid}-->" + pathelement
  R.push '\n'
  return @_get_svg me, 0, -800, x, 1000, R

#-----------------------------------------------------------------------------------------------------------
@get_svg_symbol_font = ( me ) ->
  # debug '^33431^', ( k for k of me.otjsfont.glyphs.glyphs ) #.glyphs[ glyph_idx ]
  # debug '^33431^', ( type_of me.otjsfont.glyphs.glyphs ) #.glyphs[ glyph_idx ]
  R = []
  for glyph_idx, glyph of me.otjsfont.glyphs.glyphs
    # continue unless 12 < glyph_idx < 22 ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    # debug glyph_idx, glyph
    ### TAINT must derive bounding box from outline ###
    # glyph.advanceWidth
    # glyph.leftSideBearing
    x1      = 0
    y1      = -800
    x2      = 1000
    y2      = 1000
    vbx_txt = "'#{x1},#{y1},#{x2},#{y2}'"
    name    = glyph.name ? 'UNKNOWN'
    id      = "g#{glyph_idx}"
    ### TAINT set width, height; ###
    # width='1000' height='1000' viewBox='0,-800,1000,1000'
    R.push "<symbol id='#{id}' viewBox=#{vbx_txt}>"
    if ( cid = glyph.unicode )?
      # glyph.unicodes
      cid_hex = ( cid.toString 16 ).padStart 4, '0'
      sfncr   = "u/#{cid_hex}"
      uglyph  = String.fromCodePoint cid
      R.push "<!-- #{sfncr} #{uglyph} -->"
    else
      R.push "<!-- #{name} -->"
    pathdata = @_fast_pathdata_from_glyphidx me, glyph_idx, null
    ### TAINT might consider to leave out glyphs without outline altogether, but OTOH symbol should not
    cause 404 not found when requested, so we leave those in FTM: ###
    if pathdata? and ( pathdata isnt '' )
      R.push @_pathelement_from_pathdata me, pathdata
    R.push "</symbol>\n"
  ### TAINT we don't need a bounding box at all for an SVG with only symbols ###
  ### TAINT alternatively, may display some sample glyphs in font symbol SVG so to have visual feedback on opening ###
  return @_get_svg me, 0, 0, 10000, 10000, R


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@font_from_path = ( path ) ->
  validate.nonempty_text path
  otjsfont = OT.loadSync path
  return { path, otjsfont, }


# ############################################################################################################
# if require.main is module then do =>



