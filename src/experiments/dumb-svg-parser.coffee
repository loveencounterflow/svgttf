

#-----------------------------------------------------------------------------------------------------------
@parse = ( pathdata ) ->
  ### thx to https://stackoverflow.com/a/17018012 ###
  me = pathdata.match /([a-z]+[-.,\d ]*)/gi
  for piece, i in me
    elements = piece.match /([a-z]+|-?[.\d]*\d)/gi
    for j in [ 1 ... elements.length ]
      elements[ j ] = parseFloat elements[ j ]
    me[ i ] = elements
  return me

#-----------------------------------------------------------------------------------------------------------
@scale = ( me, factor, factor_y = null ) ->
  if ( not factor_y? ) or ( factor_y is factor )
    for piece, i in me
      for j in [ 1 ... piece.length ]
        piece[ j ] *= factor
  else
    for piece, i in me
      for j in [ 1 ... piece.length ]
        if piece[ 0 ] in 'Vv'
          piece[ 1 ] *= factor_y
          continue
        piece[ j ] *= if ( j % 2 is 0 ) then factor_y else factor
  return me

#-----------------------------------------------------------------------------------------------------------
@as_text = ( me ) -> ( piece.join ' ' for piece in me ).join ' '

#-----------------------------------------------------------------------------------------------------------
@as_compressed_text = ( me ) ->
  ### NOTE: using lookbehind, lookahead entails 10% performance loss ###
  # R       = R.replace /\x20(?=-)|(?<=\d)\x20(?=\D)|(?<=\D)\x20(?=\d)/g, ''
  R = @as_text me
  loop
    length  = R.length
    R       = R.replace /\x20(-)|(\d) (\D)|(\D) (\d)/g, '$1$2$3$4$5'
    break if R.length is length
  return R

# path_pieces = parse pathdata
# info path_pieces
# info @scale path_pieces, 2
# info @as_text @scale path_pieces, 2
