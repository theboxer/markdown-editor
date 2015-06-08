<?php
namespace MarkdownEditor\Event;

class OnRichTextEditorInit extends Event {

    public function process() {
        $this->modx->controller->addLexiconTopic('markdowneditor:default');

        $includeGFM = (int) $this->md->getOption('general.include_ghfmd_manager', null, 1);
        if ($includeGFM) {
            $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'github-markdown.css');
        }

        $customCSS = $this->md->getOption('general.custom_css_manager', null, '');
        if (!empty($customCSS)) {
            $this->modx->regClientCSS($customCSS);
        }

        $oEmbedServices = $this->md->getEmbedServiceInstances();
        foreach ($oEmbedServices as $oEmbedService) {
            $oEmbedCSS = $oEmbedService->getCSS();

            foreach ($oEmbedCSS as $css) {
                $this->modx->regClientCSS($css);
            }
        }

        $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'highlight.css');
        $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'dependencies.css');
        $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'app.css');

        $this->modx->regClientStartupScript($this->md->getOption('jsUrl') . 'mgr/dependencies.js');
        $this->modx->regClientStartupScript($this->md->getOption('jsUrl') . 'highlight.pack.js');
        $this->modx->regClientStartupScript($this->md->getOption('jsUrl') . 'mgr/acethemes.js');
        $this->modx->regClientStartupScript($this->md->getOption('jsUrl') . 'mgr/app.js');
    }
}
 