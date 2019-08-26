
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
  help ( @list_glyphs_in_font font ).join ''
  info ( @list_glyphs_in_font PATH.resolve PATH.join fonts_home, 'FandolSong-Regular.subset.otf' ).join ''

#-----------------------------------------------------------------------------------------------------------
@demo_glyph_copying = ->
  fonts_home  = project_abspath '.', 'materials'
  entries     = [
    { filename: 'FandolSong-Regular.subset.otf',  glyphs: '与丐', }
    { filename: 'Sun-ExtA-excerpts.ttf',          glyphs: ( """
      冰串丳匚匛匜匝匞匟匠匡匢匣匤匥匦匧匨匩匪匫匬匭匮匯匰匱匲匳匴匵匶匷匸匹
      叠叡叢口古句另叧叨叩只叫召叭叮可台叱史右叴叵叶号司叹叺叻叼叽叾叿吀吁吂
      吃各吅吆吇合吉吊吋同名后吏吐向吒吓吔吕吖吗吘吙吚君吜吝吞吟吠吡吢吣吤吥
      否吧吨吩吪含听吭吮启吰吱吲吳吴吵吶吷吸吹吺吻吼吽吾吿呀呁呂呃呄呅呆呇呈
      呉告呋呌呍呎呏呐呑呒呓呔呕呖呗员呙呚呛呜呝呞呟呠呡呢呣呤呥呦呧周呩呪呫
      呬呭呮呯呰呱呲味呴呵呶呷呸呹呺呻呼命呾呿咀咁咂咃咄咅咆咇咈咉咊咋和咍咎
      咏咐咑咒咓咔咕咖咗咘咙咚咛咜咝咞咟咠咡咢咣咤咥咦咧咨咩咪咫咬咭咮咯咰咱
      咲咳咴咵咶咷咸咹咺咻咼咽咾咿哀品哂哃哄哅哆哇哈哉哊哋哌响哎哏哐哑哒哓哔
      哕哖哗哘哙哚哛哜哝哞哟哠員哢哣哤哥哦哧哨哩哪哫哬哭哮哯哰哱哲哳哴哵哶哷
      哸哹哺哻哼哽哾哿唀唁唂唃唄唅唆唇唈唉唊唋唌唍唎唏唐唑唒唓唔唕唖唗唘唙唚
      唛唜唝唞唟唠唡唢唣唤唥唦唧唨唩唪唫唬唭售
      """.replace /\s/g, '' ), }
    ]
  #.........................................................................................................
  output_filepath = project_abspath 'materials', 'someglyphs-4e00.svg'
  FS.writeFileSync output_filepath, ''
  write           = ( text ) -> FS.appendFileSync output_filepath, text + '\n'
  #.........................................................................................................
  write """<?xml version="1.0" encoding="utf-8"?>"""
  write """<svg width="1152" height="36">"""
  # write """<svg width="576" height="576">"""
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
    <inkscape:grid type='xygrid' id='grid490' units='px' spacingx='36' spacingy='36' empspacing='8'/>
  </sodipodi:namedview>
  """
  write """<g id='layer:glyphs' inkscape:groupmode='layer' inkscape:label='layer:glyphs'>"""
  #.........................................................................................................
  glyph_idx = -1
  for { filename, glyphs, } in entries
    filepath    = PATH.resolve PATH.join fonts_home, filename
    font        = @load_font filepath
    for glyph in Array.from glyphs
      glyph_idx++
      col_idx     = glyph_idx %% 16
      row_idx     = glyph_idx // 16
      cid         = glyph.codePointAt 0
      cid_hex     = "0x#{cid.toString 16}"
      fglyph      = font.charToGlyph glyph
      path_obj    = fglyph.getPath 0, 0, 36
      path_data   = path_obj.toPathData path_precision
      svg_path    = new SvgPath path_data
      svg_path    = svg_path.rel()
      # svg_path    = svg_path.scale 0.5, 0.5
      δx          = col_idx * 36
      δy          = ( row_idx + 1 ) * 36 - 5 ### magic number 5: ascent of outline ###
      svg_path    = svg_path.translate δx, δy
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
  glyph_count = glyph_idx + 1
  help "^xxx#4763^ SVG with #{glyph_count} glyphs to #{cwd_relpath output_filepath}"

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

