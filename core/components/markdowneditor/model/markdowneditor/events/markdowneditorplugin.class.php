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

    abstract public function run();
}