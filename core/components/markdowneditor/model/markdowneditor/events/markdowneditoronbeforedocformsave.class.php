<?php
class MarkdownEditorOnBeforeDocFormSave extends MarkdownEditorPlugin {
    public function run() {
        /** @var modResource $resource */
        $resource = $this->scriptProperties['resource'];

        $markdown = $resource->ta_markdown;

        $resource->setProperty('markdown', $markdown, 'markdowneditor');


        return;
    }
}
