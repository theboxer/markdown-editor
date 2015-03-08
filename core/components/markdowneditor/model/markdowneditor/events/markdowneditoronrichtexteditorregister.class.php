<?php
class MarkdownEditorOnRichTextEditorRegister extends MarkdownEditorPlugin {

    public function init()
    {
        return true;
    }
    public function process() {
        $this->modx->event->output('MarkdownEditor');
    }
}
