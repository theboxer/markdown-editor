<?php
namespace MarkdownEditor\oEmbed;

final class EmbedlyCards implements iOEmbed
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
        return '<a href="' . $url . '" class="embedly-card" data-card-controls="' . $this->getCardControls() . '" data-card-width="' . $this->getMaxWidth() . '">' . $url . '</a>';
    }

    private function getCardControls()
    {
        return intval($this->md->getOption('embedlycards.card_controls', array(), '0'));
    }

    /**
     * @return int
     */
    private function getMaxWidth()
    {
        $height = $this->md->getOption('embedlycards.max_width', array(), '');
        if ($height == '0') return '';

        if ($height == '') {
            $height = intval($this->md->getOption('oembed.max_width', array(), 800)) . 'px';
        }

        return $height;
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
     * Loads custom JS
     *
     * @return array
     */
    public function getJS()
    {
        return array();
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