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
        
        if ($useEditor && $whichEditor != 'MarkdownEditor') {
            $initCondition = $this->md->getOption('init.condition');
            if (empty($initCondition)) $initCondition = '[]';
            
            $initCondition = $this->modx->fromJSON($initCondition);
            
            if (!empty($initCondition)) {
                $c = $this->modx->newQuery('modResource');
                $c->where([
                    ['id' => $this->sp['resource']->id],
                    $initCondition,
                ]);
                
                $check = $this->modx->getObject('modResource', $c);
                if ($check) {
                    $this->modx->setOption('which_editor', 'MarkdownEditor');
                    $whichEditor = 'MarkdownEditor';
                }
            }
        }

        if ($useEditor && $whichEditor == 'MarkdownEditor') return true;

        return false;
    }

    abstract public function process();
}