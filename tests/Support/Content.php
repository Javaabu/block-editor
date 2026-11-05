<?php

namespace Javaabu\BlockEditor\Tests\Support;

/**
 * Builds TipTap JSON for tests.
 */
class Content
{
    /** @return array<string, mixed> */
    public static function doc(array ...$blocks): array
    {
        return ['type' => 'doc', 'content' => $blocks];
    }

    /** @return array<string, mixed> */
    public static function text(string $text, array $marks = []): array
    {
        return array_filter(['type' => 'text', 'text' => $text, 'marks' => $marks]);
    }

    /** @return array<string, mixed> */
    public static function paragraph(string|array ...$children): array
    {
        return static::node('paragraph', [], ...$children);
    }

    /** @return array<string, mixed> */
    public static function heading(int $level, string|array ...$children): array
    {
        return static::node('heading', ['level' => $level], ...$children);
    }

    /** @return array<string, mixed> */
    public static function node(string $type, array $attrs = [], string|array ...$children): array
    {
        $content = array_map(fn ($child) => is_string($child) ? static::text($child) : $child, $children);

        return array_filter(['type' => $type, 'attrs' => $attrs, 'content' => $content]);
    }
}
