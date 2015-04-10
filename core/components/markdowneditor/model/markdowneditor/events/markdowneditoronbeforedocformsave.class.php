<?php
class MarkdownEditorOnBeforeDocFormSave extends MarkdownEditorPlugin {
    public function process() {
        $resource = $this->resource = $this->scriptProperties['resource'];
        $content = $resource->content;

        $matches = array();
        preg_match_all('/\[embed ([^\] ]+)\]/', $content, $matches);

        if (isset($matches[1])) {
            foreach ($matches[1] as $key => $url) {
                $html = $this->modx->markdowneditor->getOEmbed($url);

                $content = str_replace($matches[0][$key], $html, $content);
            }
        }

        $resource->set('content', $content);

        return;
    }
}
