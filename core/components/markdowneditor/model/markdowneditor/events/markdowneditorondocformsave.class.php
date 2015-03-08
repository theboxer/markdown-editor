<?php
class MarkdownEditorOnDocFormSave extends MarkdownEditorPlugin {

    /** @var string $uploadPath */
    private $uploadPath;
    /** @var string $uploadURL */
    private $uploadURL;
    /** @var modResource $resource */
    private $resource;

    public function process() {
        $mode = $this->scriptProperties['mode'];

        $this->uploadPath = $this->markdowneditor->getOption('upload.file_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $this->uploadPath = rtrim($this->uploadPath, '/') . '/';

        $this->uploadURL = $this->markdowneditor->getOption('upload.file_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);
        $this->uploadURL = rtrim($this->uploadURL, '/') . '/';

        $this->resource = $this->scriptProperties['resource'];

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
        $deleteUnused = (int) $this->markdowneditor->getOption('upload.delete_unused', null, 1);
        $underResource = (int) $this->markdowneditor->getOption('upload.under_resource', null, 1);

        if ($deleteUnused && $underResource) {
            $this->deleteUnusedFiles();
        }
    }

    private function moveFilesUnderCorrectResource()
    {
        $md = $this->resource->getProperty('markdown', 'markdowneditor');

        $matches = array();
        preg_match_all('~' . $this->uploadURL . '0/(?<file>[^ "\)]+)~', $md, $matches);

        $path = $this->uploadPath . '0/';
        $correctPath = $this->uploadPath . $this->resource->id . '/';

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

            $md = str_replace($this->uploadURL . '0/', $this->uploadURL . $this->resource->id . '/', $md);

            $content = str_replace($this->uploadURL . '0/', $this->uploadURL . $this->resource->id . '/', $this->resource->get('content'));

            $this->resource->setProperty('markdown', $md, 'markdowneditor');
            $this->resource->set('content', $content);
            $this->resource->save();
        }
    }

    private function deleteUnusedFiles()
    {
        $path = $this->uploadPath . $this->resource->id . '/';
        $uploadedFiles = array();

        if (!is_dir($path)) return;

        foreach (new DirectoryIterator($path) as $file) {
            if ($file->isFile()) {
                $uploadedFiles[] = $file->getFilename();
            }
        }

        $uploadedFiles = array_flip($uploadedFiles);

        $md = $this->resource->getProperty('markdown', 'markdowneditor');
        $matches = array();

        preg_match_all('~' . $this->uploadURL . $this->resource->id . '/(?<file>[^ "\)]+)~', $md, $matches);

        if (isset($matches['file'])) {
            foreach ($matches['file'] as $file) {
                if (isset($uploadedFiles[$file])) {
                    unset($uploadedFiles[$file]);
                }
            }
        }

        foreach ($uploadedFiles as $file => $v) {
            unlink($path . $file);
        }
    }
}
