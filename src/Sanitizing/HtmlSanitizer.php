<?php

namespace Javaabu\BlockEditor\Sanitizing;

use Closure;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer as SymfonySanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Cleans raw HTML (from the HTML block) with symfony/html-sanitizer: safe elements
 * and attributes only, no scripts, styles or event handlers, links and media
 * limited to safe schemes, and iframes only from the configured hosts.
 */
class HtmlSanitizer
{
    protected static ?Closure $configure_using = null;

    protected ?SymfonySanitizer $sanitizer = null;

    /**
     * Changes the sanitizer config for every HTML block, e.g. to allow more elements.
     *
     * @param  Closure(HtmlSanitizerConfig): HtmlSanitizerConfig|null  $callback
     */
    public static function configureUsing(?Closure $callback): void
    {
        static::$configure_using = $callback;
    }

    public function sanitize(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        return trim($this->sanitizer()->sanitize($html));
    }

    public function config(): HtmlSanitizerConfig
    {
        $options = config('block-editor.sanitize.html', []);

        $config = (new HtmlSanitizerConfig)
            ->allowSafeElements()
            ->allowLinkSchemes($options['link_schemes'] ?? ['http', 'https', 'mailto', 'tel'])
            ->allowMediaSchemes($options['media_schemes'] ?? ['http', 'https'])
            ->allowRelativeLinks()
            ->allowRelativeMedias()
            ->withMaxInputLength($options['max_length'] ?? 100_000);

        foreach ($options['allow_attributes'] ?? ['class', 'dir', 'lang'] as $attribute) {
            $config = $config->allowAttribute($attribute, '*');
        }

        $iframe_hosts = $options['iframe_hosts'] ?? [];

        if ($iframe_hosts) {
            $config = $config
                ->allowElement('iframe', ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'])
                ->allowMediaHosts($iframe_hosts);
        }

        if (static::$configure_using) {
            $config = (static::$configure_using)($config);
        }

        return $config;
    }

    protected function sanitizer(): SymfonySanitizer
    {
        return $this->sanitizer ??= new SymfonySanitizer($this->config());
    }
}
