<?php
namespace MarkdownEditor\Event;

class OnDocFormPrerender extends Event {
    public function process() {
        /** @var \modResource $resource */
        $resource = $this->sp['resource'];
        $mdContent = array();

        if ($resource) {
            $markdown = $this->modx->fromJSON($resource->getProperty('markdown', 'markdowneditor', '[]'));
            
            foreach ($markdown as $element => $content) {
                $mdContent[$element] = $content;
            }
        }

        $this->modx->regClientStartupHTMLBlock('<script type="text/javascript">
            markdownEditor.config = '.$this->modx->toJSON($this->md->options).';
            markdownEditor.content = ' . $this->modx->toJSON($mdContent) . ';
        </script>');


        return;
    }
}
