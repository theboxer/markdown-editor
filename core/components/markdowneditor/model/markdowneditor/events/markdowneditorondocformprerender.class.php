<?php
class MarkdownEditorOnDocFormPrerender extends MarkdownEditorPlugin {
    public function process() {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        if ($resource) {
            $markdown = $resource->getProperty('markdown', 'markdowneditor', '');

            $test = array('content' => $markdown);
        } else {
            $test = array();
        }

        $this->modx->regClientStartupHTMLBlock('<script type="text/javascript">
            markdownEditor.config = '.$this->modx->toJSON($this->markdowneditor->options).';
            markdownEditor.content = ' . $this->modx->toJSON($test) . ';
        </script>');


        return;
    }
}
