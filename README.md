


# SvgTtf



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Incipient Documentation for Upcoming Version (Caveat Emptor: AYOR)](#incipient-documentation-for-upcoming-version-caveat-emptor-ayor)
- [Old Documentation](#old-documentation)
  - [SvgTtf](#svgttf)
    - [Update: Coping With XeLaTex /](#update-coping-with-xelatex-)
    - [Installation and Command line syntax:](#installation-and-command-line-syntax)
    - [What SvgTtf does](#what-svgttf-does)
    - [How SvgTtf does what it does](#how-svgttf-does-what-it-does)
    - [What SvgTtf does not do](#what-svgttf-does-not-do)
    - [How to structure your SVG design sheet, organize your workflow, keep on top of things and become a better person](#how-to-structure-your-svg-design-sheet-organize-your-workflow-keep-on-top-of-things-and-become-a-better-person)
    - [Motivation](#motivation)
    - [BONUS: SVGTTF IN PRODUCTION!](#bonus-svgttf-in-production)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Incipient Documentation for Upcoming Version (Caveat Emptor: AYOR)

* I've added SVG path unions and SVG simplification (thanks to `paper-jsdom`, `svg_pathify`, `svgo`) which
  means one can now draw outlines with any number (?) of overlapping and/or separated, (arbitrary?) SVG
  shapes (`<rect/>`, `<circle>`, ...) including explicit SVG `transform`s and still get back a single
  `<path>` element (find the (huge) SVG file
  [here](https://github.com/loveencounterflow/hengist/tree/master/assets/svgttf) to compare):

  ```coffee
  { Svgttf2 } = require '../../../apps/svgttf/lib/svgttf-next'
  svgttf2     = new Svgttf2()
  path        = '../../../assets/svgttf/svgttf2-symbol-shapes.svg'
  path        = PATH.resolve PATH.join __dirname, path
  svg         = FS.readFileSync path, { encoding: 'utf-8', }
  result      = svgttf2.glyf_pathdata_from_svg { path, svg, }
  T?.eq result, {
    wbr: { sym_name: 'wbr', shift: { x: 1448.363 }, pd: 'M0,660l-147,166h293z' },
    shy: { sym_name: 'shy', shift: { x: 499.726 }, pd: 'M-204,887h178v-802h50v802h178v70h-406z' } }
  ```



# Old Documentation

## SvgTtf

SVG design sheet—here we draw the glyph shapes:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/jizura3-e000.png)

This is what a SVG→TTF conversion may look like:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2002.31.03.jpg)

The resulting TTF font opened in FontForge—ready for any post-processing:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2002.10.12.jpg)

### Update: Coping With XeLaTex /

Turns out the present toolchain doesn't produce a 100% perfect font. More precisely,
it would appear the resulting `*.ttf` file is good enough for TeX Live 2014, but may cause

```
Segmentation fault (core dumped)
```

or a less-than-obvious notice about some 'internal error 11'. The solution is to use
[FontForge]() to read in the font file and write it out again; for details, see the
[answer to 'How to validate a font to be used with XeLaTeX, fontspec'
on tex.stackexchange.com](http://tex.stackexchange.com/a/270938/28067). A minimal FontForge
script to do this repair would be

```
#!/usr/local/bin/fontforge -lang=ff
# Note: the above is for a Homebrew-installed FF on OSX
# use /usr/bin/fontforge on most Linuxes.
Open($1);
Generate($1);
```

### Installation and Command line syntax:

Installation is as easy as

```bash
npm install svgttf
```

in case you already have NodeJS. In case you haven't got it already, this is approximately what i did
to get all of `n` (node version manager), `node`, `npm`, and `svgttf` installed on a fresh virtual
machine that i had installed with [Vagrant](https://www.vagrantup.com/):

```bash
sudo chown -R vagrant:vagrant /usr/local
sudo apt-get install git make curl
git clone https://github.com/visionmedia/n
cd n
make install
n stable
curl -L http://npmjs.org/install.sh | sh
npm install svgttf
node svgttf/lib/main.js -f svgttf/art svgttf-sample-font svg /tmp ttf
```

Just saying this because it's great how simple installing things *can* be (in this case you do have to
remember a few kitchen tricks, but i've seen worse procedures).

Once installed, use SvgTtf like this:

```bash
svgttf [-f] <input-directory> <font-name> <input-format> <output-directory> <output-format>
```

**Caveat**: binary currently not working, but this runs fine:

```bash
node svgttf/lib/main.js svgttf/art svgttf-sample-font svg /tmp ttf
```

Do

```bash
node svgttf/lib/main.js --help
```

to get some hints on what works in the current version.

### What SvgTtf does

**SvgTtf turns ordinary SVG documents (that are structured as described below) into installable `*.ttf`
fonts.**

> There's no need to buy and / or install a font editor in case the very reduced functionalities of SvgTtf
> are enough for your project. That said, FontForge (a free editor that is easily installed—OSX users can
> download a precompiled app; you need XQuartz for it to run) can be used to fill out the details in generated
> font files (with the caveat that you will have to repeat that process each time you've generated a new
> version of your font—but i believe there are command line tools to help you with that, too).


### How SvgTtf does what it does

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

### What SvgTtf does not do

* There's no concept of metadata (except for the font display name, which equals the font family name and
  the filename).
* There's (currently) no notion of character widths, no ligatures, no tricks, nothing. Each glyph will have
  the same (square) dimensions. This is all i need for now.


### How to structure your SVG design sheet, organize your workflow, keep on top of things and become a better person

In order to keep things simple, i have taken a few shortcuts when writing SvgTtf that match my specific
needs, which means that SvgTtf lacks features like variable glyph widths or easily extended options. In
fact, in this early version, you can only convert from SVG to TTF and you'll have to (fork and) edit
`src/main.coffee` (or `lib/main.js`) even to make trivial changes such as changing the design grid
size or the font's em size.

In order to get started with your own design, you may want to open `svgttf/art/svgttf-font-sample.svg` with
a program of your preference and take a closer look; it's probably a good idea to use that file as a
starting point for your own design sheet.

Here are some important points to be aware of:


* SvgTtf will only look at `<path/>` elements that are placed directly inside the `<svg>...</svg>` root
  element.

* This means if you want to hide a path element from SvgTtf, you should put it inside an SVG
  group element, `<g>...</g>`.

* Each outline should be placed inside one cell of a square grid which is currently configured to be 36
  (purely imaginary) pixels wide. I chose a round, mid-sized number to ensure good results (display size and
  zoomability) on viewers. Illustrator equates 864px with 304.8mm; when you do the math that's 72ppi,
  probably a completely meaningless value for the purpose at hand.

* In order to decide in which cell a given outline is placed, SvgTtf collects the coordinates of all the
  nodes (the 'corner points', as it were) of the outline and calculates the arithmetic mean. This means
  that the CID a shape with a lot of *points* outside of the intended target cell will be
  mis-interpreted even if the better part of its *area* is inside the target cell.

* For ease of working, i have decided to put 256 cells into a single sheet, arranged in 16 rows with 16
  cells each; also, there are two groups of 8 rows separated by one more row for codepoint indicators.

* The four topmost rows and four leftmost columns of the grid are margins (in the sample sheet, the
  margins are used for codepoint indicators, but those are purely informative and not read by SvgTtf).

* Currently, you should put a fallback shape for intermediary unused codepoints to the left and above
  the first ordinary glyph in one of your sheets (this is used to fill up all the unused spaces, as borne
  out by the screenshots above. Expect some changes here; for now it just works).

* Feel free to apply fancy colors or pattern fills to your objects, like i used a white fill for the
  fallback glyph shown in the first screenshot above. All those attributes are discarded during conversion
  to a font.

* For fonts with more than 256 glyphs, either extend the grid pattern downwards or use extra files.

* Each font source file **must** be named as `NNNNNN-XXXX.svg`, where the `NNNNNN` part represents the
  font's name (possibly with hyphens; i always avoid to use spaces for such things) and `XXXX` the
  hexadecimal notation for the Unicode codepoint (CID) of the first cell in the first row of the sheet.

* Unfortunately, SVG does not support 'layers' and 'locked objects' which means that you **(1)** must use
  groups to emulate layers, and **(2)** you'll probably want to click on the background and lock it in
  the editor, first thing after opening a design sheet (the locking is retained as long as you keep the
  file open, but is not saved to SVG).

* What's more (or, rather less), SVG doesn't support grids, either. I found that in Illustrator, defining a
  default grid and making the document size an integer multiple of the grid module works best. Make it so
  the grid lines and the top left edge of the sheet coincide.

* **When starting from scratch and exporting to SVG in Illustrator, make sure to open the so-called
  'advanced' options in the SVG options dialog. There, set the Decimal Places settings to something like,
  say, 5 or higher. Otherwise, Illustrator will fall back to a single decimal place, which will likely
  damage your artwork** (think 'ouch. bricks.'). Also, i think selecting 'Include Slicing Data' is a good
  idea.

* It's probably a good idea to keep close tabs on your artwork to avoid regressions. Work on copies until
  your workflow has settled or use `git` extensively. **SVG editors are very good in obeying your each
  and every whim until the precise moment you save and close the application, only to find out that some
  features were not stored and others got damaged.** Try and err until you feel safe. It took me 10 hours
  of creating, opening, changing, closing, re-opening, swearing, and trying one more time to arrive at
  the (as such simple) format of the sample sheet (`svgttf/art/svgttf-font-sample.svg`), just as long as
  inventing and writing version 0.0.1 of SvgTtf itself.

* When working with Inkscape, keep the overall structure of your SVG document as simple as possible as the
  program sorely lacks an object overview.

* Do not use layers, they get converted to groups anyway; use groups only, from the outset.

* To make a shape suitable for a font, convert it to a single path (sometimes dubbed a 'compound path').
  SVG doesn't have a formal concept of compound paths, but vector editors frequently have. When constructing
  from rectangles and ellipes, convert them to generic paths; when using overlapping paths, use 'combine' or
  'union' options to fuse the shapes together and remove overlaps. In order to get a shape with 'holes',
  place a smaller shape on top of a larger one and use a 'substract' option.

* When `svgttf` complains about repeated codepoints, then either some of your shapes are extending too much
  outside their proper grid cell (which is easy to see) *or* you may have inadvertently put several paths
  next to each other before fusing them into a single compound path (much harder to spot visually, but
  usually the codepoints reported should be the ones that need some merging action). When in doubt, i always
  mark all objects in the affected cells, bring them to topmost position (i.e. z-axis) and have a look into
  the layers / objects palette (sadly, not an option in Inkscape, the little beast that would as it should
  if it only could).


### Motivation

When wanting to design a font, there are a couple of things that have been really annoying to me for years:

* Good font editors are as rare as free font editors; **good *and* free font editors do not exist**
* with the one possible exception of [FontForge](http://fontforge.org/),
* which is free & open & cross-platform
* and has an amazing amount of features
* and generally produces correct outputs,
* **but** has a user interface dating back to the (methinks) 1890s (or so it feels).
* Generally, some font editors are good for editing font-specific stuff such as hinting or ligatures
* **but they all suck when it comes to define outlines by manipulating and combining nodes and splines**.
* Likewise, **good and free vector graphics editors do not exist**
* and **don't get me started on Inkscape, which is pathetic beyond fixing**. Still, it may be the only
  option available, which really sucks. Then again, the vector editing capabilities of Inkscape are way
  better than those of most if not all available font editors, free or non-free.

> So i've been using a (free, 30-days trial edition of) Adobe Illustrator which will expire soon and
> will fall back to Inkscape after that.
>
> My workflow for some years has been like this:
>
> **1.** I open the `*.sfd` (i.e. FontForge) file for the target font in FontForge, then
>
> **2.** i open the design SVG file in the vector editor;
>
> **3.** make changes to some shapes.
>
> **4.** Then, for each new or changed outline:
>   **4.1.** open a 'transport' SVG file into which i paste the outline, one at a time; save it; then
>   **4.2.** change over to FontForge, double-click into the box of the codepoint where the next shape
>     should appear, then
>   **4.3.** from the sub-window that opens, open the `import` dialog, where i navigate to the transport file
>     and select it, whereupon
>   **4.4.** the preview for the new glyph appears.
>
> **5.** i can now save the `*.sfd` and generate a `*.ttf` font file.
>
> This process is as time consuming as it is boring and prone to errors.

All of the above i can now do with a single line from the terminal:

```bash
node svgttf/lib/main.js -f svgttf/art svgttf-sample-font svg /tmp ttf
```

### BONUS: SVGTTF IN PRODUCTION!

And yes, i'm using SvgTtf in production. Here's a current session that shows off how SvgTtf reads a series
of files, skips over files without outlines, and gives a fairly detailed report on the proceedings:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.28.22.jpg)

The result opened in FontForge:

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.30.08.jpg)

These shapes i use to describe the structure of Chinese / Japanese / Korean ('Ideographic') characters; the
part shown contains stuff i need mainly for such rare / strange / archaic / astral characters as 𧪺, 𦴞, 𠉙, 𧀍, 𢕉, 𥻔, 𠔇,
𠅂, 𠴿, 𢃵, 𡩪, 𥤅, 𤜓, 𤔬, 𤕋, 𥡼, 𦌖, 𦪴, 𦪺, 𦍛, 𪛄 and so on.

Here's the produced font in action inside my
(forthcoming) [明快 MingKwai TypeTool ](https://github.com/loveencounterflow/mingkwai) (a.k.a. 'The Chinese
Typewriter' after the [ingenious invention of Mr. Lin Yutang](http://en.wikipedia.org/wiki/Chinese_typewriter#Ming_Kwai_typewriter)):

![](https://github.com/loveencounterflow/svgttf/raw/master/art/Screen%20Shot%202014-10-04%20at%2003.52.13.jpg)

























