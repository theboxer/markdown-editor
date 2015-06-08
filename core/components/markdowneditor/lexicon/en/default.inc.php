<?php
/**
 * Default English Lexicon Entries for MarkdownEditor
 *
 * @package markdowneditor
 * @subpackage lexicon
 */

$_lang['markdowneditor'] = 'MarkdownEditor';
$_lang['setting_markdowneditor'] = 'MarkdownEditor';

$_lang['markdowneditor.status_bar_message'] = '<label for="[[+id]]" class="link">Select files</label> or drag & drop to upload. ';
$_lang['markdowneditor.status_bar_message_mobile'] = '<label for="[[+id]]" class="link">Select files</label>, <label for="[[+id_mobile]]" class="link">take a picture</label> or drag & drop to upload.';
$_lang['markdowneditor.status_bar_disabled'] = 'Uploading files is disabled.';
$_lang['markdowneditor.uploading_image'] = 'Uploading image: ';
$_lang['markdowneditor.uploading_file'] = 'Uploading file: ';
$_lang['markdowneditor.cropper.crop_image'] = 'Crop the image';
$_lang['markdowneditor.cropper.move'] = 'Move';
$_lang['markdowneditor.cropper.crop'] = 'Crop';
$_lang['markdowneditor.cropper.zoom_in'] = 'Zoom In';
$_lang['markdowneditor.cropper.zoom_out'] = 'Zoom Out';
$_lang['markdowneditor.cropper.rotate_left'] = 'Rotate left';
$_lang['markdowneditor.cropper.rotate_right'] = 'Rotate right';
$_lang['markdowneditor.cropper.clear_cropper'] = 'Clear cropper';
$_lang['markdowneditor.cropper.upload'] = 'Upload';
$_lang['markdowneditor.cropper.crop_upload'] = 'Crop & Upload';

$_lang['markdowneditor.toolbox.preview'] = 'Preview';
$_lang['markdowneditor.toolbox.fullscree'] = 'Toggle Full screen';
$_lang['markdowneditor.toolbox.split_screen'] = 'Toggle Split screen';
$_lang['markdowneditor.toolbox.hide_preview'] = 'Close preview';
$_lang['markdowneditor.toolbox.toolbox'] = 'Toggle Tool box';
$_lang['markdowneditor.toolbox.media_browser'] = 'Browse media';
$_lang['markdowneditor.toolbox.media_upload'] = 'Upload media';
$_lang['markdowneditor.toolbox.oembed'] = 'Embed URL';
$_lang['markdowneditor.toolbox.camera_upload'] = 'Take a picture';

$_lang['markdowneditor.oembed.embed_url'] = 'Embed URL';
$_lang['markdowneditor.oembed.url'] = 'URL';
$_lang['markdowneditor.oembed.read_more'] = 'Read more';
$_lang['markdowneditor.oembed.show_details'] = 'Show details…';
$_lang['markdowneditor.oembed.hide_details'] = 'Hide details';

$_lang['area_markdowneditor.area.cropper'] = 'Cropper';
$_lang['area_markdowneditor.area.lp'] = 'Live preview';
$_lang['area_markdowneditor.area.upload'] = 'Upload';
$_lang['area_markdowneditor.area.resizer'] = 'Resizer';
$_lang['area_markdowneditor.area.general'] = 'General';
$_lang['area_markdowneditor.area.oembed'] = 'oEmbed';
$_lang['area_markdowneditor.area.embedly'] = 'Embedly';
$_lang['area_markdowneditor.area.init'] = 'Init';

