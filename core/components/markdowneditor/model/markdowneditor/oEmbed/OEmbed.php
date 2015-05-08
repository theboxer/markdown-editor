<?php
namespace MarkdownEditor\oEmbed;

abstract class OEmbed implements iOEmbed
{
    /** @var \modX */
    protected $modx;
    /** @var \MarkdownEditor */
    protected $md;
    /** @var string */
    protected $shortName = '';

    public function __construct(\modX &$modx)
    {
        $this->modx =& $modx;
        $this->md = $this->modx->markdowneditor;

        $reflection = new \ReflectionClass($this);
        $this->shortName = strtolower($reflection->getShortName());
    }

    /**
     * Loads custom HTML
     *
     * @return array
     */
    public function getHTML()
    {
        return array();
    }

    /**
     * Loads custom CSS
     *
     * @return array
     */
    public function getCSS()
    {
        return array();
    }

    /**
     * @param $key
     * @param $default
     * @param array|string $area
     * @param bool $addDefaultArea
     * @return string
     */
    protected function getOption($key, $default = '', $area = ['oembed'], $addDefaultArea = false)
    {
        if (!is_array($area)) {
            $area = [$area];
        }

        if ($addDefaultArea) {
            array_push($area, 'oembed');
        }

        array_unshift($area, $this->shortName);

        $area = array_keys(array_flip($area));

        foreach ($area as $a) {
            $res = $this->modx->getOption('markdowneditor.' . $a . '.' . $key, null);
            if ($res != '') {
                return $res;
            }
        }

        return $default;
    }

    /**
     * @return int
     */
    protected function getMaxWidth()
    {
        $width = $this->getOption('max_width', 640);

        return intval($width) - 28;
    }

    /**
     * @return int
     */
    protected function getMaxHeight()
    {
        $height = $this->getOption('max_height', 640);

        return intval($height);
    }
}
