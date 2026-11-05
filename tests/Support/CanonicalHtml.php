<?php

namespace Javaabu\BlockEditor\Tests\Support;

use Dom\Element;
use Dom\HTMLDocument;
use Dom\Node;
use Dom\Text;

/**
 * Serializes HTML in a canonical form (sorted attributes, no whitespace-only text
 * outside <pre>), so the PHP and React renderers can be compared to the same
 * fixture. tests/js/support/canonical-html.ts does the same in JS.
 */
class CanonicalHtml
{
    protected const array VOID = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];

    public static function from(string $html): string
    {
        $document = HTMLDocument::createFromString("<!DOCTYPE html><html><body>{$html}</body></html>", LIBXML_NOERROR);

        $parts = [];

        foreach ($document->body->childNodes as $child) {
            $serialized = static::node($child, false);

            if (trim($serialized) !== '') {
                $parts[] = $serialized;
            }
        }

        return implode("\n", $parts) . "\n";
    }

    protected static function node(Node $node, bool $in_pre): string
    {
        if ($node instanceof Text) {
            $text = $node->textContent;

            if (! $in_pre && trim($text) === '') {
                return '';
            }

            return htmlspecialchars($text, ENT_NOQUOTES | ENT_HTML5, 'UTF-8', false);
        }

        if (! $node instanceof Element) {
            return '';
        }

        $tag = strtolower($node->tagName);
        $attributes = [];

        foreach ($node->attributes as $attribute) {
            $attributes[$attribute->name] = $attribute->value;
        }

        ksort($attributes);

        $html = "<{$tag}";

        foreach ($attributes as $name => $value) {
            $html .= ' ' . $name . '="' . htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false) . '"';
        }

        $html .= '>';

        if (in_array($tag, self::VOID, true)) {
            return $html;
        }

        foreach ($node->childNodes as $child) {
            $html .= static::node($child, $in_pre || $tag === 'pre');
        }

        return "{$html}</{$tag}>";
    }
}
