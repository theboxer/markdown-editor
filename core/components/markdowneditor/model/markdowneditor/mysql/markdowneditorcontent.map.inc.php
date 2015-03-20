<?php
/**
 * @package markdowneditor
 */
$xpdo_meta_map['MarkdownEditorContent']= array (
  'package' => 'markdowneditor',
  'version' => NULL,
  'table' => 'markdowneditor_content',
  'extends' => 'xPDOObject',
  'fields' => 
  array (
    'object_id' => NULL,
    'element_name' => NULL,
    'namespace' => NULL,
    'content' => '',
  ),
  'fieldMeta' => 
  array (
    'object_id' => 
    array (
      'dbtype' => 'int',
      'attributes' => 'unsigned',
      'precision' => '10',
      'phptype' => 'integer',
      'null' => false,
      'index' => 'pk',
    ),
    'element_name' => 
    array (
      'dbtype' => 'varchar',
      'precision' => '100',
      'phptype' => 'string',
      'null' => false,
      'index' => 'pk',
    ),
    'namespace' => 
    array (
      'dbtype' => 'varchar',
      'precision' => '40',
      'phptype' => 'string',
      'null' => false,
      'index' => 'pk',
    ),
    'content' => 
    array (
      'dbtype' => 'mediumtext',
      'phptype' => 'string',
      'null' => false,
      'default' => '',
    ),
  ),
  'indexes' => 
  array (
    'PRIMARY' => 
    array (
      'alias' => 'PRIMARY',
      'primary' => true,
      'unique' => true,
      'type' => 'BTREE',
      'columns' => 
      array (
        'object_id' => 
        array (
          'length' => '',
          'collation' => 'A',
          'null' => false,
        ),
        'element_name' => 
        array (
          'length' => '',
          'collation' => 'A',
          'null' => false,
        ),
        'namespace' => 
        array (
          'length' => '',
          'collation' => 'A',
          'null' => false,
        ),
      ),
    ),
  ),
);
