<?php
/**
 * Resolve creating db tables
 *
 * THIS RESOLVER IS AUTOMATICALLY GENERATED, NO CHANGES WILL APPLY
 *
 * @package markdowneditor
 * @subpackage build
 */

if ($object->xpdo) {
    $modx =& $object->xpdo;
    switch ($options[xPDOTransport::PACKAGE_ACTION]) {
        case xPDOTransport::ACTION_INSTALL:
        case xPDOTransport::ACTION_UPGRADE:
            $modelPath = $modx->getOption('markdowneditor.core_path', null, $modx->getOption('core_path') . 'components/markdowneditor/') . 'model/';
            $modx->addPackage('markdowneditor', $modelPath);

            $manager = $modx->getManager();

            $manager->createObjectContainer('MarkdownEditorContent');

            break;
    }
}

return true;