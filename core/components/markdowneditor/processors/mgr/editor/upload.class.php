<?php
abstract class MarkdownEditorUploadProcessor extends modProcessor
{
    /** @var MarkdownEditor $md */
    protected $md;
    /** @var string $uploadPath */
    protected $uploadPath;
    /** @var string $uploadURL */
    protected $uploadURL;
    /** @var string $extension */
    protected $extension;
    /** @var string $type */
    protected $type = 'file';

    public function initialize()
    {
        $this->md = $this->modx->markdowneditor;

        $size = $this->checkSize();
        if ($size !== true) {
            return $size;
        }

        $this->setUploadPaths();

        return true;
    }

    protected function setUploadPaths()
    {
        $this->uploadPath = $this->md->getOption('upload.' . $this->type . '_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $this->uploadPath = rtrim($this->uploadPath, '/') . '/';

        if (!is_dir($this->uploadPath)) {
            mkdir($this->uploadPath);
        }

        $this->uploadURL = $this->md->getOption('upload.' . $this->type . '_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);
        $this->uploadURL = rtrim($this->uploadURL, '/') . '/';

        $underResource = $this->md->getOption('upload.under_resource', null, true);
        if ($underResource) {
            $resource = $this->getProperty('resource', 0);
            if ($resource != 0) {
                $resource = $this->modx->getObject('modResource', $resource);
                if ($resource) {
                    $resource = $resource->id;
                } else {
                    $resource = 0;
                }
            }

            $this->uploadPath .= $resource . '/';

            if (!is_dir($this->uploadPath)) {
                mkdir($this->uploadPath);
            }

            $this->uploadURL .= $resource . '/';
        }
    }

    protected function getOriginalName()
    {
        $name = $_FILES['file']['name'];
        $name = explode('.', $name);

        $this->extension = '.' . array_pop($name);

        return implode('.', $name);
    }

    protected function generateUniqueFileName()
    {
        $fileName = $this->getFileName();

        while (file_exists($this->uploadPath . $fileName . $this->extension)) {
            $fileName = $this->getFileName();
        }

        return $fileName;
    }

    protected function getFileName()
    {
        $fileName = strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");

        return $fileName;
    }

    protected function checkSize()
    {
        $allowedSize = (int) $this->md->getOption('upload.max_size', null, "2097152");

        if ($allowedSize < $_FILES['file']['size']) return 'File is too big.';

        return true;
    }
}

return 'MarkdownEditorUploadFileProcessor';