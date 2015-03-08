<?php

class MarkdownEditorUploadImageProcessor extends modProcessor
{
    /** @var \Intervention\Image\Image $img */
    private $img;
    /** @var string $extension */
    private $extension;
    /** @var array $data */
    private $data;
    /** @var MarkdownEditor $md */
    private $md;
    /** @var string $uploadPath */
    private $uploadPath;
    /** @var string $uploadURL */
    private $uploadURL;

    public function process()
    {
        $this->md = $this->modx->markdowneditor;
        $this->setImage();
        $data = $this->loadData();
        if ($data !== true) {
            return $this->failure($data);
        }

        $this->setUploadPaths();

        $rotate = $this->data['rotate'] * -1.0;
        $this->img->rotate($rotate);

        $crop = $this->getProperty('crop', 1);
        if ($crop == 1) {
            $width = intval($this->data['width']);
            $height = intval($this->data['height']);

            if ($height != 0 && $width != 0) {
                $this->img->crop($width, $height, intval($this->data['x']), intval($this->data['y']));
            }
        }

        $fileName = date('YmdHis');

        $this->img->resize(400, null, function ($constraint) {
            /** @var \Intervention\Image\Constraint $constraint */
            $constraint->aspectRatio();
        });

        $this->img->save($this->uploadPath . $fileName . $this->extension);

        return $this->modx->toJSON(array(
            'success' => true,
            'path' => $this->uploadURL . $fileName . $this->extension,
            'name' => $this->getOriginalName()
        ));
    }

    private function setImage()
    {
        $this->img = Intervention\Image\ImageManagerStatic::make($_FILES['file']['tmp_name']);

        $image = getimagesize($_FILES['file']['tmp_name']);
        $this->extension = image_type_to_extension($image[2]);
    }

    private function loadData()
    {
        $imageData = $this->getProperty('imageData');
        if (empty($imageData)) {
            return 'No data';
        }

        $imageData = $this->modx->fromJSON($imageData);
        if ($imageData === null) {
            return 'Invalid data';
        }

        $this->data = $imageData;

        return true;
    }

    private function setUploadPaths()
    {
        $uploadPath = $this->md->getOption('image_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/');
        $this->uploadPath = rtrim($uploadPath, '/') . '/';

        if (!is_dir($this->uploadPath)) {
            mkdir($this->uploadPath);
        }

        $this->uploadURL = $this->md->getOption('image_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/');
    }

    private function getOriginalName()
    {
        $name = $_FILES['file']['name'];
        $name = explode('.', $name);
        array_pop($name);

        return implode('.', $name);
    }
}

return 'MarkdownEditorUploadImageProcessor';