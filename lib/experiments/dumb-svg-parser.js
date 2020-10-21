(function() {
  //-----------------------------------------------------------------------------------------------------------
  var indexOf = [].indexOf;

  this.parse = function(pathdata) {
    /* thx to https://stackoverflow.com/a/17018012 */
    var elements, i, j, k, l, len, me, piece, ref;
    me = pathdata.match(/([a-z]+[-.,\d ]*)/gi);
    for (i = k = 0, len = me.length; k < len; i = ++k) {
      piece = me[i];
      elements = piece.match(/([a-z]+|-?[.\d]*\d)/gi);
      for (j = l = 1, ref = elements.length; (1 <= ref ? l < ref : l > ref); j = 1 <= ref ? ++l : --l) {
        elements[j] = parseFloat(elements[j]);
      }
      me[i] = elements;
    }
    return me;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.scale = function(me, factor, factor_y = null) {
    var i, j, k, l, len, len1, m, n, piece, ref, ref1, ref2;
    if ((factor_y == null) || (factor_y === factor)) {
      for (i = k = 0, len = me.length; k < len; i = ++k) {
        piece = me[i];
        for (j = l = 1, ref = piece.length; (1 <= ref ? l < ref : l > ref); j = 1 <= ref ? ++l : --l) {
          piece[j] *= factor;
        }
      }
    } else {
      for (i = m = 0, len1 = me.length; m < len1; i = ++m) {
        piece = me[i];
        for (j = n = 1, ref1 = piece.length; (1 <= ref1 ? n < ref1 : n > ref1); j = 1 <= ref1 ? ++n : --n) {
          if (ref2 = piece[0], indexOf.call('Vv', ref2) >= 0) {
            piece[1] *= factor_y;
            continue;
          }
          piece[j] *= (j % 2 === 0) ? factor_y : factor;
        }
      }
    }
    return me;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.as_text = function(me) {
    var piece;
    return ((function() {
      var k, len, results;
      results = [];
      for (k = 0, len = me.length; k < len; k++) {
        piece = me[k];
        results.push(piece.join(' '));
      }
      return results;
    })()).join(' ');
  };

  //-----------------------------------------------------------------------------------------------------------
  this.as_compressed_text = function(me) {
    var R, length;
    /* NOTE: using lookbehind, lookahead entails 10% performance loss */
    // R       = R.replace /\x20(?=-)|(?<=\d)\x20(?=\D)|(?<=\D)\x20(?=\d)/g, ''
    R = this.as_text(me);
    while (true) {
      length = R.length;
      R = R.replace(/\x20(-)|(\d) (\D)|(\D) (\d)/g, '$1$2$3$4$5');
      if (R.length === length) {
        break;
      }
    }
    return R;
  };

  // path_pieces = parse pathdata
// info path_pieces
// info @scale path_pieces, 2
// info @as_text @scale path_pieces, 2

}).call(this);

//# sourceMappingURL=dumb-svg-parser.js.map