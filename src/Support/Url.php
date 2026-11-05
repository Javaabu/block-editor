<?php

namespace Javaabu\BlockEditor\Support;

/**
 * URL and text checks shared by the sanitizer, the validation rule and attribute casts.
 */
class Url
{
    /**
     * True for http(s), mailto and tel links, and for relative URLs (`/about`, `#top`,
     * `?page=2`). `javascript:`, `data:`, `vbscript:` and other schemes are unsafe.
     */
    public static function isSafe(?string $url): bool
    {
        if (is_null($url)) {
            return false;
        }

        // Browsers ignore whitespace and control characters inside a scheme ("java\tscript:").
        $url = preg_replace('/[\x00-\x20\x7F]+/u', '', $url) ?? '';

        if ($url === '') {
            return false;
        }

        if (preg_match('/^[a-z][a-z0-9+.\-]*:/i', $url, $matches) !== 1) {
            return ! str_starts_with($url, '//') || static::isSafe("https:{$url}");
        }

        $scheme = strtolower(rtrim($matches[0], ':'));

        return in_array($scheme, config('block-editor.sanitize.url_schemes', ['http', 'https', 'mailto', 'tel']), true);
    }

    /**
     * True for URLs an image may load from: safe links (except mailto/tel) and raster
     * `data:image` URLs.
     */
    public static function isSafeImage(?string $url): bool
    {
        if (is_null($url)) {
            return false;
        }

        $url = trim($url);

        if (preg_match('/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+\/=\s]+$/i', $url) === 1) {
            return (bool) config('block-editor.sanitize.data_images', false);
        }

        if (preg_match('/^(mailto|tel):/i', $url) === 1) {
            return false;
        }

        return static::isSafe($url);
    }

    /**
     * Removes ASCII control characters, except tabs and new lines.
     */
    public static function stripControlCharacters(string $text): string
    {
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    }
}
