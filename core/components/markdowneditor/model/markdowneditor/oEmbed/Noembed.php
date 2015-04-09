<?php
namespace MarkdownEditor\oEmbed;

final class Noembed implements iOEmbed
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
        $service = $this->getServiceURL() . urlencode($url);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $service);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result = curl_exec($ch);

        if (curl_errno($ch)) {
            throw new \Exception();
        }

        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($http_code !== 200) {
            throw new \Exception();
        }

        curl_close($ch);

        $result = $this->modx->fromJSON($result);
        if (!isset($result['html'])) {
            throw new \Exception();
        }

        return $result['html'];
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
     * @return string
     */
    private function getServiceURL()
    {
        return 'http://noembed.com/embed?nowrap=on&maxwidth=' . $this->getMaxWidth() . '&maxheight=' . $this->getMaxHeight() . '&url=';
    }

    /**
     * Loads custom CSS
     *
     * @return array
     */
    public function getCSS()
    {
        return array($this->md->getOption('cssUrl') . 'noembed.css');
    }
}