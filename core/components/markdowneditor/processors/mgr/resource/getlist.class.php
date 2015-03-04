<?php
class MarkdownEditorResourceGetListProcessor extends modObjectGetListProcessor {
    public $classKey = 'modResource';
    public $defaultSortField = 'pagetitle';
    public $defaultSortDirection = 'ASC';
    public $objectType = 'modResource';

    public function prepareQueryBeforeCount(xPDOQuery $c) {
        $prefix = $this->getProperty('prefix');
        if (!empty($prefix)) {
            $c->where(array(
                'pagetitle:LIKE' => '%' . $prefix . '%'
            ));
        }

        return $c;
    }

    public function iterate(array $data) {
        $list = array();
        $list = $this->beforeIteration($list);
        $this->currentIndex = 0;
        /** @var xPDOObject|modAccessibleObject $object */
        foreach ($data['results'] as $object) {
            if ($this->checkListPermission && $object instanceof modAccessibleObject && !$object->checkPolicy('list')) continue;
            $objectArray = $this->prepareRow($object);
            if (!empty($objectArray) && is_array($objectArray)) {
                $resourceArray = array();
                $resourceArray['caption'] = $objectArray['pagetitle'];
                $resourceArray['snippet'] = '[' . $objectArray['pagetitle'] . ']([[~' . $objectArray['id'] . ']])';
                $resourceArray['meta'] = 'Resources';

                $list[] = $resourceArray;
                $this->currentIndex++;
            }
        }
        $list = $this->afterIteration($list);
        return $list;
    }

}
return 'MarkdownEditorResourceGetListProcessor';