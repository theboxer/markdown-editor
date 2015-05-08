<?php
namespace MarkdownEditor\oEmbed;

/**
 * @property \MarkdownEditor $md
 * @property \modX $modx
 *
 * @method string getOption() getOption($key, $default = '', $area = ['oembed'], $addDefaultArea = false)
 */
trait Cards
{
    /**
     * @param array $props
     * @return string
     */
    protected function getTemplate($props)
    {
        $this->convertNull($props);
        $this->processProps($props);

        $reflection = new \ReflectionClass($this);
        $shortName = strtolower($reflection->getShortName());
        $longName = strtolower(str_replace('\\', '_', $reflection->getName()));

        $templates = [
            [
                'name' => $props['provider_name'],
                'path' => 'services/' . $shortName . '/providers',
            ],
            [
                'name' => $props['provider_name'],
                'path' => 'services/' . $longName . '/providers',
            ],
            [
                'name' => $props['type'],
                'path' => 'services/' . $shortName,
            ],
            [
                'name' => $props['type'],
                'path' => 'services/' . $longName,
            ],
            [
                'name' => $props['provider_name'],
                'path' => 'providers',
            ],
            [
                'name' => $props['type'],
                'path' => '',
            ],
            [
                'name' => 'general',
                'path' => '',
            ],
        ];

        $template = null;
        foreach ($templates as $tpl) {
            $template = $this->getTemplateFor($tpl['name'], $tpl['path']);

            if ($template != null) break;
        }

        $props['card_width'] = intval($this->getOption('max_width', 640)) . 'px';

        return $template->process($props);
    }

    private function getTemplateFor($name, $path = '')
    {
        $chunk = $this->modx->getObject('modChunk', array(
            'name' => 'md' . ucfirst($name),
            'OR:name:=' => 'md' . ucfirst(strtolower($name)),
        ));

        if ($chunk) {
            return $chunk;
        }

        $templatesDir = $this->md->getOption('templatesPath') . $path;
        $files = [
            $name . '.html',
            strtolower($name) . '.html',
        ];

        foreach ($files as $file) {
            if (file_exists($templatesDir . '/' . $file)) {
                /** @var \modChunk $chunk */
                $chunk = $this->modx->newObject('modChunk', array('name' => 'inline-' . uniqid()));
                $chunk->setCacheable(false);
                $chunk->set('snippet', file_get_contents($templatesDir . '/' . $file));

                return $chunk;
            }
        }

        return null;
    }

    private function convertNull(&$props)
    {
        foreach ($props as $key => $value) {
            if (is_null($value)) {
                $props[$key] = "";
            }
        }
    }

    private function getFavicon($url)
    {
        $favicon = '';

        $faviconUrl = parse_url($url);

        $faviconUrl = (isset($faviconUrl['scheme']) ? $faviconUrl['scheme'] . '://' : '') . $faviconUrl['host'] . '/favicon.ico';

        $header =  get_headers($faviconUrl);
        if(preg_match("|200|", $header[0])) {
            return $faviconUrl;
        }


        $html = file_get_contents($url);
        $dom = new \DOMDocument();
        $dom->loadHTML($html);
        $links = $dom->getElementsByTagName('link');

        for ($i = 0; $i < $links->length; $i++) {
            $link = $links->item($i);
            $rel = explode(' ', $link->getAttribute('rel'));
            $rel = array_map('strtolower', $rel);
            if (in_array('icon', $rel)) {
                $favicon = $link->getAttribute('href');
                break;
            }
        }

        if (filter_var($favicon, FILTER_VALIDATE_URL) === false) {
            if ($favicon[0] != '/' || $favicon[1] != '/') {
                $favicon = ltrim($favicon, '/');
                $favicon = rtrim($url, '/') . '/' . $favicon;
            }
        }

        $favicon = str_replace('http://', '//', $favicon);
        $favicon = str_replace('https://', '//', $favicon);

        return $favicon;
    }

    private function processProps(&$props)
    {
        $defaultArray = [
            'title' => '',
            'description' => '',
            'author_name' => '',
            'author_url' => '',
            'favicon_url' => '',
            'provider_name' => '',
            'thumbnail_url' => '',
            'url' => '',
            'html' => '',
            'color' => $this->getOption('default_card_color', '#D71212'),
            'thumbnail_type' => 'large',
        ];

        $props = array_merge($defaultArray, $props);

        if (empty($props['favicon_url'])) {
            $props['favicon_url'] = $this->getFavicon($props['provider_url']);
        }

    }

    public function getCSS()
    {
        return array($this->md->getOption('cssUrl') . 'cards.css');
    }
}