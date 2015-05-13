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

    public function initialize()
    {
        $img = $this->setImage();
        if ($img !== true) {
            return $img;
        }

        return parent::initialize();
    }

    public function process()
    {
        $data = $this->loadData();
        if ($data !== true) {
            return $this->failure($data);
        }

        $mobile = (int) $this->getProperty('mobile', 0);
        if ($mobile == 1) {
            $orientation = $this->img->exif('Orientation');
            switch ($orientation) {
                case 3:
                    $this->img->rotate(180);
                    break;
                case 6:
                    $this->img->rotate(-90);
                    break;
                case 8:
                    $this->img->rotate(90);
                    break;
            }
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

        $profileName = $this->getProperty('profile', '');
        if (!empty($profileName) && $crop == 1) {
            $profiles = $this->modx->fromJSON($this->md->getOption('cropper.profiles', null, '[]'));

            foreach ($profiles as $profile) {
                if (!isset($profile['name']) || $profile['name'] != $profileName) continue;

                $profileWidth = (int) $profile['width'];
                $profileHeight = (int) $profile['height'];

                $width = (empty($profileWidth)) ? $width : $profileWidth;
                $height = (empty($profileHeight)) ? $height : $profileHeight;

                break;
            }
        }

        if (($width != null) || ($height != null)) {
            $this->img->resize($width, $height, function ($constraint) {
                /** @var \Intervention\Image\Constraint $constraint */
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        $this->img->save($this->uploadPath . $fileName . '.' . $this->extension);

        return $this->success('', array(
            'path' => $this->uploadURL . $fileName . '.' . $this->extension,
            'name' => $this->originalName
        ));
    }

    private function setImage()
    {
        try {
            $this->img = Intervention\Image\ImageManagerStatic::make($_FILES['file']['tmp_name']);
        } catch (Exception $e) {
            return 'Not image.';
        }

        $image = getimagesize($_FILES['file']['tmp_name']);
        $this->extension = image_type_to_extension($image[2], false);

        return true;
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

    protected function checkFileType()
    {
        $allowed = $this->md->getOption('upload.image_types');
        if (empty($allowed)) return true;

        $allowed = explode(',', $allowed);

        if (in_array($this->extension, $allowed)) return true;

        return $this->modx->lexicon('markdowneditor.err.upload.unsupported_image');
    }
}

return 'MarkdownEditorUploadImageProcessor';