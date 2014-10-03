

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

* Good font editors are as rare as free font editors; good *and* free font editors do not exist
* with the one possible exception of [FontForge](http://fontforge.org/),
* which has an amazing amount of features and generally prodcues correct outputs,
* **but** has a user interface dating back to the (methinks) 1890s (or so it feels).
* Generally, some font editors are good for editing font-specific stuff such as hinting or ligatures
* **but they all suck when it comes to define outlines by manipulating and combining nodes and splines**.



