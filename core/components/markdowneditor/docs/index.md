Markdown Editor is a MODX component for creating content in Markdown format. It automatically parses input into the HTML.

## Features
- Live preview
- Drag & drop upload
- Image cropper
- oEmbed through multiple services
- Resource suggestion on ctrl+space
- Parsing MODX tag in live preview
- Custom CSS for Manager preview
- Auto include GFM & Highlight on frontend

## Background
Markdown Editor uses several libraries to deliver amazing experience with editing markdown content.

Editor itself is build on top of the great JavaScript editor [Ace](http://ace.c9.io/). We uses Ace with the markdown mode and some very custom modifications to improve working with the markdown content.
Editor has enhanced list support, resource hinting (`cmd/ctrl + space`) from page title, drag & drop upload and more.

For transforming markdown into HTML editor uses JavaScript library [Remarkable](https://github.com/jonschlinkert/remarkable) with a support for GFM.
Remarkable transforms makrdown to HTML blazingly fast, so you can enjoy real live preview.

- [Ace editor](http://ace.c9.io/)
- [Remarkable](https://github.com/jonschlinkert/remarkable)
- [Cropper](https://github.com/fengyuanchen/cropper)


## Contribution
I would love to thank [Roman](https://twitter.com/@renekopcem) & [Ryan](https://twitter.com/@rthrash) for providing unmeasurable support, amazing ideas and for helping with styling the editor.

### All contributors
- [Roman Klos](https://twitter.com/@renekopcem)
- [Ryan Thrash](https://twitter.com/@rthrash)