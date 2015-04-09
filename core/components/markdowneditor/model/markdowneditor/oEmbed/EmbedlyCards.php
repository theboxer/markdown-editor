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
        return '<a href="' . $url . '" class="embedly-card">' . $url . '</a>';
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