## General
### Editor's theme
**Key:** `markdowneditor.general.theme`  
**Default:** `monokai`

Type the name of available themes from the [Ace editor project](https://github.com/ajaxorg/ace/tree/master/lib/ace/theme).

### Font size
**Key:** `markdowneditor.general.font_size`  
**Default:** `12`

Font size for Markdown editor.
### Font family 
**Key:** `markdowneditor.general.font_family`

Font family which will be used for editor.

### GFM CSS
**Key:** `markdowneditor.general.include_ghfmd`  
**Default:** `true`

When enabled, GitHub Flavoured Markdown CSS will be automatically included on the frontend.
Styles will be applied only to elements with class `markdown-body`.

### GFM CSS in Manager
**Key:** `markdowneditor.general.include_ghfmd_manager`  
**Default:** `true`

When enabled, GitHub Flavoured Markdown CSS will be automatically included in the Manager, when creating/updating Resources.

### Custom CSS in Manager
**Key:** `markdowneditor.general.custom_css_manager`

If set, specified CSS file will be automatically included in Manager, when creating/updating Resources.
All definition must be prefixed with class `preview-md` to be applied on preview panel.

### Highlight.js 
**Key:** `markdowneditor.general.include_highlight`  
**Default:** `true`

When enabled, highlight.js will be automatically included on the frontend.

### Split editor
**Key:** `markdowneditor.general.split`  
**Default:** `false`

When enabled, editor will be in split mode by default.

### Split editor full screen
**Key:** `markdowneditor.general.split_fullscreen`  
**Default:** `true`

When enabled, editor will be in split mode by default when entering full screen.

## Live preview
### Parse MODX Tags
**Key:** `markdowneditor.lp.parse_modx_tags`  
**Default:** `false`

If enabled, Markdown Editor will also parse MODX tags in the preview. 
This option will send an Ajax request to the server each time you update content.

### Parse MODX Tags timeout
**Key:** `markdowneditor.lp.parse_modx_tags_timeout`  
**Default:** `300`

Delay sending an AJAX request to parse content by the specified timeout in milliseconds.

## Upload
### image_upload_path
### image_upload_url
### file_upload_path
### file_upload_url
### under_resource
### delete_unused
### enable_image_upload
### enable_file_upload
### max_size
### image_types
### file_types

## Cropper
### Enable Cropper
**Key:** `markdowneditor.cropper.enable_cropper`  
**Default:** `true`

When enabled, a pop-up window with Cropper will show before each image upload. 
In the cropper pop-up you can crop, scale and rotate image.

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

A list of profiles that users can select from in the Cropper window. Each profile is a JSON object with following properties:

- **name** (required) - Name of the profile, shows in the Profile select box in Cropper window.
- **ratio** (optional) - Ratio of the cropper box, won't allow user to crop image in different ratio. Example: `16/9` 
- **width** (optional) - Instead of Ratio, you can specify width & height and ratio will be counted automatically.
- **height** (optional) - Instead of Ratio, you can specify width & height and ratio will be counted automatically.

### Profiles description
**Key:** `markdowneditor.cropper.show_description`  
**Default:** `false`

When enabled, profiles select box will also contains profile's description with ratio, width & height.

## Resizer
### aspect_ratio_constraint
### upsize_constraint
### width
### height

## oEmbed
### service
### max_height
### max_width
### frontend_css
### default_card_color
### auto_card_color

## Embedly
### API key
**Key:** `markdowneditor.embedly.api_key`

Embedly API key, required for EmbedlyExtract and EmbedlyEmbed service. Can be obtained at [http://embed.ly/](http://embed.ly/).