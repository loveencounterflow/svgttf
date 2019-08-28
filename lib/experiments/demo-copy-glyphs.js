(function() {
  'use strict';
  var CND, FS, FSP, OT, PATH, SVGTTF, SvgPath, _drop_extension, alert, assign, badge, cwd_abspath, cwd_relpath, debug, declare, echo, help, here_abspath, info, isa, jr, last_of, log, path_precision, project_abspath, rpr, size_of, type_of, urge, validate, warn, whisper,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DEMO-OPENTYPE';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  FSP = FS.promises;

  PATH = require('path');

  ({assign, jr} = CND);

  ({cwd_abspath, cwd_relpath, here_abspath, _drop_extension, project_abspath} = require('../helpers'));

  this.types = require('../types');

  //...........................................................................................................
  ({isa, validate, declare, size_of, last_of, type_of} = this.types);

  //...........................................................................................................
  // _glob                     = require 'glob'
  // glob                      = ( require 'util' ).promisify _glob
  require('../exception-handler');

  // PD                        = require 'pipedreams'
  // SP                        = require 'steampipes'
  // { $
  //   $async
  //   $watch
  //   $show  }                = SP.export()
  //...........................................................................................................
  OT = require('opentype.js');

  path_precision = 5;

  SvgPath = require('svgpath');

  SVGTTF = require('../main');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.load_font = function(path) {
    return OT.loadSync(path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.save_font = function(path, font) {
    var buffer;
    // FS.writeFileSync path, buffer = font.toBuffer() # deprecated
    FS.writeFileSync(path, buffer = Buffer.from(font.toArrayBuffer()));
    return buffer.length;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.list_glyphs_in_font = function(font_or_path) {
    var R, cid, font, glyph, i, idx, len, ref, ref1, unicodes;
    if (isa.text(font_or_path)) {
      return this.list_glyphs_in_font(this.load_font(font_or_path));
    }
    //.........................................................................................................
    font = font_or_path;
    R = new Set();
    ref = font.glyphs.glyphs;
    //.........................................................................................................
    for (idx in ref) {
      glyph = ref[idx];
      if (((ref1 = glyph.name) === '.notdef') || (glyph.unicode == null) || (glyph.unicode < 0x20)) {
        warn(`skipping glyph ${rpr(glyph.name)}`);
        continue;
      }
      unicodes = glyph.unicodes;
      if ((unicodes == null) || (unicodes.length === 0)) {
        unicodes = [glyph.unicode];
      }
// debug rpr glyph
// debug rpr unicodes
      for (i = 0, len = unicodes.length; i < len; i++) {
        cid = unicodes[i];
        // debug rpr cid
        R.add(String.fromCodePoint(cid));
      }
    }
    //.........................................................................................................
    return [...R].sort();
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.demo = function() {
    var filepath, font, fonts_home, glyph, i, idx, j, k, key, keys, len, len1, ref, ref1, ref2;
    debug('^ot#332', (function() {
      var results;
      results = [];
      for (k in OT) {
        results.push(k);
      }
      return results;
    })());
    fonts_home = project_abspath('.', 'materials');
    filepath = PATH.resolve(PATH.join(fonts_home, 'Sun-ExtA-excerpts.ttf'));
    // debug filepath  = PATH.resolve PATH.join fonts_home, '010-jizura-fonts/EBGaramond-InitialsF2.otf'
    font = this.load_font(filepath);
    urge((function() {
      var results;
      results = [];
      for (k in font) {
        results.push(k);
      }
      return results;
    })());
    // info 'font.usWeightClasses    ', font.usWeightClasses
    // info 'font.encoding           ', ( k for k of font.encoding )
    // info 'font.ascender           ', font.ascender
    // info 'font.descender          ', font.descender
    keys = ['familyName', 'styleName', 'unitsPerEm', 'ascender', 'descender', 'glyphNames'];
    for (i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      info(key, font[key]);
    }
    // font.forEachGlyph ( P... ) -> debug P
    debug(type_of(font.glyphs));
    debug(font.glyphs.length);
    debug('^xx#1^ font               ', ((function() {
      var results;
      results = [];
      for (k in font) {
        results.push(k);
      }
      return results;
    })()).sort());
    debug('^xx#2^ font.glyphs        ', ((function() {
      var results;
      results = [];
      for (k in font.glyphs) {
        results.push(k);
      }
      return results;
    })()).sort());
    debug('^xx#3^ font.glyphs.glyphs ', ((function() {
      var results;
      results = [];
      for (k in font.glyphs.glyphs) {
        results.push(k);
      }
      return results;
    })()).sort());
    ref = [0, 123, 456, 0x4e00];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      idx = ref[j];
      if ((glyph = font.glyphs.glyphs[idx]) == null) {
        warn(`^xxx#3773^ no such glyph: 0x${idx.toString(16)}`);
        continue;
      }
      debug(`${glyph.index} ${(ref1 = glyph.name) != null ? ref1 : './.'} 0x${((ref2 = glyph.unicode) != null ? ref2 : 0).toString(16)} ${glyph.unicodes}`);
    }
    help((this.list_glyphs_in_font(font)).join(''));
    return info((this.list_glyphs_in_font(PATH.resolve(PATH.join(fonts_home, 'FandolSong-Regular.subset.otf')))).join(''));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo_glyph_copying = function() {
    var cid, cid_hex, col_idx, entries, fglyph, filename, filepath, font, fonts_home, glyph, glyph_count, glyph_idx, glyphs, i, j, len, len1, output_filepath, path_data, path_obj, ref, row_idx, svg_path, write, δx, δy;
    fonts_home = project_abspath('.', 'materials');
    entries = [
      {
        filename: 'FandolSong-Regular.subset.otf',
        glyphs: '与丐'
      },
      {
        filename: 'Sun-ExtA-excerpts.ttf',
        glyphs: "冰串丳匚匛匜匝匞匟匠匡匢匣匤匥匦匧匨匩匪匫匬匭匮匯匰匱匲匳匴匵匶匷匸匹".replace(/\s/g,
      '')
      }
    ];
    //.........................................................................................................
    // 叠叡叢口古句另叧叨叩只叫召叭叮可台叱史右叴叵叶号司叹叺叻叼叽叾叿吀吁吂
    // 吃各吅吆吇合吉吊吋同名后吏吐向吒吓吔吕吖吗吘吙吚君吜吝吞吟吠吡吢吣吤吥
    // 否吧吨吩吪含听吭吮启吰吱吲吳吴吵吶吷吸吹吺吻吼吽吾吿呀呁呂呃呄呅呆呇呈
    // 呉告呋呌呍呎呏呐呑呒呓呔呕呖呗员呙呚呛呜呝呞呟呠呡呢呣呤呥呦呧周呩呪呫
    // 呬呭呮呯呰呱呲味呴呵呶呷呸呹呺呻呼命呾呿咀咁咂咃咄咅咆咇咈咉咊咋和咍咎
    // 咏咐咑咒咓咔咕咖咗咘咙咚咛咜咝咞咟咠咡咢咣咤咥咦咧咨咩咪咫咬咭咮咯咰咱
    // 咲咳咴咵咶咷咸咹咺咻咼咽咾咿哀品哂哃哄哅哆哇哈哉哊哋哌响哎哏哐哑哒哓哔
    // 哕哖哗哘哙哚哛哜哝哞哟哠員哢哣哤哥哦哧哨哩哪哫哬哭哮哯哰哱哲哳哴哵哶哷
    // 哸哹哺哻哼哽哾哿唀唁唂唃唄唅唆唇唈唉唊唋唌唍唎唏唐唑唒唓唔唕唖唗唘唙唚
    // 唛唜唝唞唟唠唡唢唣唤唥唦唧唨唩唪唫唬唭售
    output_filepath = project_abspath('materials', 'someglyphs-4e00.svg');
    FS.writeFileSync(output_filepath, '');
    write = function(text) {
      return FS.appendFileSync(output_filepath, text + '\n');
    };
    //.........................................................................................................
    write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    write("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1152\" height=\"36\">");
    // write """<svg width="576" height="576">"""
    write("  <sodipodi:namedview\n    pagecolor=\"#ffffff\"\n    bordercolor=\"#666666\"\n    borderopacity=\"1\"\n    objecttolerance=\"10\"\n    gridtolerance=\"10\"\n    guidetolerance=\"10\"\n    inkscape:pageopacity=\"0\"\n    inkscape:pageshadow=\"2\"\n    inkscape:window-width=\"1366\"\n    inkscape:window-height=\"713\"\n    id=\"namedview532\"\n    showgrid=\"true\"\n    inkscape:zoom=\"3.2332991\"\n    inkscape:cx=\"134.11925\"\n    inkscape:cy=\"119.87498\"\n    inkscape:window-x=\"0\"\n    inkscape:window-y=\"0\"\n    inkscape:window-maximized=\"1\"\n    inkscape:current-layer=\"layer:glyphs\"\n    inkscape:snap-global=\"false\">\n  <inkscape:grid type='xygrid' id='grid490' units='px' spacingx='36' spacingy='36' empspacing='8'/>\n</sodipodi:namedview>");
    write("<g id='layer:glyphs' inkscape:groupmode='layer' inkscape:label='layer:glyphs'>");
    //.........................................................................................................
    glyph_idx = -1;
    for (i = 0, len = entries.length; i < len; i++) {
      ({filename, glyphs} = entries[i]);
      filepath = PATH.resolve(PATH.join(fonts_home, filename));
      font = this.load_font(filepath);
      ref = Array.from(glyphs);
      for (j = 0, len1 = ref.length; j < len1; j++) {
        glyph = ref[j];
        glyph_idx++;
        col_idx = modulo(glyph_idx, 16);
        row_idx = Math.floor(glyph_idx / 16);
        cid = glyph.codePointAt(0);
        cid_hex = `0x${cid.toString(16)}`;
        fglyph = font.charToGlyph(glyph);
        path_obj = fglyph.getPath(0, 0, 36);
        path_data = path_obj.toPathData(path_precision);
        svg_path = new SvgPath(path_data);
        svg_path = svg_path.rel();
        // svg_path    = svg_path.scale 0.5, 0.5
        δx = col_idx * 36;
        δy = (row_idx + 1) * 36 - 5/* magic number 5: ascent of outline */
        svg_path = svg_path.translate(δx, δy);
        svg_path = svg_path.round(path_precision);
        // debug ( k for k of svg_path )
        path_data = svg_path.toString();
        // debug path_data
        // path_data   = SVGTTF._path_data_from_svg_path svg_path
        write(`<!-- ^xxx#3422' ${cid_hex} ${glyph} --><path d='${path_data}'/>`);
      }
    }
    // write "<g><!-- ^xxx#3422' #{cid_hex} #{glyph} --><path d='#{path_data}'/></g>"
    //.........................................................................................................
    write("</g>");
    write("</svg>");
    // debug font.toTables()
    // path = '/tmp/myfont.ttf'
    // whisper "^xxx#4763^ saving font to #{path}"
    // @save_font path, font
    glyph_count = glyph_idx + 1;
    return help(`^xxx#4763^ SVG with ${glyph_count} glyphs to ${cwd_relpath(output_filepath)}`);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo2 = function() {
    var aGlyph, aPath, font, glyphs, notdefGlyph;
    // Create the bézier paths for each of the glyphs.
    // Note that the .notdef glyph is required.
    notdefGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 650,
      path: new opentype.Path()
    });
    aPath = new opentype.Path();
    aPath.moveTo(100, 0);
    aPath.lineTo(100, 700);
    // more drawing instructions...
    aGlyph = new opentype.Glyph({
      name: 'A',
      unicode: 65,
      advanceWidth: 650,
      path: aPath
    });
    glyphs = [notdefGlyph, aGlyph];
    font = new opentype.Font({
      familyName: 'OpenTypeSans',
      styleName: 'Medium',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: glyphs
    });
    return font.download();
  };

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      // await @demo()
      return (await this.demo_glyph_copying());
    })();
  }

}).call(this);
