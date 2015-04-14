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
        $width = $this->md->getOption('noembed.max_width', array(), '');
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
        $height = $this->md->getOption('noembed.max_height', array(), '');
        if ($height == '0') return 0;

        if ($height == '') {
            $height = $this->md->getOption('oembed.max_height', array(), 800);
        }

        return intval($height);
    }

    /**
     * @return string
     */
    private function getServiceURL()
    {
        $options = array(
            'nowrap' => $this->md->getOption('noembed.nowrap', array(), 'on')
        );

        $maxWidth = $this->getMaxWidth();
        if (!empty($maxWidth)) {
            $options['maxwidth'] = $maxWidth;
        }

        $maxHeight = $this->getMaxHeight();
        if (!empty($maxHeight)) {
            $options['maxheight'] = $maxHeight;
        }

        return 'http://noembed.com/embed?' . http_build_query($options) . '&url=';
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