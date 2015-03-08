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

    private function setUploadPaths()
    {
        $uploadPath = $this->md->getOption('upload.image_upload_path', null, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'u/', true);
        $this->uploadPath = rtrim($uploadPath, '/') . '/';

        if (!is_dir($this->uploadPath)) {
            mkdir($this->uploadPath);
        }

        $this->uploadURL = $this->md->getOption('upload.image_upload_url', null, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'u/', true);

        $underResource = (int) $this->md->getOption('upload.under_resource', null, 1);
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

    private function getOriginalName()
    {
        $name = $_FILES['file']['name'];
        $name = explode('.', $name);
        array_pop($name);

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

return 'MarkdownEditorUploadImageProcessor';