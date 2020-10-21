(function() {
  'use strict';
  var CND, alert, badge, debug, echo, help, info, log, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'SVGTTF/HELPERS';

  log = CND.get_logger('plain', badge);

  debug = CND.get_logger('debug', badge);

  info = CND.get_logger('info', badge);

  warn = CND.get_logger('warn', badge);

  alert = CND.get_logger('alert', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  this.cwd_abspath = CND.cwd_abspath.bind(CND);

  this.cwd_relpath = CND.cwd_relpath.bind(CND);

  this.here_abspath = CND.here_abspath.bind(CND);

  this._drop_extension = function(path) {
    return path.slice(0, path.length - (PATH.extname(path)).length);
  };

  this.project_abspath = (function(...P) {
    return this.here_abspath(__dirname, '..', ...P);
  }).bind(this);

  // PATH                      = require 'path'
// #...........................................................................................................
// @assign                   = Object.assign

  // info @here_abspath  '/foo/bar', '/baz/coo'
// info @cwd_abspath   '/foo/bar', '/baz/coo'
// info @here_abspath  '/baz/coo'
// info @cwd_abspath   '/baz/coo'
// info @here_abspath  '/foo/bar', 'baz/coo'
// info @cwd_abspath   '/foo/bar', 'baz/coo'
// info @here_abspath  'baz/coo'
// info @cwd_abspath   'baz/coo'
// info @here_abspath  __dirname, 'baz/coo', 'x.js'

}).call(this);

//# sourceMappingURL=helpers.js.map