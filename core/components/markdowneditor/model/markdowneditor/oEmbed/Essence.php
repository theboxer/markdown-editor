<?php
namespace MarkdownEditor\oEmbed;

final class Essence implements iOEmbed
{
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
        $media = $essence->embed($url, array(
            'maxwidth' => $this->getMaxWidth(),
            'maxheight' => $this->getMaxHeight()
        ));

        if (!$media) {
            throw new \Exception();
        }

        return $media->html;
    }

    /**
     * @return int
     */
    private function getMaxWidth()
    {
        return intval($this->md->getOption('oembed.max_width', array(), 800));
    }

    /**
     * @return int
     */
    private function getMaxHeight()
    {
        return intval($this->md->getOption('oembed.max_height', array(), 800));
    }

    /**
     * Loads custom CSS
     *
     * @return array
     */
    public function getCSS()
    {
    }
}