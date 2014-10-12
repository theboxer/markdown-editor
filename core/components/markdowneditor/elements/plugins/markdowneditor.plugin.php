<?php
/**
 * MarkdownEditor
 *
 * DESCRIPTION
 *
 *
 */
$corePath = $modx->getOption('markdowneditor.core_path', null, $modx->getOption('core_path', null, MODX_CORE_PATH) . 'components/markdowneditor/');
/** @var MarkdownEditor $markdowneditor */
$collections = $modx->getService(
    'markdowneditor',
    'MarkdownEditor',
    $corePath . 'model/markdowneditor/',
    array(
        'core_path' => $corePath
    )
);

$modx->loadClass('MarkdownEditorPlugin', $collections->getOption('modelPath') . 'markdowneditor/events/', true, true);
$modx->loadClass($modx->event->name, $collections->getOption('modelPath') . 'markdowneditor/events/', true, true);

if (class_exists($modx->event->name)) {
    $handler = new $modx->event->name($modx, $scriptProperties);
    $handler->run();
}

return;