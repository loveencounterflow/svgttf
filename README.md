

- [SvgTtf](#svgttf)
	- [What SvgTtf is for](#what-svgttf-is-for)

> **Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*


# SvgTtf

![](https://github.com/loveencounterflow/svgttf/raw/master/art/jizura3-e000.png)

```bash
  Usage: svgttf [-f] <input-directory> <font-name> <input-format> <output-directory> <output-format>
```


```bash
node svgttf/lib/main.js -f svgttf/art svgttf-sample-font svg /tmp ttf
```


## What SvgTtf is for

When wanting to design a font, there are a couple of things that really annoy me:

* Good font editors are as rare as free font editors; **good *and* free font editors do not exist**
* with the one possible exception of [FontForge](http://fontforge.org/),
* which has an amazing amount of features and generally prodcues correct outputs,
* **but** has a user interface dating back to the (methinks) 1890s (or so it feels).
* Generally, some font editors are good for editing font-specific stuff such as hinting or ligatures
* **but they all suck when it comes to define outlines by manipulating and combining nodes and splines**.
* Likewise, **good and free vector graphics editors do not exist**
* and **don't get me started on Inkscape, which is pathetic beyond fixing**. Still, it may be the only
  option available, which really sucks. Then again, the vector editing capabilities of Inkscape are way
  better than those of most if not all available font editors, free or non-free.

So i've been using a (free trial edition of) Adobe Illustrator and Inkscape to produce my glyph
outlines—simply because it works. My workflow for some years has been like this:

1. Open the `*.sfd` (i.e. FontForge) file for the target font in FontForge.

2. Open the design SVG file in the vector editor;

3. make changes to some shapes.

4. Then, for each new or changed outline:

  4.1. open a 'transport' SVG file into which i paste the outline, one at a time; save it; then

  4.2. change over to FontForge, double-click into the box of the codepoint where the next shape
    should appear, then

  4.3. from the sub-window that opens, open the `import` dialog, where i navigate to the transport file
    and select it, whereupon

  4.4. the preview for the new glyph appears.

  4.5. i can now save the `*.sfd` and generate a `*.ttf` font file.

This process is as time consuming as it is boring and prone to errors.
























