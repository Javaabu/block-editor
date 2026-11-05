<?php

namespace Javaabu\BlockEditor\Rendering;

use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Node;

/**
 * Renders sanitized nodes to HTML with each block's render() (its Blade view),
 * and to plain text. Text is always escaped; unknown nodes render nothing.
 */
class Renderer
{
    public function __construct(protected BlockEditorManager $manager) {}

    public function render(Node $root): string
    {
        return $this->renderChildren($root);
    }

    public function renderNode(Node $node): string
    {
        if ($node->isText()) {
            return $this->renderText($node);
        }

        if (! $this->manager->has($node->type)) {
            return '';
        }

        return $this->manager->get($node->type)->render($node, $this);
    }

    public function renderChildren(Node $node): string
    {
        $html = '';

        foreach ($node->content as $child) {
            $html .= $this->renderNode($child);
        }

        return $html;
    }

    /**
     * Escaped text wrapped in its marks, the first mark outermost.
     */
    public function renderText(Node $node): string
    {
        $html = e($node->text ?? '');

        foreach (array_reverse($node->marks) as $mark) {
            if (! $this->manager->hasMark($mark['type'])) {
                continue;
            }

            $html = $this->manager->mark($mark['type'])->render($html, $mark['attrs'] ?? []);
        }

        return $html;
    }

    public function toText(Node $root): string
    {
        return trim($this->childrenToText($root));
    }

    /**
     * The text of a node's children: inline children joined as they are, blocks
     * separated by a blank line.
     */
    public function childrenToText(Node $node): string
    {
        $parts = [];
        $inline = '';

        foreach ($node->content as $child) {
            if ($child->isText()) {
                $inline .= $child->text;

                continue;
            }

            if ($child->type === 'hardBreak') {
                $inline .= "\n";

                continue;
            }

            if (! $this->manager->has($child->type)) {
                continue;
            }

            $text = trim($this->manager->get($child->type)->toText($child, $this));

            if ($text !== '') {
                $parts[] = $text;
            }
        }

        if ($inline !== '') {
            array_unshift($parts, $inline);
        }

        return implode("\n\n", $parts);
    }

    /**
     * HTML attributes from an array, skipping null and false: ` class="a" dir="auto"`.
     *
     * @param  array<string, scalar|null>  $attributes
     */
    public function attributes(array $attributes): string
    {
        $html = '';

        foreach ($attributes as $name => $value) {
            if (is_null($value) || $value === false) {
                continue;
            }

            $html .= $value === true
                ? " {$name}"
                : ' ' . $name . '="' . e((string) $value) . '"';
        }

        return $html;
    }
}
