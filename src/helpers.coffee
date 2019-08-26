

'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'SVGTTF/HELPERS'
log                       = CND.get_logger 'plain',     badge
debug                     = CND.get_logger 'debug',     badge
info                      = CND.get_logger 'info',      badge
warn                      = CND.get_logger 'warn',      badge
alert                     = CND.get_logger 'alert',     badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
@cwd_abspath              = CND.cwd_abspath.bind 	CND
@cwd_relpath              = CND.cwd_relpath.bind 	CND
@here_abspath             = CND.here_abspath.bind	CND
@_drop_extension          = ( path ) -> path[ ... path.length - ( PATH.extname path ).length ]
@project_abspath          = ( ( P... ) -> @here_abspath __dirname, '..', P... ).bind @



# PATH                      = require 'path'
# #...........................................................................................................
# @assign                   = Object.assign


# info @here_abspath  '/foo/bar', '/baz/coo'
# info @cwd_abspath   '/foo/bar', '/baz/coo'
# info @here_abspath  '/baz/coo'
# info @cwd_abspath   '/baz/coo'
# info @here_abspath  '/foo/bar', 'baz/coo'
# info @cwd_abspath   '/foo/bar', 'baz/coo'
# info @here_abspath  'baz/coo'
# info @cwd_abspath   'baz/coo'
# info @here_abspath  __dirname, 'baz/coo', 'x.js'


