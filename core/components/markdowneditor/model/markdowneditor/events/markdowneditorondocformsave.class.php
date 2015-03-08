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

    private function moveFilesUnderCorrectResource()
    {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        $md = $resource->getProperty('markdown', 'markdowneditor');

        $uploadPath = $this->markdowneditor->getOption('upload.file_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $uploadPath = rtrim($uploadPath, '/') . '/';

        $uploadURL = $this->markdowneditor->getOption('upload.file_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);
        $uploadURL = rtrim($uploadURL, '/') . '/';

        $matches = array();
        preg_match_all('~' . $uploadURL . '0/(?<file>[^ "\)]+)~', $md, $matches);

        $path = $uploadPath . '0/';
        $correctPath = $uploadPath . $resource->id . '/';

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

            $md = str_replace($uploadURL . '0/', $uploadURL . $resource->id . '/', $md);

            $content = str_replace($uploadURL . '0/', $uploadURL . $resource->id . '/', $resource->get('content'));

            $resource->setProperty('markdown', $md, 'markdowneditor');
            $resource->set('content', $content);
            $resource->save();
        }
    }
}
