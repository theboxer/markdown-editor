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

$className = 'MarkdownEditor\\Event\\' . $modx->event->name;

if (class_exists($className)) {
    /** @var MarkdownEditor\Event\Event $handler */
    $handler = new $className($modx, $scriptProperties);
    $handler->run();
}

return;