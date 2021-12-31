
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'INTERTEXT/TYPES'
debug                     = CND.get_logger 'debug',     badge
alert                     = CND.get_logger 'alert',     badge
whisper                   = CND.get_logger 'whisper',   badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
info                      = CND.get_logger 'info',      badge
jr                        = JSON.stringify
Intertype                 = ( require 'intertype' ).Intertype
intertype                 = new Intertype module.exports
# L                         = @

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_font', tests:
  "x is a object":                            ( x ) -> @isa.object x
  "x.path is a nonempty_text":                ( x ) -> @isa.nonempty_text x.path
  "x.otjsfont is an object":                  ( x ) -> @isa.object x.otjsfont

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_svg_transform_fn', tests:
  "x is a list":                                ( x ) -> @isa.list x
  "x has between 2 and 6 elements":             ( x ) -> 2 <= x.length <= 6
  "x[ 0 ] is a svgttf_svg_transform_name":      ( x ) -> @isa.svgttf_svg_transform_name x[ 0 ]
  "tail of x is a svgttf_svg_transform_value":  ( x ) ->
    return @isa.svgttf_svg_transform_value x[ 1 ] if x.length is 2
    return @isa.svgttf_svg_transform_value x[ 1 .. ]

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_svg_transform_name', ( x ) ->
  x in [ 'matrix', 'rotate', 'scale', 'skewX', 'skewY', 'translate', ]

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_harfbuzz_linotype', ( x ) ->
  @isa.list_of 'svgttf_harfbuzz_linotype_sort', x

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_harfbuzz_linotype_sort', tests:
  "x is an object":                   ( x ) -> @isa.object x
  "x.upem is a positive_integer":     ( x ) -> @isa.positive_integer x.upem
  "x.gid is a count":                 ( x ) -> @isa.count x.gid
  "x.x_advance is a float":           ( x ) -> @isa.float x.x_advance

#-----------------------------------------------------------------------------------------------------------
@declare 'svgttf_svg_transform_value', ( x ) ->
  ( @isa.nonempty_text x ) or ( @isa.float x ) or ( ( @isa.list_of 'float', x ) and x.length > 0 )




