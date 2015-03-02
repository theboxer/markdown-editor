<?php
class MarkdownEditorOnRichTextEditorInit extends MarkdownEditorPlugin {

    public function run() {
        if ($this->modx->getOption('use_editor', null, false) == false) return;

        $selectedRTE = isset($editor) ? $editor : $this->modx->getOption('which_editor', null, '');
        if ($selectedRTE !== 'MarkdownEditor') return;

        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'dependencies.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'app.css');

        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/dependencies.js');
        $this->modx->controller->addLastJavascript($this->markdowneditor->getOption('jsUrl') . 'mgr/app.js');
    }
}
 