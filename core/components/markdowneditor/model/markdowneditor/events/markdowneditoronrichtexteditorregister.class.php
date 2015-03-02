<?php
class MarkdownEditorOnRichTextEditorRegister extends MarkdownEditorPlugin {
    public function process() {
        $this->modx->event->output('MarkdownEditor');
    }
}
