

'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'SVGTTF/EXCEPTION-HANDLER'
log                       = CND.get_logger 'plain',     badge
debug                     = CND.get_logger 'debug',     badge
info                      = CND.get_logger 'info',      badge
warn                      = CND.get_logger 'warn',      badge
alert                     = CND.get_logger 'alert',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND

#-----------------------------------------------------------------------------------------------------------
@exit_handler = ( exception ) ->
  # debug '55567', rpr exception
  print               = alert
  message             = 'ROGUE EXCEPTION: ' + ( exception?.message ? "an unrecoverable condition occurred" )
  if exception?.where?
    message += '\n--------------------\n' + exception.where + '\n--------------------'
  [ head, tail..., ]  = message.split '\n'
  print CND.reverse ' ' + head + ' '
  warn line for line in tail
  ### TAINT should have a way to set exit code explicitly ###
  whisper exception?.stack ? "(exception undefined, no stack)"
  process.exit 1
@exit_handler = @exit_handler.bind @

# debug 'µ55531', __filename
# debug 'µ55531', "app:", typeof app
# check for process.type:
# if process.type is 'renderer'
# # if typeof app is 'undefined'
#   process.on 'uncaughtException',  @exit_handler
#   process.on 'unhandledRejection', @exit_handler
# else
#   urge "µ55531 using electron-unhandled"
# ( require 'electron-unhandled' ) { showDialog: true, logger: @exit_handler, }

# if process.type is 'renderer'
#   window.addEventListener 'error', ( event ) =>
#     event.preventDefault()
#     warn 'µ44333', "error:", ( k for k of event )

#   window.addEventListener 'unhandledrejection', ( event ) =>
#     event.preventDefault()
#     # warn 'µ44333', "unhandled rejection:", ( k for k of event )
#     warn 'µ44333', "unhandled rejection:", event.reason?.message ? "(no message)"


############################################################################################################
if process.type is 'renderer'
  window.addEventListener 'error', ( event ) =>
    # event.preventDefault()
    message = ( event.error?.message ? "(error without message)" ) + '\n' + ( event.error?.stack ? '' )[ ... 500 ]
    OPS.log message
    # @exit_handler event.error
    OPS.open_devtools()
    return true

  window.addEventListener 'unhandledrejection', ( event ) =>
    # event.preventDefault()
    message = ( event.reason?.message ? "(error without message)" ) + '\n' + ( event.reason?.stack ? '' )[ ... 500 ]
    OPS.log message
    # @exit_handler event.reason
    OPS.open_devtools()
    return true
else
  process.on 'uncaughtException',  @exit_handler
  process.on 'unhandledRejection', @exit_handler

