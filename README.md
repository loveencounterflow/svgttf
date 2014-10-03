

- [SvgTtf](#svgttf)
	- [What SvgTtf does](#what-svgttf-does)
	- [How SvgTtf does what it does](#how-svgttf-does-what-it-does)
	- [What SvgTtf does not do](#what-svgttf-does-not-do)
	- [How to structure your SVG design sheet](#how-to-structure-your-svg-design-sheet)
	- [Motivation](#motivation)

> **Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*


# SvgTtf

![](https://github.com/loveencounterflow/svgttf/raw/master/art/jizura3-e000.png)

```bash
  Usage: svgttf [-f] <input-directory> <font-name> <input-format> <output-directory> <output-format>
```


```bash
node svgttf/lib/main.js -f svgttf/art svgttf-sample-font svg /tmp ttf
```

## What SvgTtf does

**SvgTtf turns ordinary SVG documents (that are structured as described below) into installable `*.ttf`
fonts.**

> There's no need to buy and / or install a font editor in case the very reduced functionalities of SvgTtf
> is enough for your project. That said, FontForge (a free editor that is easily installed—OSX users can
> download a precompiled app; you need XQuartz for it to run) can be used to fill out the details in generated
> font files (with the caveat that you will have to repeat that process each time you've generated a new
> version of your font—but i believe there are command line tools to help you with that, too).


## How SvgTtf does what it does

* There's a [W3C recommendation for defining fonts inside SVG files](http://www.w3.org/TR/SVG/fonts.html).
* Unfortunately, there seem to be no (good) editors for SVG fonts.
* But there are editors for SVG files, Inkscape and Adobe Illustrator being two.
* SvgTtf takes one or more SVG files with ordinary outlines ('path' elements) and converts the outlines
  into SVG font glyph outlines (this primarily means scaling, translating, and mirroring paths to adapt
  them to the SVG font glyph coordinate system).
* SvgTtf looks where each outline is located on a design sheet and uses the position, a metrics configuration
  (for the grid into which to place outlines) and the input filename to compute the desired target position
  (so when a file is called `xxx-ab00.svg`  and a given path sits in the fourth cell of the first row that
  means the intended target is Unicode CID U+AB04).
* SvgTtf then uses [svg2ttf](https://github.com/fontello/svg2ttf) to turn the SVG font source XML into
  a TTF binary target represention and write that into a `*.ttf` file.

## What SvgTtf does not do

*

## How to structure your SVG design sheet

In order to keep things simple, i took a few shortcuts on how


## Motivation

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

**1.** Open the `*.sfd` (i.e. FontForge) file for the target font in FontForge.

**2.** Open the design SVG file in the vector editor;

**3.** make changes to some shapes.

**4.** Then, for each new or changed outline:
  **4.1.** open a 'transport' SVG file into which i paste the outline, one at a time; save it; then
  **4.2.** change over to FontForge, double-click into the box of the codepoint where the next shape
    should appear, then
  **4.3.** from the sub-window that opens, open the `import` dialog, where i navigate to the transport file
    and select it, whereupon
  **4.4.** the preview for the new glyph appears.
  **4.5.** i can now save the `*.sfd` and generate a `*.ttf` font file.

This process is as time consuming as it is boring and prone to errors.

All of the above i can now do with a single line from the terminal:

```bash
node svgttf/lib/main.js -f svgttf/art svgttf-sample-font svg /tmp ttf
```




























