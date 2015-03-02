<?php
class MarkdownEditorOnRichTextEditorRegister extends MarkdownEditorPlugin {
    public function run() {
        $this->modx->event->output('MarkdownEditor');
        return;
    }
}
