<?php
namespace MarkdownEditor\oEmbed\Service;

use MarkdownEditor\oEmbed\Cards;
use MarkdownEditor\oEmbed\iOEmbed;
use MarkdownEditor\oEmbed\OEmbed;

final class Essence extends OEmbed implements iOEmbed
{
    use Cards;

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
}