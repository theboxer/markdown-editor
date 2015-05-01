<?php
namespace MarkdownEditor\Event;

class OnRichTextEditorRegister extends Event {

    public function init()
    {
        return true;
    }
    public function process() {
        $this->modx->event->output('MarkdownEditor');
    }
}
