<?php
class MarkdownEditorOEmbedProcessor extends modProcessor {

    public function process()
    {
        $url = $this->getProperty('url');
        if (empty($url)) {
            return $this->modx->toJSON(array('success' => false));
        }

        $response = Alb\OEmbed\Simple::request($url, array(
            'maxwidth' => 400,
            'maxheight' => 300,
        ));

        if (!$response) {
            return $this->modx->toJSON(array('success' => false));
        }

        return $this->modx->toJSON(array('success' => true, 'data' => $response->getHtml()));
    }
}
return 'MarkdownEditorOEmbedProcessor';