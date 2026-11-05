<?php

namespace Javaabu\BlockEditor\Rendering;

use Javaabu\BlockEditor\Node;

/**
 * Text direction of mixed Dhivehi and English content, as the editor resolves it:
 * text blocks get `dir="auto"`; lists, quotes and tables take the direction of
 * their first strong character, because the browser's auto direction skips
 * children that have their own `dir`.
 */
class Direction
{
    public const array CONTAINERS = ['blockquote', 'bulletList', 'orderedList', 'table'];

    protected const string RTL = '\x{0590}-\x{08FF}\x{200F}\x{FB1D}-\x{FDFF}\x{FE70}-\x{FEFF}';

    protected const string LTR = 'A-Za-z\x{00AA}\x{00B5}\x{00BA}\x{00C0}-\x{00D6}\x{00D8}-\x{00F6}\x{00F8}-\x{02B8}\x{0370}-\x{0482}\x{048A}-\x{058F}\x{0900}-\x{1FFF}\x{200E}\x{2C00}-\x{FB1C}\x{FF21}-\x{FF3A}\x{FF41}-\x{FF5A}';

    /**
     * The direction of the first strong character, or null when there's none.
     */
    public static function detect(?string $text): ?string
    {
        if (is_null($text) || $text === '') {
            return null;
        }

        if (preg_match('/[' . self::RTL . ']|[' . self::LTR . ']/u', $text, $matches) !== 1) {
            return null;
        }

        return preg_match('/^[' . self::RTL . ']$/u', $matches[0]) === 1 ? 'rtl' : 'ltr';
    }

    /**
     * An explicit `dir` on the first descendant that has one, else the first strong
     * character of the text, skipping code. Null when there's no strong text.
     */
    public static function resolve(Node $node): ?string
    {
        foreach ($node->content as $child) {
            if ($child->type === 'codeBlock') {
                continue;
            }

            $dir = $child->attrs['dir'] ?? null;

            if ($dir === 'ltr' || $dir === 'rtl') {
                return $dir;
            }

            if ($child->isText()) {
                $is_code = collect($child->marks)->contains(fn (array $mark) => $mark['type'] === 'code');
                $detected = $is_code ? null : static::detect($child->text);

                if ($detected) {
                    return $detected;
                }

                continue;
            }

            $resolved = static::resolve($child);

            if ($resolved) {
                return $resolved;
            }
        }

        return null;
    }

    /**
     * The `dir` to render: the node's own, or for containers the resolved one, or `auto`.
     */
    public static function of(Node $node): string
    {
        $dir = $node->attrs['dir'] ?? null;

        if ($dir === 'ltr' || $dir === 'rtl') {
            return $dir;
        }

        if (in_array($node->type, self::CONTAINERS, true)) {
            return static::resolve($node) ?? 'auto';
        }

        return 'auto';
    }
}
