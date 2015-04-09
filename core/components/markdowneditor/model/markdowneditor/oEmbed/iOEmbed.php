<?php
namespace MarkdownEditor\oEmbed;

interface iOEmbed {
    public function __construct(\modX &$modx);

    /**
     * @param string $url
     * @throws \Exception
     * @return string HTML representation of URL
     */
    public function extract($url);

    /**
     * Loads custom CSS
     *
     * @return array
     */
    public function getCSS();

    /**
     * Loads custom HTML
     *
     * @return array
     */
    public function getHTML();
}