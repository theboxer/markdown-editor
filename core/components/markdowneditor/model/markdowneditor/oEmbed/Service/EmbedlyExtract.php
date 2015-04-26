<?php
namespace MarkdownEditor\oEmbed\Service;

use MarkdownEditor\oEmbed\Cards;
use MarkdownEditor\oEmbed\iOEmbed;
use MarkdownEditor\oEmbed\OEmbed;

final class EmbedlyExtract extends OEmbed implements iOEmbed
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

    protected function standardizeProps(&$result)
    {
        $autoColor = (int)$this->getOption('auto_card_color', 1);
        if ($autoColor && isset($result['favicon_colors'])) {
            $color = $this->getOption('default_card_color', '#D71212');

            foreach ($result['favicon_colors'] as $colors) {
                $min = min($colors['color']);
                $max = max($colors['color']);

                $color = 'rgb(' . implode(',', $colors['color']) . ')';

                if (($max - $min) > 10) {
                    break;
                }
            }

            $result['color'] = $color;
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