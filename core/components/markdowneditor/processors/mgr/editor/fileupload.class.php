<?php
require_once dirname(__FILE__) . '/upload.class.php';
class MarkdownEditorUploadFileProcessor extends MarkdownEditorUploadProcessor
{
    /** @var string $type */
    protected $type = 'file';

    public function process()
    {
        $originalName = $this->getOriginalName();

        $fileName = $this->generateUniqueFileName();

        move_uploaded_file($_FILES["file"]["tmp_name"], $this->uploadPath . $fileName . $this->extension);

        return $this->success('', array(
            'path' => $this->uploadURL . $fileName . $this->extension,
            'name' => $originalName
        ));
    }
}

return 'MarkdownEditorUploadFileProcessor';