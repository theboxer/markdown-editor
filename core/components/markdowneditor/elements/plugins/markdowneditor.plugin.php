<?php
/**
 * MarkdownEditor
 *
 * DESCRIPTION
 *
 *
 */

// Check scenarios where MarkdownEditor should not be loaded
$elementEditor = $modx->getOption('which_element_editor');
$resourceEditor = $modx->getOption('which_editor');
if ($modx->event->name === 'OnRichTextEditorInit' && !$modx->resource) {
	// If the element editor is not MarkdownEditor, return without loading
	if ($elementEditor !== 'MarkdownEditor') {
		return;
	}
}
else if ($modx->resource) {
	// If MarkdownEditor is not selected, return
	if ($resourceEditor !== 'MarkdownEditor') {
		return;
	}
}

$corePath = $modx->getOption('markdowneditor.core_path', null, $modx->getOption('core_path', null, MODX_CORE_PATH) . 'components/markdowneditor/');
/** @var MarkdownEditor $markdowneditor */
$markdowneditor = $modx->getService(
    'markdowneditor',
    'MarkdownEditor',
    $corePath . 'model/markdowneditor/',
    array(
        'core_path' => $corePath
    )
);

$className = 'MarkdownEditor\\Event\\' . $modx->event->name;

if (class_exists($className)) {
    /** @var MarkdownEditor\Event\Event $handler */
    $handler = new $className($modx, $scriptProperties);
    $handler->run();
}

return;
