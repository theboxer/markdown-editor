<?php
require_once dirname(__FILE__) . '/upload.class.php';
class MarkdownEditorUploadFileProcessor extends MarkdownEditorUploadProcessor
{
    /** @var string $type */
    protected $type = 'file';

    public function process()
    {
        $fileName = $this->generateUniqueFileName();

        move_uploaded_file($_FILES["file"]["tmp_name"], $this->uploadPath . $fileName . '.' . $this->extension);

        return $this->success('', array(
            'path' => $this->uploadURL . $fileName . '.' . $this->extension,
            'name' => $this->originalName
        ));
    }

    protected function checkFileType()
    {
        $allowed = $this->md->getOption('upload.file_types');
        if (empty($allowed)) return true;

        $allowed = explode(',', $allowed);

        if (in_array(strtolower($this->extension), $allowed)) return true;

        return $this->modx->lexicon('markdowneditor.err.upload.unsupported_file');
    }
}

return 'MarkdownEditorUploadFileProcessor';