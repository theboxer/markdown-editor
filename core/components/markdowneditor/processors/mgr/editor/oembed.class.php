<?php
class MarkdownEditorOEmbedProcessor extends modProcessor {

    public function process()
    {
        $url = $this->getProperty('url');
        if (empty($url)) {
            return $this->modx->toJSON(array('success' => false));
        }

//        $essence = \Essence\Essence::instance();
//
//        $data = $essence->embed($url, array(
//            'maxwidth' => 800,
//            'maxheight' => 600
//        ));

        $html = $this->modx->markdowneditor->getOEmbed($url);
        if ($html === false) {
            return $this->modx->toJSON(array('success' => false));
        }

        return $this->modx->toJSON(array('success' => true, 'data' => $html));
    }
}
return 'MarkdownEditorOEmbedProcessor';