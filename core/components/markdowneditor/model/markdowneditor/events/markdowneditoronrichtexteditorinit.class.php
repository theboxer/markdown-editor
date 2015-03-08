<?php
class MarkdownEditorOnRichTextEditorInit extends MarkdownEditorPlugin {

    public function process() {
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'github-markdown.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'highlight.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'dependencies.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'app.css');

        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/dependencies.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'highlight.pack.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/acethemes.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/app.js');
    }
}
 