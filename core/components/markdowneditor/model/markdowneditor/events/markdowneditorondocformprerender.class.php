<?php
class MarkdownEditorOnDocFormPrerender extends MarkdownEditorPlugin {
    public function run() {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        if (!$resource) return;

        $markdown = $resource->getProperty('markdown', 'markdowneditor', '');

        $test = array('content' => $markdown);

        $this->modx->regClientStartupHTMLBlock('<script type="text/javascript">
            MarkdownEditor_content = ' . $this->modx->toJSON($test) . ';
        </script>');


        return;
    }
}
