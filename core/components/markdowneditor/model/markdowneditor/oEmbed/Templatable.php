<?php
namespace MarkdownEditor\oEmbed;

/**
 * @property \MarkdownEditor $md
 * @property \modX $modx
 */
trait Templatable
{
    /**
     * @param array $props
     * @return string
     */
    protected function getTemplate($props)
    {
        $props = $this->convertNull($props);

        if (!isset($props['thumbnail_url']) && isset($props['images']) && is_array($props['images'])) {
            $props['thumbnail_url'] = $props['images'][0]['url'];
        }

        if (!isset($props['author_name'])) {
            $props['author_name'] = $props['authors'][0]['name'];
        }

        if (!isset($props['author_url'])) {
            $props['author_url'] = $props['authors'][0]['url'];
        }

        if (!isset($props['favicon_url'])) {
            $props['favicon_url'] = $this->getFavicon($props['provider_url']);
        }

        if (!isset($props['description'])) {
            $props['description'] = '';
        }

        $template = null;
        if (isset($props['provider_name'])) {
            $template = $this->getTemplateFor($props['provider_name'], '/providers/');
        }

        if ($template === null) {
            $template = $this->getTemplateFor($props['type']);
        }

        if ($template === null) {
            $template = $this->getTemplateFor('general');
        }

        return $template->process($props);
    }

    private function getTemplateFor($name, $path = '/')
    {
        $chunk = $this->modx->getObject('modChunk', array(
            'name' => 'md' . ucfirst($name),
            'OR:name:=' => 'md' . ucfirst(strtolower($name)),
        ));

        if ($chunk) {
            return $chunk;
        }

        $templatesDir = $this->md->getOption('templatesPath') . 'services' . $path;
        $files = [
            $name . '.html',
            strtolower($name) . '.html',
        ];

        foreach ($files as $file) {
            if (file_exists($templatesDir . $file)) {
                /** @var \modChunk $chunk */
                $chunk = $this->modx->newObject('modChunk', array('name' => 'inline-' . uniqid()));
                $chunk->setCacheable(false);
                $chunk->set('snippet', file_get_contents($templatesDir . $file));

                return $chunk;
            }
        }

        return null;
    }

    private function convertNull($props)
    {
        foreach ($props as $key => $value) {
            if (is_null($value)) {
                $props[$key] = "";
            }
        }

        return $props;
    }

    private function getFavicon($url)
    {
        $favicon = '';
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

    public function getCSS()
    {
        return array($this->md->getOption('cssUrl') . 'cards.css');
    }
}