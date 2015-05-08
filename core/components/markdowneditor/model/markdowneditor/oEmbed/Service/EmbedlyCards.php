<?php
namespace MarkdownEditor\oEmbed\Service;

use MarkdownEditor\oEmbed\iOEmbed;
use MarkdownEditor\oEmbed\OEmbed;

final class EmbedlyCards extends OEmbed implements iOEmbed
{
    /**
     * @param string $url
     * @throws \Exception
     * @return string HTML representation of URL
     */
    public function extract($url)
    {
        return '<a href="' . $url . '" class="embedly-card" data-card-controls="' . $this->getCardControls() . '" data-card-width="' . $this->getMaxWidth() . '">' . $url . '</a>';
    }

    private function getCardControls()
    {
        return intval($this->getOption('card_controls', '0', 'embedlycards'));
    }

    /**
     * @return int
     */
    protected function getMaxWidth()
    {
        $height = $this->getOption('max_width', 640);
        if ($height == '0') return '';

        $height = intval($height) - 28;
        $height = $height . 'px';

        return $height;
    }

    /**
     * Loads custom HTML
     *
     * @return array
     */
    public function getHTML()
    {
        return array(
            "<script>
              (function(w, d){
               var id='embedly-platform', n = 'script';
               if (!d.getElementById(id)){
                 w.embedly = w.embedly || function() {(w.embedly.q = w.embedly.q || []).push(arguments);};
                 var e = d.createElement(n); e.id = id; e.async=1;
                 e.src = ('https:' === document.location.protocol ? 'https' : 'http') + '://cdn.embedly.com/widgets/platform.js';
                 var s = d.getElementsByTagName(n)[0];
                 s.parentNode.insertBefore(e, s);
               }
              })(window, document);
            </script>"
        );
    }
}