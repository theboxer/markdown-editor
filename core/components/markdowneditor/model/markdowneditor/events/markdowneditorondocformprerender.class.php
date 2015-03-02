<?php
class MarkdownEditorOnDocFormPrerender extends MarkdownEditorPlugin {
    public function process() {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        if (!$resource) return;

        $markdown = $resource->getProperty('markdown', 'markdowneditor', '');

        $test = array('content' => $markdown);

        $this->modx->regClientStartupHTMLBlock('<script type="text/javascript">
            MarkdownEditor_config = '.$this->modx->toJSON($this->markdowneditor->options).';
            MarkdownEditor_content = ' . $this->modx->toJSON($test) . ';
        </script>');


        return;
    }
}
