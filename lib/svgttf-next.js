(function() {
  'use strict';
  var CND, GUY, PAPER, SVGO, badge, debug, declare, echo, help, info, isa, rpr, svg_pathify, type_of, types, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'SVGTTF2';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  types = new (require('intertype')).Intertype();

  ({validate, type_of, isa, declare} = types.export());

  PAPER = this.PAPER = require('paper-jsdom');

  SVGO = require('svgo');

  svg_pathify = require('svg_pathify');

  GUY = require('guy');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  declare('constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare('svgttf_glyf_pathdata_from_svg_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.svg": function(x) {
        return this.isa.nonempty_text(x.svg);
      },
      "@isa_optional.nonempty_text x.path": function(x) {
        return this.isa_optional.nonempty_text(x.path);
      }
    }
  });

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.Svgttf2 = (function() {
    class Svgttf2 {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        this.cfg = {...this.constructor.C.defaults.constructor_cfg, ...cfg};
        validate.constructor_cfg(this.cfg);
        this.cfg = GUY.lft.freeze(cfg);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      glyf_pathdata_from_svg(cfg) {
        var R, bbox, entry/* TAINT add to cfg */, g_dom, g_id, i, j, k, len, len1, len2, path_dom, path_id, pd, pds, project, ref, ref1, ref2, seen_pathdoms, svg_dom, sym_name/* TAINT add to cfg */;
        validate.svgttf_glyf_pathdata_from_svg_cfg((cfg = {...this.constructor.C.defaults.svgttf_glyf_pathdata_from_svg_cfg, ...cfg}));
        R = {};
        project = new PAPER.Project();
        project.importSVG(this.prepare_svg_txt(cfg.path, cfg.svg));
        svg_dom = project.exportSVG();
        seen_pathdoms = new Set();
        ref = svg_dom.querySelectorAll('g');
        //.......................................................................................................
        // debug '^34242^', @_get_dom_node_description d for d in svg_dom.querySelectorAll '*'
        /* Iterate over all groups; group IDs are used to differentiate between groups that contain outlines
           and groups that contain other stuff such as grid. */
        for (i = 0, len = ref.length; i < len; i++) {
          g_dom = ref[i];
          g_id = g_dom.getAttribute('id');
          if ((g_id == null) || (!g_id.startsWith('sym-'))) {
            continue;
          }
          sym_name = g_id.replace(/^sym-/, '');
          entry = {sym_name};
          R[sym_name] = entry;
          pds = [];
          ref1 = g_dom.querySelectorAll('path');
          // debug '^432-3^', { g_id, }
          // info '^432-4^', "group", rpr g_id
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            path_dom = ref1[j];
            if (seen_pathdoms.has(path_dom)) {
              continue;
            }
            seen_pathdoms.add(path_dom);
            path_id = path_dom.getAttribute('id');
            // debug '^432-5^', { path_id, }
            if ((path_id != null) && path_id.endsWith('-glyfmetric')) {
              pd = path_dom.getAttribute('d');
              bbox = this._boundingbox_from_pathdata(pd);
              entry.shift = {
                x: bbox.x1,
                y: bbox.y1
              };
            } else {
              pds.push(path_dom.getAttribute('d'));
            }
          }
          // urge '^432-7^', pds
          if (pds.length === 0) {
            warn(`found no paths for group ${rpr(path_id)}`);
            continue;
          }
          entry.pd = this._unite_path_data(pds);
          if (entry.shift != null) {
            entry.pd = this._shift_pathdata(entry.pd, entry.shift);
          }
        }
        ref2 = svg_dom.querySelectorAll('path');
        //.......................................................................................................
        for (k = 0, len2 = ref2.length; k < len2; k++) {
          path_dom = ref2[k];
          if (seen_pathdoms.has(path_dom)) {
            continue;
          }
          path_id = path_dom.getAttribute('id');
          if (path_id == null) {
            continue;
          }
          if (!path_id.startsWith('sym-')) {
            continue;
          }
          sym_name = path_id.replace(/^sym-/, '');
          pd = path_dom.getAttribute('d');
          R.push({sym_name, pd});
        }
        //.......................................................................................................
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      prepare_svg_txt(path, svg_txt) {
        var cfg;
        cfg = {
          path: path,
          pretty: true,
          multipass: true,
          plugins: [
            // 'preset-default'
            'cleanupAttrs', // cleanup attributes from newlines, trailing, and repeating spaces  enabled
            'mergeStyles', // merge multiple style elements into one  enabled
            'inlineStyles', // move and merge styles from <style> elements to element style attributes enabled
            'removeDoctype', // remove doctype declaration  enabled
            'removeXMLProcInst', // remove XML processing instructions  enabled
            'removeComments', // remove comments enabled
            'removeMetadata', // remove <metadata> enabled
            'removeTitle', // remove <title>  enabled
            'removeDesc', // remove <desc> enabled
            'removeUselessDefs', // remove elements of <defs> without id  enabled
            // 'removeXMLNS'                     # removes the xmlns attribute (for inline SVG)  disabled
            'removeEditorsNSData', // remove editors namespaces, elements, and attributes enabled
            'removeEmptyAttrs', // remove empty attributes enabled
            'removeHiddenElems', // remove hidden elements  enabled
            'removeEmptyText', // remove empty Text elements  enabled
            'removeEmptyContainers', // remove empty Container elements enabled
            'removeViewBox', // remove viewBox attribute when possible  enabled
            'cleanupEnableBackground', // remove or cleanup enable-background attribute when possible enabled
            'minifyStyles', // minify <style> elements content with CSSO enabled
            // 'convertStyleToAttrs'             # convert styles into attributes  disabled
            'convertColors', // convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)  enabled
            'convertPathData', // convert Path data to relative or absolute (whichever is shorter), convert one segment to another, trim useless delimiters, smart rounding, and much more  enabled
            'convertTransform', // collapse multiple transforms into one, convert matrices to the short aliases, and much more enabled
            'removeUnknownsAndDefaults', // remove unknown elements content and attributes, remove attributes with default values enabled
            'removeNonInheritableGroupAttrs', // remove non-inheritable group's "presentation" attributes  enabled
            'removeUselessStrokeAndFill', // remove useless stroke and fill attributes enabled
            'removeUnusedNS', // remove unused namespaces declaration  enabled
            // 'prefixIds'                       # prefix IDs and classes with the SVG filename or an arbitrary string disabled
            // 'cleanupIDs'                      # remove unused and minify used IDs enabled
            'cleanupNumericValues', // round numeric values to the fixed precision, remove default px units  enabled
            // 'cleanupListOfValues'             # round numeric values in attributes that take a list of numbers (like viewBox or enable-background)  disabled
            'moveElemsAttrsToGroup', // move elements' attributes to their enclosing group  enabled
            'moveGroupAttrsToElems', // move some group attributes to the contained elements  enabled
            'collapseGroups', // collapse useless groups enabled
            // 'removeRasterImages'              # remove raster images  disabled
            'mergePaths', // merge multiple Paths into one enabled
            'convertShapeToPath', // convert some basic shapes to <path> enabled
            'convertEllipseToCircle', // convert non-eccentric <ellipse> to <circle> enabled
            // 'sortAttrs'                       # sort element attributes for epic readability  disabled
            'sortDefsChildren' // sort children of <defs> in order to improve compression enabled
          ]
        };
        // 'removeDimensions'                # remove width/height and add viewBox if it's missing (opposite to removeViewBox, disable it first) disabled
        // 'removeAttrs'                     # remove attributes by pattern  disabled
        // 'removeAttributesBySelector'      # removes attributes of elements that match a CSS selector  disabled
        // 'removeElementsByAttr'            # remove arbitrary elements by ID or className  disabled
        // 'addClassesToSVGElement'          # add classnames to an outer <svg> element  disabled
        // 'addAttributesToSVGElement'       # adds attributes to an outer <svg> element disabled
        // 'removeOffCanvasPaths'            # removes elements that are drawn outside of the viewbox  disabled
        // 'removeStyleElement'              # remove <style> elements disabled
        // 'removeScriptElement'             # remove <script> elements  disabled
        // 'reusePaths'                      # Find duplicated elements and replace them with links disabled
        return svg_pathify((SVGO.optimize(svg_txt, cfg)).data);
      }

      //---------------------------------------------------------------------------------------------------------
      _get_dom_node_description(x_dom) {
        var R, i, len, name, ref, value;
        R = {
          $tag: x_dom.tagName
        };
        ref = x_dom.attributes;
        for (i = 0, len = ref.length; i < len; i++) {
          ({name, value} = ref[i]);
          R[name] = value;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _boundingbox_from_pathdata(pd) {
        var height, path_pth, width, x, y;
        PAPER.setup(new PAPER.Size(1000, 1000));
        validate.nonempty_text(pd);
        path_pth = PAPER.PathItem.create(pd);
        ({x, y, width, height} = path_pth.bounds);
        return {
          // debug '^432-11^', { x, y, width, height, }
          x1: x,
          y1: y,
          x2: x + width,
          y2: y + height,
          width,
          height
        };
      }

      //---------------------------------------------------------------------------------------------------------
      _shift_pathdata(pd, shift) {
        var path_pth;
        PAPER.setup(new PAPER.Size(1000, 1000));
        validate.nonempty_text(pd);
        path_pth = PAPER.PathItem.create(pd);
        path_pth.translate(new PAPER.Point(-shift.x, -shift.y));
        return (path_pth.exportSVG({
          asString: false,
          precision: 0
        })).getAttribute('d');
      }

      //---------------------------------------------------------------------------------------------------------
      _unite_path_data(pds) {
        var i, idx, p0_pth, ref;
        /* SVG path union: Given a list of SVG path data strings, return a single path data string that
           represents the union of all individual paths. */
        PAPER.setup(new PAPER.Size(1000, 1000));
        validate.list(pds);
        if (pds.length === 0) {
          throw new Error("^45648^ expected path data, got none");
        }
        if (pds.length === 1) {
          return pds[0];
        }
        p0_pth = PAPER.PathItem.create(pds[0]);
        for (idx = i = 1, ref = pds.length; (1 <= ref ? i < ref : i > ref); idx = 1 <= ref ? ++i : --i) {
          p0_pth = p0_pth.unite(PAPER.PathItem.create(pds[idx]));
        }
        return (p0_pth.exportSVG({
          asString: false,
          precision: 0
        })).getAttribute('d');
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Svgttf2.C = GUY.lft.freeze({
      defaults: {
        constructor_cfg: {},
        svgttf_glyf_pathdata_from_svg_cfg: {
          svg: null,
          path: '<unknownpath>'
        }
      }
    });

    return Svgttf2;

  }).call(this);

}).call(this);

//# sourceMappingURL=svgttf-next.js.map