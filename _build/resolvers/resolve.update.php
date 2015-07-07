<?php
/**
 *
 * @package markdowneditor
 * @subpackage build
 */

if ($object->xpdo) {
    switch ($options[xPDOTransport::PACKAGE_ACTION]) {
        case xPDOTransport::ACTION_INSTALL:
        case xPDOTransport::ACTION_UPGRADE:
            /** @var modX $modx */
            $modx =& $object->xpdo;

            // http://forums.modx.com/thread/88734/package-version-check#dis-post-489104
            $c = $modx->newQuery('transport.modTransportPackage');
            $c->where(array(
                'workspace' => 1,
                "(SELECT
                        `signature`
                      FROM {$modx->getTableName('modTransportPackage')} AS `latestPackage`
                      WHERE `latestPackage`.`package_name` = `modTransportPackage`.`package_name`
                      ORDER BY
                         `latestPackage`.`version_major` DESC,
                         `latestPackage`.`version_minor` DESC,
                         `latestPackage`.`version_patch` DESC,
                         IF(`release` = '' OR `release` = 'ga' OR `release` = 'pl','z',`release`) DESC,
                         `latestPackage`.`release_index` DESC
                      LIMIT 1,1) = `modTransportPackage`.`signature`",
            ));
            $c->where(array(
                array(
                    'modTransportPackage.package_name' => 'markdowneditor',
                    'OR:modTransportPackage.package_name:=' => 'Markdown Editor',
                ),
                'installed:IS NOT' => null
            ));

            /** @var modTransportPackage $oldPackage */
            $oldPackage = $modx->getObject('transport.modTransportPackage', $c);

            $modelPath = $modx->getOption('markdowneditor.core_path', null, $modx->getOption('core_path', null, MODX_CORE_PATH) . 'components/markdowneditor/') . 'model/';
            $modx->addPackage('markdowneditor', $modelPath);

            if ($oldPackage && $oldPackage->compareVersion('1.1.0-pl', '>')) {
                /** @var MarkdownEditorContent[] $contents */
                $contents = $modx->getIterator('MarkdownEditorContent', array('namespace' => 'core'));
                
                foreach ($contents as $content) {
                    /** @var modResource $resource */
                    $resource = $modx->getObject('modResource', $content->object_id);
                    if (!$resource) continue;

                    $markdown = $modx->fromJSON($resource->getProperty('markdown', 'markdowneditor', '[]'));
                    $markdown[$content->element_name] = $content->content;

                    $resource->setProperty('markdown', $modx->toJSON($markdown), 'markdowneditor');
                    $resource->save();
                    $content->remove();
                }
            }

            break;
    }
}
return true;