$_lang['setting_markdowneditor.lp.parse_modx_tags'] = 'Parse MODX Tags';
$_lang['setting_markdowneditor.lp.parse_modx_tags_desc'] = 'If set to yes, Markdown Editor will also parse MODX tags in preview. This option will send an Ajax request to the server each time you update content.';
$_lang['setting_markdowneditor.lp.parse_modx_tags_timeout'] = 'Parse MODX Tags timeout';
$_lang['setting_markdowneditor.lp.parse_modx_tags_timeout_desc'] = 'Delay parsing by the specified timeout in milliseconds.';
$_lang['setting_markdowneditor.upload.image_upload_path'] = 'Image upload path';
$_lang['setting_markdowneditor.upload.image_upload_path_desc'] = 'Path where to upload images.';
$_lang['setting_markdowneditor.upload.image_upload_url'] = 'Image upload URL';
$_lang['setting_markdowneditor.upload.image_upload_url_desc'] = 'URL to the image upload directory.';
$_lang['setting_markdowneditor.upload.file_upload_path'] = 'File upload path';
$_lang['setting_markdowneditor.upload.file_upload_path_desc'] = 'Path where to upload files.';
$_lang['setting_markdowneditor.upload.file_upload_url'] = 'File upload URL';
$_lang['setting_markdowneditor.upload.file_upload_url_desc'] = 'URL to the file upload directory.';
$_lang['setting_markdowneditor.cropper.enable_cropper'] = 'Enable Cropper';
$_lang['setting_markdowneditor.cropper.enable_cropper_desc'] = 'When enabled, a pop-up window with Cropper will show before each image upload.';
$_lang['setting_markdowneditor.resizer.aspect_ratio_constraint'] = 'Aspect ratio constraint';
$_lang['setting_markdowneditor.resizer.aspect_ratio_constraint_desc'] = 'When enabled, the image will keep their aspect ratio when resizing.';
$_lang['setting_markdowneditor.resizer.upsize_constraint'] = 'Upsize constraint';
$_lang['setting_markdowneditor.resizer.upsize_constraint_desc'] = 'When enabled, the image will not be resized to a larger height or width.';
$_lang['setting_markdowneditor.resizer.width'] = 'Width';
$_lang['setting_markdowneditor.resizer.width_desc'] = 'Width of a resized image.';
$_lang['setting_markdowneditor.resizer.height'] = 'Height';
$_lang['setting_markdowneditor.resizer.height_desc'] = 'Height of a resized image.';
$_lang['setting_markdowneditor.general.theme'] = 'Editor\'s theme';
$_lang['setting_markdowneditor.general.theme_desc'] = 'Type the name of available themes from the <a href="https://github.com/ajaxorg/ace/tree/master/lib/ace/theme">Ace editor project</a>.';
$_lang['setting_markdowneditor.upload.under_resource'] = 'Under resource';
$_lang['setting_markdowneditor.upload.under_resource_desc'] = 'When enabled, all uploaded files will be stored under directory with name of resource ID.';
$_lang['setting_markdowneditor.upload.delete_unused'] = 'Delete unused';
$_lang['setting_markdowneditor.upload.delete_unused_desc'] = 'When enabled, unused images and files will be deleted from the upload directory. <strong>Under resource</strong> setting has to be enabled.';
$_lang['setting_markdowneditor.general.include_ghfmd'] = 'GFM CSS';
$_lang['setting_markdowneditor.general.include_ghfmd_desc'] = 'When enabled, GitHub Flavoured Markdown CSS will be automatically included on the frontend.<br />Styles will be applied only to element with class <strong>markdown-body</strong>.';
$_lang['setting_markdowneditor.general.include_highlight'] = 'Highlight.js';
$_lang['setting_markdowneditor.general.include_highlight_desc'] = 'When enabled, highlight.js will be automatically included on the frontend.';
$_lang['setting_markdowneditor.upload.enable_image_upload'] = 'Image upload';
$_lang['setting_markdowneditor.upload.enable_image_upload_desc'] = 'When enabled, users will be able to upload images.';
$_lang['setting_markdowneditor.upload.enable_file_upload'] = 'File upload';
$_lang['setting_markdowneditor.upload.enable_file_upload_desc'] = 'When enabled, users will be able to upload non-image files.';
$_lang['setting_markdowneditor.upload.image_types'] = 'Image types';
$_lang['setting_markdowneditor.upload.image_types_desc'] = 'Define image types that can be upload.';
$_lang['setting_markdowneditor.upload.file_types'] = 'File types';
$_lang['setting_markdowneditor.upload.file_types_desc'] = 'Define files types that can be uploaded.';
$_lang['setting_markdowneditor.upload.max_size'] = 'Max size';
$_lang['setting_markdowneditor.upload.max_size_desc'] = 'Max allowed size in bits of a file or image.';
$_lang['setting_markdowneditor.general.include_ghfmd_manager'] = 'GFM CSS in Manager';
$_lang['setting_markdowneditor.general.include_ghfmd_manager_desc'] = 'When enabled, GitHub Flavoured Markdown CSS will be automatically included in the Manager, when creating/updating Resources.';
$_lang['setting_markdowneditor.general.custom_css_manager'] = 'Custom CSS in Manager';
$_lang['setting_markdowneditor.general.custom_css_manager_desc'] = 'If set, specified CSS file will be automatically included in Manager, when creating/updating Resources. All definition must be prefixed with class <strong>preview-md</strong> to be applied on preview panel.';
$_lang['setting_markdowneditor.general.font_size'] = 'Font size';
$_lang['setting_markdowneditor.general.font_size_desc'] = 'Font size for Markdown editor. (default: 12).';
$_lang['setting_markdowneditor.general.font_family'] = 'Font family';
$_lang['setting_markdowneditor.general.font_family_desc'] = 'Font family which will be used for editor.';
$_lang['setting_markdowneditor.general.split'] = 'Split editor';
$_lang['setting_markdowneditor.general.split_desc'] = 'When enabled, editor will be in split mode by default.';
$_lang['setting_markdowneditor.general.split_fullscreen'] = 'Split editor full screen';
$_lang['setting_markdowneditor.general.split_fullscreen_desc'] = 'When enabled, editor will be in split mode by default when entering full screen.';
$_lang['setting_markdowneditor.cropper.profiles'] = 'Profiles';
$_lang['setting_markdowneditor.cropper.profiles_desc'] = 'A list of profiles that users can select from in the Cropper window.<br /> Each profile is a JSON object with required <strong>name</strong> property. <code>{"name": "Profile name", "width": 100, "height": 100, "ratio": "1/1"}</code>';
$_lang['setting_markdowneditor.cropper.show_description'] = 'Profiles description';
$_lang['setting_markdowneditor.cropper.show_description_desc'] = 'When enabled, profiles select box will also contains profile\'s description.';
$_lang['setting_markdowneditor.oembed.frontend_css'] = 'Include services CSS';
$_lang['setting_markdowneditor.oembed.frontend_css_desc'] = 'If enabled, CSS from specified service will be automatically included on frontend.';
$_lang['setting_markdowneditor.oembed.max_width'] = 'Max width';
$_lang['setting_markdowneditor.oembed.max_width_desc'] = 'Max width of received element.';
$_lang['setting_markdowneditor.oembed.max_height'] = 'Max height';
$_lang['setting_markdowneditor.oembed.max_height_desc'] = 'Max height of received element.';
$_lang['setting_markdowneditor.oembed.service'] = 'oEmbed service';
$_lang['setting_markdowneditor.oembed.service_desc'] = 'Comma delimited list of oEmbed services. Other defined services will be used as a fallback. Available services: Essence, Noembed, EmbedlyExtract, EmbedlyEmbed, EmbedlyCards';
$_lang['setting_markdowneditor.oembed.default_card_color'] = 'Default card\'s color';
$_lang['setting_markdowneditor.oembed.default_card_color_desc'] = 'Default color of card\'s stripe.';
$_lang['setting_markdowneditor.oembed.auto_card_color'] = 'Auto card\'s color';
$_lang['setting_markdowneditor.oembed.auto_card_color_desc'] = 'If enabled and selected service supports auto color, color of the stripe will be generated from favicon of the embedding url.';
$_lang['setting_markdowneditor.embedly.api_key'] = 'API key';
$_lang['setting_markdowneditor.embedly.api_key_desc'] = 'Embedly API key, required for EmbedlyExtract and EmbedlyEmbed service.';
$_lang['setting_markdowneditor.general.source'] = 'Source';
$_lang['setting_markdowneditor.general.source_desc'] = 'Media source that will be used in media browser for inserting files and images.';
$_lang['setting_markdowneditor.general.source_select'] = 'Source select';
$_lang['setting_markdowneditor.general.source_select_desc'] = 'If enabled, user will be able to change source when inserting files or images.';
$_lang['setting_markdowneditor.init.condition'] = 'Condition';
$_lang['setting_markdowneditor.init.condition_desc'] = 'This condition will be used to init Markdown editor. Use JSON syntax.';

$_lang['markdowneditor.err.upload.too_big'] = 'File exceeded the size limit.';
$_lang['markdowneditor.err.upload.unsupported_image'] = 'Unsupported image type.';
$_lang['markdowneditor.err.upload.unsupported_file'] = 'Unsupported file type.';