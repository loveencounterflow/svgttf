
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
### https://github.com/loveencounterflow/coffeenode-teacup ###
T                         = require 'coffeenode-teacup'
glob                      = require 'glob'
DOMParser                 = ( require 'xmldom-silent' ).DOMParser
xpath                     = require 'xpath'
SvgPath                   = require 'svgpath'
### https://github.com/fontello/svg2ttf ###
svg2ttf                   = require 'svg2ttf'
SVGTTF                    = @
options                   = require './options'




#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@generate = ( settings ) ->
  input_routes    = settings[ 'input-routes' ]
  # debug settings
  glyphs          = {}
  glyph_count     = 0
  parser          = new DOMParser()
  select          = xpath.useNamespaces 'SVG': 'http://www.w3.org/2000/svg'
  selector        = '//SVG:svg/SVG:path'
  fallback        = null
  fallback_count  = 0
  fallback_source = null
  min_cid         = +Infinity
  max_cid         = -Infinity
  font_name       = settings.fontname
  correction      = options.correction
  info "reading files for font #{rpr font_name}"
  #.........................................................................................................
  for route in input_routes
    local_min_cid     = +Infinity
    local_max_cid     = -Infinity
    local_glyph_count = 0
    filename          = PATH.basename route
    cid0              = @_cid0_from_route route
    source            = FS.readFileSync route, encoding: 'utf-8'
    doc               = parser.parseFromString( source, 'application/xml' )
    paths             = select selector, doc
    path_count        = paths.length
    whisper "#{filename}: found #{paths.length} outlines"
    #.......................................................................................................
    for path in paths
      #.....................................................................................................
      if ( transform = path.getAttribute 'transform' )? and transform.length > 0
        match         = transform.match /^translate\(([-+.0-9]+),([-+.0-9]+)\)$/
        throw new Error "unable to parse transform #{rpr transform}" unless match?
        [ _, x, y, ]  = match
        x             = parseFloat x, 10
        y             = parseFloat y, 10
        validate.number x
        validate.number y
        transform     = [ 'translate', x, y ]
      #.....................................................................................................
      else
        transform     = null
      #.....................................................................................................
      path          = ( new SvgPath path.getAttribute 'd' ).abs()
      path          = path.translate  transform[ 1 ],  transform[ 2 ] if  transform?
      path          = path.translate correction[ 0 ], correction[ 1 ] if correction?
      center        = @center_from_absolute_path path
      [ x, y, ]     = center
      x            -= options.offset[ 0 ]
      y            -= options.offset[ 1 ]
      col           = Math.floor x / options.module
      row           = Math.floor y / options.module
      block_count   = row // options.block_height
      actual_row    = row - block_count
      cid           = cid0 + actual_row * options.row_length + col
      dx            = - ( col * options.module ) - options.offset[ 0 ]
      dy            = - ( row * options.module ) - options.offset[ 1 ]
      #.....................................................................................................
      path          = path
        .translate  dx, dy
        .scale      1, -1
        .translate  0, options.module
        .scale      options.scale
        .round      0
      #.....................................................................................................
      if cid < cid0
        prefix          = if fallback? then 're-' else ''
        fallback        = path
        fallback_source = filename
        whisper "#{filename}: #{prefix}assigned fallback"
      #.....................................................................................................
      else
        min_cid       = Math.min       min_cid, cid
        max_cid       = Math.max       max_cid, cid
        local_min_cid = Math.min local_min_cid, cid
        local_max_cid = Math.max local_max_cid, cid
        if glyphs[ cid ]?
          warn "#{filename}: duplicate CID: 0x#{cid.toString 16}"
        else
          glyphs[ cid ]       = [ cid, path, ]
          glyph_count        += 1
          local_glyph_count  += 1
    #.......................................................................................................
    if local_glyph_count > 0
      min_cid_hex = '0x' + local_min_cid.toString 16
      max_cid_hex = '0x' + local_max_cid.toString 16
      help "#{filename}: added #{local_glyph_count} glyph outlines to [ #{min_cid_hex} .. #{max_cid_hex} ]"
    else
      warn "#{filename}: no glyphs found"
  #.........................................................................................................
  if glyph_count is 0
    warn "no glyphs found; terminating"
    process.exit 1
  #.........................................................................................................
  for cid in [ min_cid .. max_cid ]
    unless glyphs[ cid ]?
      glyphs[ cid ]   = [ cid, fallback, ]
      fallback_count += 1
  if fallback_count > 0
    whisper "filled #{fallback_count} positions with fallback outline from #{fallback_source}"
  min_cid_hex = '0x' + min_cid.toString 16
  max_cid_hex = '0x' + max_cid.toString 16
  help "added #{glyph_count} glyph outlines to [ #{min_cid_hex} .. #{max_cid_hex} ]"
  #.........................................................................................................
  glyphs = ( entry for _, entry of glyphs )
  glyphs.sort ( a, b ) ->
    return +1 if a[ 0 ] > b[ 0 ]
    return -1 if a[ 0 ] < b[ 0 ]
    return  0
  #.........................................................................................................
  svgfont = @svgfont_from_name_and_glyphs font_name, glyphs
  return @_write_ttf svgfont, settings

