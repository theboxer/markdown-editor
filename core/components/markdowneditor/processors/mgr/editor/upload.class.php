<?php
class MarkdownEditorUploadProcessor extends modProcessor {

    public function process()
    {
        $path = '/Users/theboxer/www/modx/pkgs/modx/assets/uploads/';
        if (!is_dir($path)) {
            mkdir($path);
        }

        $absolutePath = $path . $_FILES['file']['name'];

        if (!@move_uploaded_file($_FILES['file']['tmp_name'],$absolutePath)) {
            return $this->failure('nope');
        }


        return $this->modx->toJSON(array('success' => true, 'path' => '/modx/assets/uploads/' . $_FILES['file']['name'], 'name' => $_FILES['file']['name']));
    }
}
return 'MarkdownEditorUploadProcessor';