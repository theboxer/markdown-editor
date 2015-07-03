<?php
namespace MarkdownEditor\Event;

class OnDocFormSave extends Event {

    /** @var string $uploadPath */
    private $uploadPath;
    /** @var string $uploadURL */
    private $uploadURL;
    /** @var \modResource $resource */
    private $resource;
    /** @var array $uploadedFiles */
    private $uploadedFiles = array();

    public function process() {
        $this->uploadPath = $this->md->getOption('upload.file_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $this->uploadPath = rtrim($this->uploadPath, '/') . '/';

        $this->uploadURL = $this->md->getOption('upload.file_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);
        $this->uploadURL = rtrim($this->uploadURL, '/') . '/';

        $this->resource = $this->sp['resource'];

        $this->saveMarkdown();

        return;
    }

    private function moveFilesUnderCorrectResource(&$md, $field)
    {
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

            if (strpos($field, 'tv')) {
                $tvID = str_replace('tv', '', $field);

                $content = str_replace($this->uploadURL . '0/', $this->uploadURL . $this->resource->id . '/', $this->resource->getTVValue($tvID));
                $this->resource->setTVValue($tvID, $content);
            } else {
                if ($field == 'ta') $field = 'content';

                $content = str_replace($this->uploadURL . '0/', $this->uploadURL . $this->resource->id . '/', $this->resource->get($field));

                $this->resource->set($field, $content);
                $this->resource->save();
            }
        }
    }

    private function unsetUnusedFiles($md)
    {
        $matches = array();

        preg_match_all('~' . $this->uploadURL . $this->resource->id . '/(?<file>[^ "\)]+)~', $md, $matches);

        if (isset($matches['file'])) {
            foreach ($matches['file'] as $file) {
                if (isset($this->uploadedFiles[$file])) {
                    unset($this->uploadedFiles[$file]);
                }
            }
        }
    }

    private function saveMarkdown()
    {
        $resourceArray = $this->resource->toArray();
        $mode = $this->sp['mode'];
        $deleteUnused = (int) $this->md->getOption('upload.delete_unused', null, 1);
        $underResource = (int) $this->md->getOption('upload.under_resource', null, 1);

        if ($mode == \modSystemEvent::MODE_UPD) {
            if ($deleteUnused && $underResource) {
                $this->uploadedFiles();
            }
        }

        foreach ($resourceArray as $field => $value) {
            if (!strpos($field, '_markdown')) continue;
            $fieldName = str_replace('_markdown', '', $field);

            $markdown = $this->modx->fromJSON($this->resource->getProperty('markdown', 'markdowneditor', '[]'));

            if ($mode == \modSystemEvent::MODE_NEW) {
                if ($underResource) {
                    $this->moveFilesUnderCorrectResource($value, $fieldName);
                }
            }

            if ($mode == \modSystemEvent::MODE_UPD) {
                if ($deleteUnused && $underResource) {
                    $this->unsetUnusedFiles($value);
                }
            }

            $markdown[$fieldName] = $value;
            $this->resource->setProperty('markdown', $this->modx->toJSON($markdown), 'markdowneditor');
            $this->resource->save();
            
            $this->resource->{$field} = '';
        }

        if ($mode == \modSystemEvent::MODE_UPD) {
            if ($deleteUnused && $underResource) {
                $this->deleteUnusedFiles();
            }
        }
    }

    private function uploadedFiles()
    {
        $path = $this->uploadPath . $this->resource->id . '/';
        $uploadedFiles = array();

        if (!is_dir($path)) return;

        foreach (new \DirectoryIterator($path) as $file) {
            if ($file->isFile()) {
                $uploadedFiles[] = $file->getFilename();
            }
        }

        $this->uploadedFiles = array_flip($uploadedFiles);
    }

    private function deleteUnusedFiles()
    {
        $path = $this->uploadPath . $this->resource->id . '/';

        foreach ($this->uploadedFiles as $file => $v) {
            unlink($path . $file);
        }
    }
}
