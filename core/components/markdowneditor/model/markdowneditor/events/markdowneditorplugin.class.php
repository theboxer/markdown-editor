<?php
abstract class MarkdownEditorPlugin {

    /** @var modX $modx */
    protected $modx;

    /** @var MarkdownEditor $markdowneditor */
    protected $markdowneditor;

    /** @var array $scriptProperties */
    protected $scriptProperties;

    public function __construct(&$modx, &$scriptProperties) {
        $this->scriptProperties =& $scriptProperties;
        $this->modx =& $modx;
        $this->markdowneditor = $this->modx->markdowneditor;
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
        if (isset($this->scriptProperties['resource'])) {
            if (!$this->scriptProperties['resource']->richtext) return false;
        }

        $useEditor = $this->modx->getOption('use_editor', false);
        $whichEditor = $this->modx->getOption('which_editor', '');

        if ($useEditor && $whichEditor == 'MarkdownEditor') return true;

        return false;
    }

    abstract public function process();
}