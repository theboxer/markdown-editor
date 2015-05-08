<?php
namespace MarkdownEditor\oEmbed\Service;

use MarkdownEditor\oEmbed\Cards;
use MarkdownEditor\oEmbed\iOEmbed;
use MarkdownEditor\oEmbed\OEmbed;

final class EmbedlyEmbed extends OEmbed implements iOEmbed
{
    use Cards;

    /**
     * @return string
     * @throws \Exception
     */
    protected function getServiceURL()
    {
        $key = $this->getOption('api_key', null, 'embedly', true);
        if (empty($key)) {
            throw new \Exception();
        }

        $options = array(
            'key' => $key
        );

        $maxWidth = $this->getMaxWidth();
        if (!empty($maxWidth)) {
            $options['maxwidth'] = $maxWidth;
            $options['width'] = $maxWidth;
        }

        $maxHeight = $this->getMaxHeight();
        if (!empty($maxHeight)) {
            $options['maxheight'] = $maxHeight;
        }

        return 'http://api.embed.ly/1/oembed?' . http_build_query($options) . '&url=';
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

    protected function standardizeProps(&$result)
    {
        $width = $this->getMaxWidth();

        if (isset($result['thumbnail_width']) && $result['thumbnail_width'] < ($width - 50)) {
            $result['thumbnail_type'] = 'small';
        }

        $result['thumbnail_width'] = $width;
    }
}