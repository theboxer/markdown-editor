<?php
class MarkdownEditorOnWebPageInit extends MarkdownEditorPlugin {

    public function init()
    {
        return true;
    }

    public function process() {
        $includeGitHubMarkdown = (int) $this->markdowneditor->getOption('general.include_ghfmd', null, 1);
        if ($includeGitHubMarkdown) {
            $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'github-markdown.css');
        }

        $includeHightLight = (int) $this->markdowneditor->getOption('general.include_highlight', null, 1);
        if ($includeHightLight) {
            $this->modx->regClientCSS($this->markdowneditor->getOption('cssUrl') . 'highlight.css');
            $this->modx->regClientStartupScript($this->markdowneditor->getOption('jsUrl') . 'highlight.pack.js');
        }

        $oEmbedService = $this->markdowneditor->getEmbedServiceInstance($this->modx);
        $oEmbedCSS = $oEmbedService->getCSS();

        $loadOEmbedCSS = (int) $this->markdowneditor->getOption('oembed.frontend_css', null, 1);
        if ($loadOEmbedCSS) {
            foreach ($oEmbedCSS as $css) {
                $this->modx->regClientCSS($css);
            }
        }

        $oEmbedHTML = $oEmbedService->getHTML();
        foreach ($oEmbedHTML as $html) {
            $this->modx->regClientHTMLBlock($html);
        }

        return;
    }
}
