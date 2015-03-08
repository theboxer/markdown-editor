<?php
class MarkdownEditorOnDocFormSave extends MarkdownEditorPlugin {
    public function process() {
        $mode = $this->scriptProperties['mode'];

        switch ($mode) {
            case modSystemEvent::MODE_NEW:
                $this->newResource();
                break;
            case modSystemEvent::MODE_UPD:
                $this->updateResource();
                break;
            default:
                return;
        }

        return;
    }

    private function newResource()
    {
        $underResource = (int) $this->markdowneditor->getOption('upload.under_resource', null, 1);
        if ($underResource) {
            $this->moveFilesUnderCorrectResource();
        }

    }

    private function updateResource()
    {

    }

    private function moveFilesUnderCorrectResource()
    {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        $md = $resource->getProperty('markdown', 'markdowneditor');

        $matches = array();
        preg_match_all('~/modx/assets/u/0/(?<file>[^ "\)]+)~', $md, $matches);

        $path = '/Users/theboxer/www/modx/pkgs/modx/assets/u/0/';
        $correctPath = '/Users/theboxer/www/modx/pkgs/modx/assets/u/' . $resource->id . '/';

        if (!is_dir($correctPath)) {
            mkdir($correctPath);
        }

        $files = $matches['file'];

        if (!empty($files)) {
            $files = array_map('trim', $files);
            $files = array_keys(array_flip($files));
            $files = array_filter($files);

            foreach ($files as $file) {
                rename($path . $file, $correctPath . $file);
            }

            $md = str_replace('/modx/assets/u/0/', '/modx/assets/u/' . $resource->id . '/', $md);

            $content = str_replace('/modx/assets/u/0/', '/modx/assets/u/' . $resource->id . '/', $resource->get('content'));

            $resource->setProperty('markdown', $md, 'markdowneditor');
            $resource->set('content', $content);
            $resource->save();
        }
    }
}
