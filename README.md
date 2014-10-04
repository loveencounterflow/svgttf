

- [SvgTtf](#svgttf)
	- [What SvgTtf does](#what-svgttf-does)
	- [How SvgTtf does what it does](#how-svgttf-does-what-it-does)
	- [What SvgTtf does not do](#what-svgttf-does-not-do)
	- [How to structure your SVG design sheet](#how-to-structure-your-svg-design-sheet)
	- [Motivation](#motivation)
	- [BONUS: SVGTTF IN PRODUCTION!](#bonus-svgttf-in-production!)

> **Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*


# SvgTtf

SVG design sheet—here we draw the glyph shapes:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/jizura3-e000.png)

This is what a SVG→TTF conversion may look like:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2002.31.03.jpg)

The resulting TTF font opened in FontForge—ready for any post-processing:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2002.10.12.jpg)


Command line syntax:

```bash
svgttf [-f] <input-directory> <font-name> <input-format> <output-directory> <output-format>
```

Caveat: binary currently not working, but this runs fine:

```bash
node svgttf/lib/main.js svgttf/art svgttf-sample-font svg /tmp ttf
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
* Unfortunately, there seem to be no (good) editors for SVG font shapes.
* But there *are* editors for ordinary SVG vector shapes (Inkscape and Adobe Illustrator being two).
* SvgTtf takes one or more SVG files with ordinary outlines ('path' elements) and converts the outlines
  into SVG font glyph outlines (this primarily means scaling, translating, and mirroring paths to adapt
  them to the SVG font glyph coordinate system).
* SvgTtf looks where each outline is located on a design sheet and uses the position, a metrics configuration
  (for the grid into which to place outlines) and the input filename to compute the desired target position
  (so when a file is called `xxx-ab00.svg`  and a given path sits in the fourth cell of the first row that
  means the intended target is Unicode CID U+AB04 in a font called `xxx.ttf`).
* SvgTtf then uses [svg2ttf](https://github.com/fontello/svg2ttf) to turn the SVG font source XML into
  a TTF binary target represention and write that into a `*.ttf` file.

## What SvgTtf does not do

* There's no concept of metadata (except for the font display name, which equals the font family name and
  the filename).
* There's (currently) no notion of character widths, no ligatures, no tricks, nothing. Each glyph will have
  the same (square) dimensions. This is all i need for now.


## How to structure your SVG design sheet

In order to keep things simple, i took a few shortcuts that match my specific needs. In order to get
started, you may want to open `svgttf/art/svgttf-font-sample.svg` with a program of your preference
and take a closer look; it's probably a good idea to use that file as a starting point for your own
design sheet.

Here are the pertinent constraints for a SvgTtf-compatible SVG design sheet:


* SvgTtf will only look at `<path/>` elements that are placed directly inside the `<svg>...</svg>` root
  element.

* This means if you want to hide a path element from SvgTtf, you should put it inside an SVG
  group element, `<g>...</g>`.

* Outlines are places inside a square grid which is currently configured to be 36 (purely imaginary) pixels
  wide.

* In order to decide in which cell a given outline is placed, SvgTtf collects the coordinates of all the
  nodes (the 'corner points', as it were) of the outline and calculates the arithmetic mean. This means
  that the CID a shape with a lot of corner points outside of the intended target cell will be
  mis-interpreted even if the beter part of its area is inside the target cell.

* For ease of working, i have decided to put 256 cells into a single sheet, arranged in 16 rows with 16
  cells each; also, there are two groups with 8 rows separated by one row for codepoint indicators.

* The four topmost and leftmost rows and columns of the grid are margins (in the sample sheet, the
  margins are used for codepoint indicators, but those are purely informative and not read by SvgTtf).

* For fonts with more than 256 glyphs, either extend the grid pattern downwards or use extra files.

* Each font source file **must** be named as `NNNNNN-XXXX.svg`, where the `NNNNNN` part represents the
  font's name (possibly with hyphens; i always avoid to use spaces for such things) and `XXXX` the
  hexadecimal notation for the Unicode codepoint (CID) of the first cell in the first row of the sheet.

* Currently, you should put a fallback shape for intermediary unused codepoints to the left and above
  the first ordinary glyph in one of your sheets (this is used to fill up all the unused spaces, as borne
  out by the screenshots above. Expect some changes here; for now it just works).

* Unfortunately, SVG does not support 'layers' and 'locked objects' which means that you **(1)** must use
  groups to emulate layers, and **(2)** you'll probably want to click on the background and lock it in
  the editor, first thing after opening a design sheet (the locking is retained as long as you keep the
  file open, but is not saved to SVG).

* What's more (or, rather less), SVG doesn't support grids, either. I found that in Illustrator, defining a
  default grid and making the document size an integer multiple of the grid module works best. Make it so
  the grid lines and the top left edge of the sheet coincide.

* **When starting from scratch and exporting to SVG in Illustrator, make sure to open the so-called
  'advanced' options in the SVG options dialog. There, set the Decimal Places settings to something like,
  say, 5 or higher. Otherwise, Illustrator will fall back to a single deximal place, which will likely
  damage your artwork.** Also, i think selecting 'Include Slicing Data' is a good idea.

* It's probably a good idea to keep close tabs on your artwork to avoid regressions. Work on copies until
  your workflow has settled or use `git` extensively. **SVG editors are very good in obeying your each
  and every whim until the precise moment you save and close the application, only to find out that some
  features were not stored and others got damaged.** Try and err until you feel safe. It took me 10 hours
  of creating, opening, changing, closing, re-opening, swearing, and trying one more time to arrive at
  the `svgttf/art/svgttf-font-sample.svg` format, just as long as inventing and writing version 0.0.1 of
  SvgTtf itself.



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

## BONUS: SVGTTF IN PRODUCTION!

And yes, i'm using SvgTtf in production. Here's a current session that shows off how SvgTtf reads a series
of files, skips over files without outlines, and gives a fairly detailed report on the proceedings:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.28.22.jpg)

The result opened in FontForge:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.30.08.jpg)

These shapes i use to describe the structure of Chinese / Japanese / Korean ('Ideographic') characters; the
part shown contains stuff i need to rare / strange / archaic / astral characters like 𧪺, 𦴞, 𠉙, 𧀍, 𢕉, 𥻔, 𠔇,
𠅂, 𠴿, 𢃵, 𡩪, 𥤅, 𤜓, 𤔬, 𤕋, 𥡼, 𦌖, 𦪴, 𦪺, 𦍛, 𪛄 and so on. Here's the stuff in action inside my
(forthcoming) [明快 MingKwai TypeTool ](https://github.com/loveencounterflow/mingkwai) (a.k.a. 'The Chinese
Typewriter' after the [ingenious invention of Mr. Lin Yutang](http://en.wikipedia.org/wiki/Chinese_typewriter#Ming_Kwai_typewriter)):

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.52.13.jpg)

























