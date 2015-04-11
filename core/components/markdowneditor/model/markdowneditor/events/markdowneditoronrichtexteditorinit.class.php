<?php
class MarkdownEditorOnRichTextEditorInit extends MarkdownEditorPlugin {

    public function process() {
        $this->modx->controller->addLexiconTopic('markdowneditor:default');

        $includeGFM = (int) $this->markdowneditor->getOption('general.include_ghfmd_manager', null, 1);
        if ($includeGFM) {
            $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'github-markdown.css');
        }

        $customCSS = $this->markdowneditor->getOption('general.custom_css_manager', null, '');
        if (!empty($customCSS)) {
            $this->modx->regClientCSS($customCSS);
        }

        $oEmbedServices = $this->markdowneditor->getEmbedServiceInstances($this->modx);
        foreach ($oEmbedServices as $oEmbedService) {
            $oEmbedCSS = $oEmbedService->getCSS();

            foreach ($oEmbedCSS as $css) {
                $this->modx->regClientCSS($css);
            }
        }

        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'highlight.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'dependencies.css');
        $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'app.css');

        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/dependencies.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'highlight.pack.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/acethemes.js');
        $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'mgr/app.js');
    }
}
 