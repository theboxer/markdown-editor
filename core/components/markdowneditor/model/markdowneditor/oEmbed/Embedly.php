<?php
namespace MarkdownEditor\oEmbed;

final class Embedly implements iOEmbed
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
     * @return int
     */
    private function getMaxWidth()
    {
        $width = $this->md->getOption('embedly.max_width', array(), '');
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
        $height = $this->md->getOption('embedly.max_height', array(), '');
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
            'key' => '11380f5abcb040968a674f2dc9bf5e54'
        );

        $maxWidth = $this->getMaxWidth();
        if (!empty($maxWidth)) {
            $options['maxwidth'] = $maxWidth;
        }

        $maxHeight = $this->getMaxHeight();
        if (!empty($maxHeight)) {
            $options['maxheight'] = $maxHeight;
        }

        return 'http://api.embed.ly/1/extract?' . http_build_query($options) . '&url=';
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

        $this->standardizeProps($result);

        return $this->getTemplate($result);
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
        return array();
    }

    private function standardizeProps(&$result)
    {
        if (isset($result['favicon_colors'])) {
            $color = '190,23,43';

            foreach ($result['favicon_colors'] as $colors) {
                $min = min($colors['color']);
                $max = max($colors['color']);

                $color = implode(',', $colors['color']);

                if (($max - $min) > 10) {
                    break;
                }
            }

            $result['color'] = 'rgb(' . $color . ')';
        }

        if (isset($result['authors'])) {
            $result['author_name'] = $result['authors'][0]['name'];
            $result['author_url'] = $result['authors'][0]['url'];
        }

        if (isset($result['media']['type'])) {
            switch ($result['media']['type']) {
                case 'photo':
                    $result['type'] = 'photo';
                    break;
                case 'video':
                    $result['type'] = 'video';
                    break;
            }
        }

        if (isset($result['images'][0]['url'])) {
            $result['thumbnail_url'] = $result['images'][0]['url'];
        }
    }
}