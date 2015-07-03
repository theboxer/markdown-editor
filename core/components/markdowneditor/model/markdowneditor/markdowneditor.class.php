<?php

/**
 * The main MarkdownEditor service class.
 *
 * @package markdowneditor
 */
class MarkdownEditor {
    public $modx = null;
    public $namespace = 'markdowneditor';
    public $cache = null;
    public $options = array();

    public function __construct(modX &$modx, array $options = array()) {
        $this->modx =& $modx;
        $this->namespace = $this->getOption('namespace', $options, 'markdowneditor');

        $corePath = $this->getOption('core_path', $options, $this->modx->getOption('core_path', null, MODX_CORE_PATH) . 'components/markdowneditor/');
        $assetsPath = $this->getOption('assets_path', $options, $this->modx->getOption('assets_path', null, MODX_ASSETS_PATH) . 'components/markdowneditor/');
        $assetsUrl = $this->getOption('assets_url', $options, $this->modx->getOption('assets_url', null, MODX_ASSETS_URL) . 'components/markdowneditor/');

        /* loads some default paths for easier management */
        $this->options = array_merge(array(
            'namespace' => $this->namespace,
            'corePath' => $corePath,
            'modelPath' => $corePath . 'model/',
            'chunksPath' => $corePath . 'elements/chunks/',
            'snippetsPath' => $corePath . 'elements/snippets/',
            'templatesPath' => $corePath . 'templates/',
            'assetsPath' => $assetsPath,
            'assetsUrl' => $assetsUrl,
            'jsUrl' => $assetsUrl . 'js/',
            'cssUrl' => $assetsUrl . 'css/',
            'connectorUrl' => $assetsUrl . 'connector.php'
        ), $options);

        $this->modx->addPackage('markdowneditor', $this->getOption('modelPath'));
        $this->modx->lexicon->load('markdowneditor:default');
        $this->autoload();
    }

    /**
     * Get a local configuration option or a namespaced system setting by key.
     *
     * @param string $key The option key to search for.
     * @param array $options An array of options that override local options.
     * @param mixed $default The default value returned if the option is not found locally or as a
     * namespaced system setting; by default this value is null.
     * @param bool $skipEmpty
     * @return mixed The option value or the default value specified.
     */
    public function getOption($key, $options = array(), $default = null, $skipEmpty = false) {
        $option = $default;
        if (!empty($key) && is_string($key)) {
            if ($options != null && array_key_exists($key, $options)) {
                $option = $options[$key];
            } elseif (array_key_exists($key, $this->options)) {
                $option = $this->options[$key];
            } elseif (array_key_exists("{$this->namespace}.{$key}", $this->modx->config)) {
                $option = $this->modx->getOption("{$this->namespace}.{$key}", null, $default, $skipEmpty);
            }
        }
        return $option;
    }

    public function explodeAndClean($array, $delimiter = ',')
    {
        $array = explode($delimiter, $array);     // Explode fields to array
        $array = array_map('trim', $array);       // Trim array's values
        $array = array_keys(array_flip($array));  // Remove duplicate fields
        $array = array_filter($array);            // Remove empty values from array

        return $array;
    }

    public function getOEmbed($url)
    {
        $embedServices = $this->getEmbedServiceInstances();

        foreach ($embedServices as $embedService) {
            try {
                return $embedService->extract($url);
            } catch (Exception $e) {
                continue;
            }
        }

        return false;
    }

    /**
     * @return MarkdownEditor\oEmbed\iOEmbed[];
     */
    public function getEmbedServiceInstances()
    {
        $servicesArray = array();

        $services = $this->getOption('oembed.service', array(), 'Essence');
        $services = $this->explodeAndClean($services);

        foreach ($services as $service) {
            $service = ucfirst($service);
            if (strpos($service, '\\') === false) {
                $className = 'MarkdownEditor\\oEmbed\\Service\\' . $service;
                if (!class_exists($className)) {
                    $servicesArray['MarkdownEditor\\oEmbed\\Service\\Essence'] = new MarkdownEditor\oEmbed\Service\Essence($this->modx);
                    continue;
                }

                $servicesArray[$className] = new $className($this->modx);
                continue;
            }

            if (!class_exists($service)) {
                $servicesArray['MarkdownEditor\\oEmbed\\Service\\Essence'] = new MarkdownEditor\oEmbed\Service\Essence($this->modx);
                continue;
            }

            $servicesArray[$service] = new $service($this->modx);
        }

        return $servicesArray;
    }

    protected function autoload()
    {
        require_once $this->getOption('modelPath') . 'vendor/autoload.php';
    }

    /**
     * @param $id
     * @param $element
     * @param $namespace
     * @param $markdown
     * @return bool
     */
    public function saveMarkdown($id, $element, $namespace, $markdown)
    {
        /** @var MarkdownEditorContent $content */
        $content = $this->modx->getObject('MarkdownEditorContent', [
            'object_id' => $id,
            'element_name' => $element,
            'namespace' => $namespace
        ]);
        
        if (!$content) {
            $content = $this->modx->newObject('MarkdownEditorContent');
            $content->set('object_id', $id);
            $content->set('element_name', $element);
            $content->set('namespace', $namespace);
        }

        $content->set('content', $markdown);
        return $content->save();
    }

    /**
     * @param $id
     * @param $element
     * @param $namespace
     * @return string
     */
    public function loadMarkdown($id, $element, $namespace)
    {
        /** @var MarkdownEditorContent $content */
        $content = $this->modx->getObject('MarkdownEditorContent', [
            'object_id' => $id,
            'element_name' => $element,
            'namespace' => $namespace
        ]);
        
        if (!$content) return '';

        return $content->content;
        
    }
}