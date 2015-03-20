<?php
/**
 * @package markdowneditor
 */
require_once (strtr(realpath(dirname(dirname(__FILE__))), '\\', '/') . '/markdowneditorcontent.class.php');
class MarkdownEditorContent_mysql extends MarkdownEditorContent {}
?>