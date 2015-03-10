<?php
require_once dirname(__FILE__) . '/upload.class.php';
class MarkdownEditorUploadImageProcessor extends MarkdownEditorUploadProcessor
{
    /** @var \Intervention\Image\Image $img */
    protected $img;
    /** @var array $data */
    protected $data;
    /** @var string $type */
    protected $type = 'image';

    public function process()
    {
        $this->setImage();
        $data = $this->loadData();
        if ($data !== true) {
            return $this->failure($data);
        }

        if (isset($this->data['rotate'])) {
            $rotate = $this->data['rotate'] * -1.0;
            $this->img->rotate($rotate);
        }

        $crop = $this->getProperty('crop', 0);
        if ($crop == 1 && isset($this->data['width']) && isset($this->data['height'])) {
            $width = intval($this->data['width']);
            $height = intval($this->data['height']);

            if ($height != 0 && $width != 0) {
                $this->img->crop($width, $height, intval($this->data['x']), intval($this->data['y']));
            }
        }

        $fileName = $this->generateUniqueFileName();

        $width = (int) $this->md->getOption('resizer.width', null, 0);
        $width = (empty($width)) ? null : $width;

        $height = (int) $this->md->getOption('resizer.height', null, 0);
        $height = (empty($height)) ? null : $height;

        if (($width != null) || ($height != null)) {
            $this->img->resize($width, $height, function ($constraint) {
                /** @var \Intervention\Image\Constraint $constraint */
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        $this->img->save($this->uploadPath . $fileName . $this->extension);

        return $this->success('', array(
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
            return true;
        }

        $imageData = $this->modx->fromJSON($imageData);
        if ($imageData === null) {
            return 'Invalid data';
        }

        $this->data = $imageData;

        return true;
    }
}

return 'MarkdownEditorUploadImageProcessor';