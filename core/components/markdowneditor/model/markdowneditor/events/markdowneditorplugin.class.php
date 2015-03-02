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

    public function init() {
        return true;
    }

    abstract public function process();
}