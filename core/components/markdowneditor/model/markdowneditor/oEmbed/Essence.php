<?php
namespace MarkdownEditor\oEmbed;

final class Essence implements iOEmbed
{
    use Templatable;

    /** @var \modX */
    private $modx;

    /** @var \MarkdownEditor */
    private $md;

    public function __construct(\modX &$modx)
    {
        $this->modx =& $modx;
        $this->md = $this->modx->markdowneditor;
    }

    /**
     * @param string $url
     * @throws \Exception
     * @return string HTML representation of URL
     */
    public function extract($url)
    {
        $essence = \Essence\Essence::instance( );

        $options = array();
        $maxWidth = $this->getMaxWidth();
        if (!empty($maxWidth)) {
            $options['maxwidth'] = $maxWidth;
        }

        $maxHeight = $this->getMaxHeight();
        if (!empty($maxHeight)) {
            $options['maxheight'] = $maxHeight;
        }

        $media = $essence->embed($url, $options);

        if (!$media) {
            throw new \Exception();
        }

        return $this->getTemplate($media->properties());
    }

    /**
     * @return int
     */
    private function getMaxWidth()
    {
        $width = $this->md->getOption('essence.max_width', array(), '');
        if ($width == '0') return 0;

        if ($width == '') {
            $width = $this->md->getOption('oembed.max_width', array(), 800);
        }

        return intval($width);
    }

    /**
     * @return int
     */
    private function getMaxHeight()
    {
        $height = $this->md->getOption('essence.max_height', array(), '');
        if ($height == '0') return 0;

        if ($height == '') {
            $height = $this->md->getOption('oembed.max_height', array(), 800);
        }

        return intval($height);
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
}