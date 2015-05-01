<?php
namespace MarkdownEditor\Event;

class OnWebPageInit extends Event {

    public function init()
    {
        return true;
    }

    public function process() {
        $includeGitHubMarkdown = (int) $this->md->getOption('general.include_ghfmd', null, 1);
        if ($includeGitHubMarkdown) {
            $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'github-markdown.css');
        }

        $includeHightLight = (int) $this->md->getOption('general.include_highlight', null, 1);
        if ($includeHightLight) {
            $this->modx->regClientCSS($this->md->getOption('cssUrl') . 'highlight.css');
            $this->modx->regClientStartupScript($this->md->getOption('jsUrl') . 'highlight.pack.js');
        }

        $oEmbedServices = $this->md->getEmbedServiceInstances();
        foreach ($oEmbedServices as $oEmbedService) {
            $oEmbedCSS = $oEmbedService->getCSS();

            $loadOEmbedCSS = (int) $this->md->getOption('oembed.frontend_css', null, 1);
            if ($loadOEmbedCSS) {
                foreach ($oEmbedCSS as $css) {
                    $this->modx->regClientCSS($css);
                }
            }

            $oEmbedHTML = $oEmbedService->getHTML();
            foreach ($oEmbedHTML as $html) {
                $this->modx->regClientHTMLBlock($html);
            }
        }

        return;
    }
}