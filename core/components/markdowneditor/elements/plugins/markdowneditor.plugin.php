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
$markdowneditor = $modx->getService(
    'markdowneditor',
    'MarkdownEditor',
    $corePath . 'model/markdowneditor/',
    array(
        'core_path' => $corePath
    )
);

$className = 'MarkdownEditor' . $modx->event->name;

$modx->loadClass('MarkdownEditorPlugin', $markdowneditor->getOption('modelPath') . 'markdowneditor/events/', true, true);
$modx->loadClass($className, $markdowneditor->getOption('modelPath') . 'markdowneditor/events/', true, true);

if (class_exists($className)) {
    /** @var MarkdownEditorPlugin $handler */
    $handler = new $className($modx, $scriptProperties);
    $handler->run();
}

return;