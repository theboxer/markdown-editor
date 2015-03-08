<?php
class MarkdownEditorOnBeforeDocFormSave extends MarkdownEditorPlugin {
    public function process() {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        $markdown = $resource->ta_markdown;

        $resource->setProperty('markdown', $markdown, 'markdowneditor');

        $resource->ta_markdown = '';
        return;
    }
}
