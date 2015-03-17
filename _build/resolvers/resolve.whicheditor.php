<?php
/**
 *
 * @package markdowneditor
 * @subpackage build
 */
switch ($options[xPDOTransport::PACKAGE_ACTION]) {
    case xPDOTransport::ACTION_INSTALL:
    case xPDOTransport::ACTION_UPGRADE:
        $object->xpdo->log(xPDO::LOG_LEVEL_INFO,'Attempting to set which_editor setting to MarkdownEditor.');
        $setting = $object->xpdo->getObject('modSystemSetting',array('key' => 'which_editor'));
        if ($setting) {
            $setting->set('value','MarkdownEditor');
            $setting->save();
        }
        unset($setting);
        $object->xpdo->log(xPDO::LOG_LEVEL_INFO,'Attempting to set use_editor setting to on.');
        $setting = $object->xpdo->getObject('modSystemSetting',array('key' => 'use_editor'));
        if ($setting) {
            $setting->set('value',1);
            $setting->save();
        }
        unset($setting);
        break;
    case xPDOTransport::ACTION_UNINSTALL:
        $setting = $object->xpdo->getObject('modSystemSetting',array('key' => 'which_editor'));
        if ($setting) {
            $setting->set('value','');
            $setting->save();
        }
        $setting = $object->xpdo->getObject('modSystemSetting',array('key' => 'use_editor'));
        if ($setting) {
            $setting->set('value',0);
            $setting->save();
        }
        break;
}
return true;