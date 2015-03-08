<?php
/**
 * Default English Lexicon Entries for MarkdownEditor
 *
 * @package markdowneditor
 * @subpackage lexicon
 */

$_lang['markdowneditor'] = 'MarkdownEditor';
$_lang['setting_markdowneditor'] = 'MarkdownEditor';

$_lang['area_markdowneditor.area.cropper'] = 'Cropper';
$_lang['area_markdowneditor.area.lp'] = 'Live preview';
$_lang['area_markdowneditor.area.upload'] = 'Upload';
$_lang['area_markdowneditor.area.resizer'] = 'Resizer';
$_lang['area_markdowneditor.area.general'] = 'General';

$_lang['setting_markdowneditor.lp.parse_modx_tags'] = 'Parse MODX Tags';
$_lang['setting_markdowneditor.lp.parse_modx_tags_desc'] = 'If set to yes, Markdown Editor will also parse MODX tags in preview. This option will send AJAX request to the server each time you update content.';
$_lang['setting_markdowneditor.lp.parse_modx_tags_timeout'] = 'Parse MODX Tags timeout';
$_lang['setting_markdowneditor.lp.parse_modx_tags_timeout_desc'] = 'Debounce parse function by specified timeout in milliseconds.';
$_lang['setting_markdowneditor.upload.image_upload_path'] = 'Image upload path';
$_lang['setting_markdowneditor.upload.image_upload_path_desc'] = 'Path where to upload images.';
$_lang['setting_markdowneditor.upload.image_upload_url'] = 'Image upload URL';
$_lang['setting_markdowneditor.upload.image_upload_url_desc'] = 'URL to the image upload directory.';
$_lang['setting_markdowneditor.upload.file_upload_path'] = 'File upload path';
$_lang['setting_markdowneditor.upload.file_upload_path_desc'] = 'Path where to upload files.';
$_lang['setting_markdowneditor.upload.file_upload_url'] = 'File upload URL';
$_lang['setting_markdowneditor.upload.file_upload_url_desc'] = 'URL to the file upload directory.';
$_lang['setting_markdowneditor.cropper.enable_cropper'] = 'Enable Cropper';
$_lang['setting_markdowneditor.cropper.enable_cropper_desc'] = 'If enabled, pop-up window with Cropper will show before each image upload.';
$_lang['setting_markdowneditor.cropper.aspect_ratio'] = 'Aspect ratio';
$_lang['setting_markdowneditor.cropper.aspect_ratio_desc'] = 'Aspect ratio used for cropping images.';
$_lang['setting_markdowneditor.resizer.aspect_ratio_constraint'] = 'Aspect ratio constraint';
$_lang['setting_markdowneditor.resizer.aspect_ratio_constraint_desc'] = 'If enabled, image will keep their aspect ratio when resizing.';
$_lang['setting_markdowneditor.resizer.upsize_constraint'] = 'Upsize constraint';
$_lang['setting_markdowneditor.resizer.upsize_constraint_desc'] = 'If enabled, image will not be resized to higher height or width.';
$_lang['setting_markdowneditor.resizer.width'] = 'Width';
$_lang['setting_markdowneditor.resizer.width_desc'] = 'Width of resized image.';
$_lang['setting_markdowneditor.resizer.height'] = 'Height';
$_lang['setting_markdowneditor.resizer.height_desc'] = 'Height of resized image.';
$_lang['setting_markdowneditor.general.theme'] = 'Editor\'s theme';
$_lang['setting_markdowneditor.general.theme_desc'] = 'Available themes are same as in Ace editor. <a href="https://github.com/ajaxorg/ace/tree/master/lib/ace/theme">https://github.com/ajaxorg/ace/tree/master/lib/ace/theme</a>';
$_lang['setting_markdowneditor.upload.under_resource'] = 'Under resource';
$_lang['setting_markdowneditor.upload.under_resource_desc'] = 'If enabled, all uploaded files will be stored under directory with name of resource ID.';