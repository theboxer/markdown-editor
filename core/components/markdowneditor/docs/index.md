## Why Markdown

Content, and content marketing, is critical today. Sometimes, though, the systems to create content get in the way, overwhelming users and offering too many options. 

Simple, intuitive tools like _Markdown Editor_ can make it easier to focus—to create sharp copy and to consistently use images and rich media. 

The [core philosophy of Markdown](http://daringfireball.net/projects/markdown/syntax#philosophy) is focused on ease of use: be as easy-to-read and easy-to-write as feasible. If you have mastered web surfing, can type, and know how to copy/paste links to websites, you possess the technical skills you need to use _Markdown Editor_. 

## How Markdown Editor Works

_Markdown Editor_ is a MODX Extra for creating content with [Markdown](http://daringfireball.net/projects/markdown/syntax). It parses Markdown-formatted text into HTML, and stores it as content for MODX websites.

_Markdown Editor_ is great for creating articles, quick blogs, instructions, lists, and any other articles that require writing. It is also great for more technical documents like code tutorials because it supports [Github Flavored Markdown](https://help.github.com/articles/github-flavored-markdown/), or “GFM”.

_Markdown Editor_ also supports embedding content from other sites just by inserting a simple link. No complex HTML or JavaScript code to deal with. To do this, it uses a technology called [oEmbed](http://www.oembed.com/). Inserting a simple link to sites like Twitter, Tumblr, MonoPrice, Amazon, Flickr, Vimeo, Youtube, Evernote, and dozens of more sites results in a beautifully formatted synopis “card” and link to those sites or images.

## Requirements
_Markdown Editor_ requires 

- MODX Revolution 2.3+
- PHP 5.4+

## Features
- Live preview
- Drag & drop upload
- Image cropper
- Full screen focused writing mode
- oEmbed through multiple services
- Resource suggestion on ctrl+space
- Parsing MODX tag in live preview
- Custom CSS for Manager preview
- Auto include GFM & Highlight on frontend

## Background
_Markdown Editor_ uses several libraries to deliver an amazing experience when editing Markdown content.

_Markdown Editor_ itself is build on top of the great JavaScript editor [Ace](http://ace.c9.io/). It uses a customized version of Ace’s Markdown mode to improve working with the Markdown content. It also has enhanced list support, drag & drop upload, and more.

When creating content, you can quickly insert a link based on MODX Resource page titles by pressing `cmd/ctrl` + `space`. This will show a list of matching pages below your cursor based on the next characters you type. Use the arrow keys and the enter key or mouse and click to choose the page. It will insert a properly formatted link to that page using the correct Markdown and MODX syntax.

For transforming markdown into HTML, _Markdown Editor_ uses the [Remarkable](https://github.com/jonschlinkert/remarkable) JavaScript library with a support for GFM. Remarkable transforms makrdown to HTML blazingly fast, so you can enjoy real live preview.

- [Ace Editor](http://ace.c9.io/)
- [Remarkable](https://github.com/jonschlinkert/remarkable)
- [Cropper](https://github.com/fengyuanchen/cropper)
- [DiffDOM](https://github.com/fiduswriter/diffDOM)

## Contribution
I would love to thank [Roman](https://twitter.com/@renekopcem) & [Ryan](https://twitter.com/@rthrash) for providing unmeasurable support, amazing ideas and for helping with styling the editor.

### Contributors
- [Roman Klos](https://twitter.com/@renekopcem)
- [Ryan Thrash](https://twitter.com/@rthrash)
- [All contributors](https://github.com/TheBoxer/markdown-editor/graphs/contributors)

## Show Your Support
If you enjoy using Markdown Editor, please consider supporting its ongoing development or showing thanks via [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FE62UABYW2V6S). 
Anything is appreciated!