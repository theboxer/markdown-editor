<?php
namespace MarkdownEditor\Event;

class OnDocFormPrerender extends Event {
    public function process() {
        /** @var \modResource $resource */
        $resource = $this->sp['resource'];
        $mdContent = array();

        if ($resource) {
            $c = $this->modx->newQuery('MarkdownEditorContent');
            $c->where(array(
                'object_id' => $resource->id,
                'namespace' => 'core'
            ));

            /** @var \MarkdownEditorContent[] $contents */
            $contents = $this->modx->getIterator('MarkdownEditorContent', $c);
            foreach ($contents as $content) {
                $mdContent[$content->element_name] = $content->content;
            }
        }

        $this->modx->regClientStartupHTMLBlock('<script type="text/javascript">
            markdownEditor.config = '.$this->modx->toJSON($this->md->options).';
            markdownEditor.content = ' . $this->modx->toJSON($mdContent) . ';
        </script>');


        return;
    }
}
