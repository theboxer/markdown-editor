<?php
namespace MarkdownEditor\Event;

class OnBeforeDocFormSave extends Event {
    public function process() {
        /** @var \modResource $resource */
        $resource = $this->sp['resource'];
        $resourceArray = $resource->toArray();

        foreach ($resourceArray as $field => $v) {
            if (!strpos($field, '_markdown')) continue;
            $fieldName = str_replace('_markdown', '', $field);
            $content = $resource->get($fieldName);

            $content = $this->embedContent($content);

            $resource->set($fieldName, $content);
            if ($fieldName == 'ta') {
                $resource->set('content', $content);
            }
        }

        return;
    }
    
    protected function embedContent($content) {
        $fences = array();
        preg_match_all('~<code.+?(?=</code>)</code>~s', $content, $fences);

        $clearedContent = $content;
        if (isset($fences[0])) {
            foreach ($fences[0] as $value) {
                $clearedContent = str_replace($value, '', $clearedContent);
            }
        }

        $matches = array();
        preg_match_all('/<div[^>]*>\[embed ([^\] ]+)\]<\/div>/', $clearedContent, $matches);

        if (isset($matches[1])) {
            foreach ($matches[1] as $key => $url) {
                $html = '<div class="markdowneditor-oembed-content">' . $this->md->getOEmbed($url) . '</div>';

                $content = str_replace($matches[0][$key], $html, $content);
            }
        }

        return $content;
    }
}
