(function() {
  'use strict';
  var CND, Intertype, alert, badge, debug, help, info, intertype, jr, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'INTERTEXT/TYPES';

  debug = CND.get_logger('debug', badge);

  alert = CND.get_logger('alert', badge);

  whisper = CND.get_logger('whisper', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  info = CND.get_logger('info', badge);

  jr = JSON.stringify;

  Intertype = (require('intertype')).Intertype;

  intertype = new Intertype(module.exports);

  // L                         = @

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_font', {
    tests: {
      "x is a object": function(x) {
        return this.isa.object(x);
      },
      "x.path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.path);
      },
      "x.otjsfont is an object": function(x) {
        return this.isa.object(x.otjsfont);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_svg_transform_fn', {
    tests: {
      "x is a list": function(x) {
        return this.isa.list(x);
      },
      "x has between 2 and 6 elements": function(x) {
        var ref;
        return (2 <= (ref = x.length) && ref <= 6);
      },
      "x[ 0 ] is a svgttf_svg_transform_name": function(x) {
        return this.isa.svgttf_svg_transform_name(x[0]);
      },
      "tail of x is a svgttf_svg_transform_value": function(x) {
        if (x.length === 2) {
          return this.isa.svgttf_svg_transform_value(x[1]);
        }
        return this.isa.svgttf_svg_transform_value(x.slice(1));
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_svg_transform_name', function(x) {
    return x === 'matrix' || x === 'rotate' || x === 'scale' || x === 'skewX' || x === 'skewY' || x === 'translate';
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_harfbuzz_linotype', function(x) {
    return this.isa.list_of('svgttf_harfbuzz_linotype_sort', x);
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_harfbuzz_linotype_sort', {
    tests: {
      "x is an object": function(x) {
        return this.isa.object(x);
      },
      "x.upem is a positive_integer": function(x) {
        return this.isa.positive_integer(x.upem);
      },
      "x.gid is a count": function(x) {
        return this.isa.count(x.gid);
      },
      "x.x_advance is a float": function(x) {
        return this.isa.float(x.x_advance);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('svgttf_svg_transform_value', function(x) {
    return (this.isa.nonempty_text(x)) || (this.isa.float(x)) || ((this.isa.list_of('float', x)) && x.length > 0);
  });

}).call(this);

//# sourceMappingURL=types.js.map