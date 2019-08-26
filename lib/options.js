(function() {
  'use strict';
  var CHR, CND, FS, PATH, _em_size, _module, alert, badge, debug, declare, echo, first_of, glob, help, info, isa, last_of, log, options, rpr, size_of, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr.bind(CND);

  badge = 'SVGTTF/OPTIONS';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  urge = CND.get_logger('urge', badge);

  whisper = CND.get_logger('whisper', badge);

  help = CND.get_logger('help', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  //...........................................................................................................
  this.types = require('./types');

  ({isa, validate, declare, first_of, last_of, size_of, type_of} = this.types);

  //...........................................................................................................
  CHR = require('coffeenode-chr');

  glob = require('glob');

  //===========================================================================================================
  // OPTIONS
  //-----------------------------------------------------------------------------------------------------------
  _module = 36;

  _em_size = 4096;

  module.exports = options = {
    /* Coordinates of first glyph outline: */
    offset: [_module * 4, _module * 4],
    /* Ad hoc correction: */
    correction: [0, _module * 0.075],
    /* Size of grid and font design size: */
    module: _module,
    // scale:            256 / _module
    // scale:            1024 / _module
    /* Number of glyph rows between two rulers plus one: */
    block_height: 9,
    /* CID of first glyph outline: */
    row_length: 16,
    em_size: _em_size,
    ascent: +0.8 * _em_size,
    descent: -0.2 * _em_size,
    scale: _em_size / _module
  };

}).call(this);
