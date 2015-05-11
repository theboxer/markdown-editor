## General
### Editor's theme
**Key:** `markdowneditor.general.theme`  
**Default:** `monokai`

Type the name of available themes from the [Ace editor project](https://github.com/ajaxorg/ace/tree/master/lib/ace/theme).

### Font size
**Key:** `markdowneditor.general.font_size`  
**Default:** `12`

Font size for Markdown Editor.

### Font family 
**Key:** `markdowneditor.general.font_family`

Font family used when editing Markdown text.

### GFM CSS
**Key:** `markdowneditor.general.include_ghfmd`  
**Default:** `true`

When enabled, GitHub Flavored Markdown CSS will be automatically included on the frontend. Styles will be applied only to elements with class `markdown-body`.

### GFM CSS in Manager
**Key:** `markdowneditor.general.include_ghfmd_manager`  
**Default:** `true`

When enabled, GitHub Flavoured Markdown CSS will be automatically included in the Manager, when creating/updating Resources.

### Custom CSS in Manager
**Key:** `markdowneditor.general.custom_css_manager`

If set, specified CSS file will be automatically included in Manager, when creating/updating Resources. All definitions must be prefixed with the class `preview-md` to be applied on the preview panel.

### Highlight.js 
**Key:** `markdowneditor.general.include_highlight`  
**Default:** `true`

When enabled, _highlight.js_ will be automatically included on the frontend to provide syntax highlighting of code blocks.

### Split editor
**Key:** `markdowneditor.general.split`  
**Default:** `false`

When enabled and in the standard MODX content editing window, the Markdown Editor will be in split in half with Markdown to the left and the HTML preview to the right.

### Source
**Key:** `markdowneditor.general.source`  
**Default:** `1`

Media source that will be used in media browser for inserting files and images.

### Source select
**Key:** `markdowneditor.general.source_select`  
**Default:** `false`

If enabled, user will be able to change source when inserting files or images.

### Split editor full screen
**Key:** `markdowneditor.general.split_fullscreen`  
**Default:** `true`

When enabled and in full screen editing mode, editor will be in split mode by default when entering full screen.

## Live preview
### Parse MODX Tags
**Key:** `markdowneditor.lp.parse_modx_tags`  
**Default:** `false`

If enabled, Markdown Editor will also parse MODX tags in the preview. 
This option will send an Ajax request to the server each time you update content, delayed by the amount specified in the `Parse MODX Tags timeout` setting.

### Parse MODX Tags timeout
**Key:** `markdowneditor.lp.parse_modx_tags_timeout`  
**Default:** `300`

Delay sending an Ajax request to parse the content by the specified timeout, in milliseconds.

## Upload
### Image upload path
**Key:** `markdowneditor.upload.image_upload_path`  

The path to the directory where images will be uploaded, relative to the web root. If no path is set, images will be uploaded in `assets/u` directory.

### Image upload URL
**Key:** `markdowneditor.upload.image_upload_url`  

The URL to the image upload directory. If no URL is set, `assets/u` will be used.

### File upload path
**Key:** `markdowneditor.upload.file_upload_path`  

The path where non-image files will be uploaded. If no path is set, files will be uploaded in `assets/u` directory.

### File upload URL
**Key:** `markdowneditor.upload.file_upload_url`  

The URL to the file upload directory. If not URL is set, `assets/u` will be used.

### Under resource
**Key:** `markdowneditor.upload.under_resource`  
**Default:** `true`

When enabled, all uploaded files will be stored under a directory with name of the resource ID.

### Delete unused
**Key:** `markdowneditor.upload.delete_unused`  
**Default:** `true`

When enabled, unused images and files will be deleted from the upload directory.
[Under resource](#under-resource) setting has to be enabled.

### Image upload
**Key:** `markdowneditor.upload.enable_image_upload`  
**Default:** `true`

When enabled, users will be able to upload images.

### File upload
**Key:** `markdowneditor.upload.enable_file_upload`  
**Default:** `true`

When enabled, users will be able to upload non-image files.

### Max size
**Key:** `markdowneditor.upload.max_size`  

The maximum allowed size in bits for files or images uploaded through _Markdown Editor_. If no value is set, the value of the system setting `upload_maxsize` will be used.
If `0` is set, files with any size can be uploaded (beware of PHP upload limits).

### Image types
**Key:** `markdowneditor.upload.image_types`  
**Default:** `jpg,jpeg,png,gif,bmp`

Comma delimited list of image types that can be uploaded.

### File types
**Key:** `markdowneditor.upload.file_types`  
**Default:** `txt,html,htm,xml,js,css,zip,gz,rar,z,tgz,tar,mp3,mp4,aac,wav,au,wmv,avi,mpg,mpeg,pdf,doc,docx,xls,xlsx,ppt,pptx,odt,ods,odp,odb,odg,odf`

Comma delimited list of file types that can be uploaded.

## Cropper
### Enable Cropper
**Key:** `markdowneditor.cropper.enable_cropper`  
**Default:** `true`

When enabled, a pop-up window with Cropper will show with each image upload. 
In the cropper pop-up you can crop, scale and rotate images before they are uploaded.

### Profiles
**Key:** `markdowneditor.cropper.profiles`  
**Default:** 
```js
[{
    "name": "Free form"
},{
    "name": "Square",
    "ratio": "1/1"
},{
    "name": "4x6 wide",
    "ratio": "6/4"
},{
    "name": "5x7 wide",
    "ratio": "7/5"
},{
    "name": "1920x1080 HD",
    "width": 1920,
    "height": 1080
}]
```

A list of profiles that users can select from in the Cropper window. The first item in the list is the default for image uploads. Each profile is a JSON object with following properties:

- **name** (required) - Name of the profile, shows in the Profile select box in Cropper window.
- **ratio** (optional) - Ratio of the cropper box, won't allow user to crop image in different ratio. Example: `16/9` 
- **width** (optional) - Instead of Ratio, you can specify width & height and ratio will be counted automatically.
- **height** (optional) - Instead of Ratio, you can specify width & height and ratio will be counted automatically.

### Profiles description
**Key:** `markdowneditor.cropper.show_description`  
**Default:** `false`

When enabled, the profile select box will also contains each profile’s description with ratio, width & height.

## Resizer
### Aspect ratio constraint
**Key:** `markdowneditor.resizer.aspect_ratio_constraint`  
**Default:** `true`

When enabled, the image will keep their aspect ratio when resizing.

### Upsize constraint
**Key:** `markdowneditor.resizer.upsize_constraint`  
**Default:** `true`

When enabled, the image will _not_ be resized to a larger height or width.

### Width
**Key:** `markdowneditor.resizer.width`  
**Default:** `400`

Default width for resized images.

### Height
**Key:** `markdowneditor.resizer.height`  
**Default:** `0`

Default height for resized image.

## oEmbed
### oEmbed service
**Key:** `markdowneditor.oembed.oembed`  
**Default:** `Essence,EmbedlyCards`

Comma delimited list of oEmbed services. When more than one service is used, they will go through the list of services as fallbacks when others don't return results.

The available services include:

- [Essence](https://github.com/essence/essence)
- [Noembed](https://noembed.com/)
- [EmbedlyExtract](http://embed.ly/extract) (requires API key)
- [EmbedlyEmbed](http://embed.ly/embed) (requires API key)
- [EmbedlyCards](http://embed.ly/cards)

### Max height
**Key:** `markdowneditor.oembed.max_height`  
**Default:** `640`

Max height of received element.

### Max width
**Key:** `markdowneditor.oembed.max_width`  
**Default:** `640`

Max width of received element.

### Include services CSS
**Key:** `markdowneditor.oembed.frontend_css`  
**Default:** `1`

If enabled, CSS from specified service will be automatically included on the frontend.

### Default card's color
**Key:** `markdowneditor.oembed.default_card_color`  
**Default:** `#D71212`

Default color of each card’s stripe at the left side. Colors can be entered in any valid format for CSS.

### Auto card's color
**Key:** `markdowneditor.oembed.auto_card_color`  
**Default:** `true`

If enabled and the selected service supports auto color (e.g., Embed.ly Cards, Embed.ly Extract), the color of the card’s stripe will be generated from the favicon of the embedding url.

## Embed.ly
### API key
**Key:** `markdowneditor.embedly.api_key`

The Embed.ly API key, required for the EmbedlyExtract and EmbedlyEmbed services. An Embed.ly API key can be obtained at [http://embed.ly/](http://embed.ly/).