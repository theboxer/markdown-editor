<?php
namespace MarkdownEditor\Event;

abstract class Event {

    /** @var \modX */
    protected $modx;

    /** @var \MarkdownEditor */
    protected $md;

    /** @var array */
    protected $sp;

    public function __construct(\modX &$modx, &$scriptProperties) {
        $this->sp =& $scriptProperties;
        $this->modx =& $modx;
        $this->md = $this->modx->markdowneditor;
    }

    public function run() {
        $init = $this->init();
        if ($init !== true) {
            return;
        }
        
        $this->process();
    }

    public function init()
    {
        if (isset($this->sp['resource'])) {
            if (!$this->sp['resource']->richtext) return false;
        }

        $useEditor = $this->modx->getOption('use_editor', false);
        $whichEditor = $this->modx->getOption('which_editor', '');

        if ($useEditor && $whichEditor == 'MarkdownEditor') return true;

        return false;
    }

    abstract public function process();
}