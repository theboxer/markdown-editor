<?php

class MarkdownEditorUploadFileProcessor extends modProcessor
{
    /** @var MarkdownEditor $md */
    private $md;
    /** @var string $uploadPath */
    private $uploadPath;
    /** @var string $uploadURL */
    private $uploadURL;
    /** @var string $extension */
    private $extension;

    public function process()
    {
        $this->md = $this->modx->markdowneditor;

        $this->setUploadPaths();
        $originalName = $this->getOriginalName();

        $fileName = $this->generateUniqueFileName();

        move_uploaded_file($_FILES["file"]["tmp_name"], $this->uploadPath . $fileName . $this->extension);

        return $this->success('', array(
            'path' => $this->uploadURL . $fileName . $this->extension,
            'name' => $originalName
        ));
    }

    private function setUploadPaths()
    {
        $uploadPath = $this->md->getOption('upload.file_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $this->uploadPath = rtrim($uploadPath, '/') . '/';

        if (!is_dir($this->uploadPath)) {
            mkdir($this->uploadPath);
        }

        $this->uploadURL = $this->md->getOption('upload.file_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);
    }

    private function getOriginalName()
    {
        $name = $_FILES['file']['name'];
        $name = explode('.', $name);

        $this->extension = '.' . array_pop($name);

        return implode('.', $name);
    }

    private function generateUniqueFileName()
    {
        $fileName = $this->getFileName();

        while (file_exists($this->uploadPath . $fileName . $this->extension)) {
            $fileName = $this->getFileName();
        }

        return $fileName;
    }

    private function getFileName()
    {
        $fileName = strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");
        $fileName .= '-' . strtr(base64_encode(openssl_random_pseudo_bytes(4)), "+/=", "XXX");

        return $fileName;
    }
}

return 'MarkdownEditorUploadFileProcessor';