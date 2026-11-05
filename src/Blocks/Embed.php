<?php

namespace Javaabu\BlockEditor\Blocks;

use Closure;
use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

/**
 * An embedded video. Only known providers are framed (YouTube through
 * youtube-nocookie.com, and Vimeo); other links render as a plain link.
 */
class Embed extends Block
{
    /** @var array<string, Closure(string): ?string> */
    protected static array $providers = [];

    protected string $name = 'embed';

    protected string $category = 'embed';

    protected string $icon = 'play';

    protected array $keywords = ['video', 'youtube', 'vimeo', 'iframe'];

    /**
     * Adds a provider: a callback that turns a link into an embeddable https URL,
     * or returns null. Register the same provider in JS with registerEmbedProvider()
     * so the editor and the React renderer frame it too.
     *
     * @param  Closure(string): ?string  $resolver
     */
    public static function provider(string $name, Closure $resolver): void
    {
        static::$providers[$name] = $resolver;
    }

    public static function forgetProvider(string $name): void
    {
        unset(static::$providers[$name]);
    }

    public function attributes(): array
    {
        return [
            'src' => Attribute::url()->required(),
            'title' => Attribute::string()->max(255)->thaana(),
        ];
    }

    /**
     * The URL to frame for a link, or null when no enabled provider knows it.
     */
    public function embedUrl(?string $url): ?string
    {
        if (is_null($url) || $url === '') {
            return null;
        }

        $enabled = config('block-editor.embeds.providers', ['youtube', 'vimeo']);

        foreach ($this->resolvers() as $name => $resolver) {
            if (! in_array($name, $enabled, true) && ! array_key_exists($name, static::$providers)) {
                continue;
            }

            $embed = $resolver($url);

            if (is_string($embed) && str_starts_with($embed, 'https://')) {
                return $embed;
            }
        }

        return null;
    }

    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        return is_null($node->attr('src'))
            ? null
            : $node;
    }

    /** @return array<string, Closure(string): ?string> */
    protected function resolvers(): array
    {
        return [
            'youtube' => fn (string $url) => static::youtube($url),
            'vimeo' => fn (string $url) => static::vimeo($url),
            ...static::$providers,
        ];
    }

    public static function youtube(string $url): ?string
    {
        $parts = static::parse($url);

        if (! $parts) {
            return null;
        }

        [$host, $path, $query] = $parts;

        $id = match ($host) {
            'youtu.be' => ltrim($path, '/'),
            'youtube.com', 'youtube-nocookie.com' => $query['v'] ?? (preg_match('~^/(?:embed|shorts|live)/([^/?#]+)~', $path, $matches) === 1 ? $matches[1] : ''),
            default => null,
        };

        if (! is_string($id) || preg_match('/^[\w-]{6,20}$/', $id) !== 1) {
            return null;
        }

        return "https://www.youtube-nocookie.com/embed/{$id}";
    }

    public static function vimeo(string $url): ?string
    {
        $parts = static::parse($url);

        if (! $parts) {
            return null;
        }

        [$host, $path] = $parts;

        if ($host !== 'vimeo.com' && $host !== 'player.vimeo.com') {
            return null;
        }

        if (preg_match('~(?:^|/)(\d{4,12})(?:$|/)~', $path, $matches) !== 1) {
            return null;
        }

        return "https://player.vimeo.com/video/{$matches[1]}";
    }

    /**
     * @return array{0: string, 1: string, 2: array<string, mixed>}|null
     */
    protected static function parse(string $url): ?array
    {
        $parts = parse_url(trim($url));

        if (! is_array($parts) || ! in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)) {
            return null;
        }

        parse_str($parts['query'] ?? '', $query);

        $host = preg_replace('/^(www\.|m\.)/', '', strtolower($parts['host'] ?? ''));

        return [$host, $parts['path'] ?? '', $query];
    }
}