#-----------------------------------------------------------------------------------------------------------
@_write_ttf = ( svgfont, settings ) ->
  output_route  = settings[ 'output-route' ]
  ### svg2ttf has a strange API and returns a buffer that isn't a `Buffer`...  ###
  FS.writeFileSync output_route, new Buffer.from ( svg2ttf svgfont ).buffer
  help "output written to #{output_route}"


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@center_from_absolute_path = ( path ) ->
  return @center_from_absolute_points @points_from_absolute_path path

#-----------------------------------------------------------------------------------------------------------
@center_from_absolute_points = ( path ) ->
  node_count  = path.length
  sum_x       = 0
  sum_y       = 0
  for [ x, y, ] in path
    throw new Error "found undefined points in path" unless x? and y?
    sum_x += x # if x?
    sum_y += y # if y?
  return [ sum_x / node_count, sum_y / node_count, ]

#-----------------------------------------------------------------------------------------------------------
@points_from_absolute_path = ( path ) ->
  R = []
  #.........................................................................................................
  for node in path[ 'segments' ]
    [ command, xy..., ] = node
    #.......................................................................................................
    ### Ignore closepath command: ###
    continue if /^[zZ]$/.test command
    #.......................................................................................................
    # urge '©99052', node
    throw new Error "unknown command #{rpr command} in path #{rpr path}" unless /^[MLHVCSQTA]$/.test command
    #.......................................................................................................
    switch command
      #.....................................................................................................
      when 'H'
        [ x, y, ] = [ xy[ 0 ], last_y, ]
        R.push [ x, y, ]
      #.....................................................................................................
      when 'V'
        [ x, y, ] = [ last_x, xy[ 0 ], ]
        R.push [ x, y, ]
      #.....................................................................................................
      when 'M', 'L'
        for idx in [ 0 ... xy.length ] by +2
          [ x, y, ] = [ xy[ idx ], xy[ idx + 1 ], ]
          R.push [ x, y, ]
      #.....................................................................................................
      when 'C'
        for idx in [ 0 ... xy.length ] by +6
          [ x, y, ] = [ xy[ idx + 4 ], xy[ idx + 5 ], ]
          R.push [ x, y, ]
      #.....................................................................................................
      when 'S'
        for idx in [ 0 ... xy.length ] by +4
          [ x, y, ] = [ xy[ idx + 2 ], xy[ idx + 3 ], ]
          R.push [ x, y, ]
      #.....................................................................................................
      when 'Q'
        warn rpr path
        throw new Error """
          quadratic splines (SVG path commands `q` and `Q` not yet supported; in case you're
          working with Inkscape, identify the offending path and nudge one of its control points
          slightly and save the document; this will cause Inkscape to convert the outline to a
          cubic spline.

          see http://inkscape.13.x6.nabble.com/Quadratic-beziers-td2856790.html"""
      #.....................................................................................................
      else
        warn rpr path
        throw new Error "unknown command #{rpr command} in path"
        # help [ null, null, ]
        # [ x, y, ] = [ null, null, ]
        # R.push [ x, y, ]
    #.......................................................................................................
    last_x = x
    last_y = y
  #.........................................................................................................
  return R

