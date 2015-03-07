<?php
class MarkdownEditorOnRichTextEditorInit extends MarkdownEditorPlugin {

    public function init()
    {
        if (isset($this->scriptProperties['resource'])) {
            if (!$this->scriptProperties['resource']->richtext) return false;
        }

        $useEditor = $this->modx->getOption('use_editor', false);
        $whichEditor = $this->modx->getOption('which_editor', '');

        if ($useEditor && $whichEditor == 'MarkdownEditor') return true;

        return false;
    }

    public function process() {
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'dependencies.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'app.css');

        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/dependencies.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/app.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/extras/markdowneditor.window.js');
    }
}
 