#===========================================================================================================
# SVG GENERATION
#-----------------------------------------------------------------------------------------------------------
T.SVG = ( P... ) ->
  Q =
    'xmlns':        'http://www.w3.org/2000/svg'
  return T.TAG 'svg', Q, P...

# <font id="icomoon" horiz-adv-x="512">
# <font-face units-per-em="512" ascent="480" descent="-32" />

#-----------------------------------------------------------------------------------------------------------
T.DEFS = ( P... ) ->
  return T.TAG 'defs', P...

#-----------------------------------------------------------------------------------------------------------
T.FONT = ( font_name, P... ) ->
  Q =
    'id':             font_name
    'horiz-adv-x':    options.module * options.scale
    # 'horiz-origin-x':   0
    # 'horiz-origin-y':   0
    # 'vert-origin-x':    0
    # 'vert-origin-y':    0
    # 'vert-adv-y':       0
  return T.TAG 'font', Q, P...

#-----------------------------------------------------------------------------------------------------------
T.FONT_FACE = ( font_family ) ->
  Q =
    'font-family':    font_family
    'units-per-em':   options.module * options.scale
    ### TAINT probably wrong values ###
    'ascent':         options.ascent
    'descent':        options.descent
  ### TAINT kludge ###
  # return T.selfClosingTag 'font-face', Q
  return T.RAW ( T.render => T.TAG 'font-face', Q ).replace /><\/font-face>$/, ' />'

#-----------------------------------------------------------------------------------------------------------
T.GLYPH = ( cid, path ) ->
  Q           =
    # unicode:  T.TEXT CHR.as_ncr cid
    unicode:  CHR.as_chr cid
    d:        SVGTTF._path_data_from_svg_path path
  return T.TAG 'glyph', Q

#-----------------------------------------------------------------------------------------------------------
T.MARKER = ( xy, r = 10 ) ->
  return T.TAG 'circle', cx: xy[ 0 ], cy: xy[ 1 ], r: r, fill: '#f00'

#-----------------------------------------------------------------------------------------------------------
@_path_data_from_svg_path = ( me ) -> ( s[ 0 ] + s[ 1 .. ].join ',' for s in me.segments ).join ' '

#-----------------------------------------------------------------------------------------------------------
T.path = ( path ) ->
  path_txt = SVGTTF._path_data_from_svg_path path
  return T.TAG 'path', d: path_txt, fill: '#000'

#-----------------------------------------------------------------------------------------------------------
@svgfont_from_name_and_glyphs = ( font_name, glyphs ) ->
  return T.render =>
    #.........................................................................................................
    T.RAW """<?xml version="1.0" encoding="utf-8"?>\n"""
    ### must preserve space at end of DOCTYPE declaration ###
    T.RAW """<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >\n"""
    T.SVG =>
      T.TEXT '\n'
      T.DEFS =>
        T.TEXT '\n'
        T.FONT font_name, =>
          T.TEXT '\n'
          T.FONT_FACE font_name
          T.TEXT '\n'
          for [ cid, path, ] in glyphs
            T.RAW "<!-- #{cid.toString 16} -->"
            T.GLYPH cid, path
            T.TEXT '\n'
        T.TEXT '\n'
      T.TEXT '\n'

  #.........................................................................................................
  return null


#===========================================================================================================
# HELPERS
#-----------------------------------------------------------------------------------------------------------
@demo = ->
  d = "M168,525.89c38,36,48,48,46,81s5,47-46,52 s-88,35-91-27s-21-73,11-92S168,525.89,168,525.89z"
  path = new SvgPath d
    .scale 0.5
    .translate 100, 200
    .abs()
    .round 0
    # .rel()
    # .round(1) # Fix js floating point error/garbage after rel()
    # .toString()
  debug JSON.stringify path
  # debug path.toString()
  help @points_from_absolute_path path
  help @center_from_absolute_path path
  debug @f path

#-----------------------------------------------------------------------------------------------------------
@_join_routes = ( P... ) -> PATH.resolve process.cwd(), PATH.join P...


