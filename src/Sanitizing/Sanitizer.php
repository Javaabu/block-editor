<?php

namespace Javaabu\BlockEditor\Sanitizing;

use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Blocks\Block;
use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Profile;
use Javaabu\BlockEditor\Support\ContentExpression;
use Javaabu\BlockEditor\Support\Url;

/**
 * Makes stored content safe and well-formed: unknown or disallowed blocks and
 * marks are dropped, attributes are cast to their types (unsafe URLs become the
 * default), text loses control characters, and each block's sanitize() runs last
 * (the HTML block runs its HTML through the HTML sanitizer).
 */
class Sanitizer
{
    public function __construct(
        protected BlockEditorManager $manager,
        protected HtmlSanitizer $html,
    ) {}

    public function sanitize(Node $root, Profile $profile): Node
    {
        $max_depth = (int) config('block-editor.sanitize.max_depth', 20);

        return new Node('doc', content: $this->children($root, ContentExpression::parse('block*'), null, $profile, $max_depth));
    }

    /**
     * Sanitizes HTML from an HTML block (or any other block that stores HTML).
     */
    public function html(?string $html): string
    {
        return $this->html->sanitize($html ?? '');
    }

    /**
     * @return array<int, Node>
     */
    protected function children(Node $parent, ContentExpression $expression, ?Block $block, Profile $profile, int $depth): array
    {
        if ($depth <= 0) {
            return [];
        }

        $children = [];

        foreach ($parent->content as $child) {
            $sanitized = $child->isText()
                ? $this->text($child, $expression, $block, $profile)
                : $this->node($child, $expression, $profile, $depth);

            if ($sanitized) {
                $children[] = $sanitized;
            }
        }

        return $this->mergeText($children);
    }

    protected function node(Node $node, ContentExpression $expression, Profile $profile, int $depth): ?Node
    {
        if (! $this->manager->has($node->type)) {
            return null;
        }

        $block = $this->manager->get($node->type);

        if (! $profile->allowsBlock($block)) {
            return null;
        }

        if (! $expression->allows($block->name(), $block->groups())) {
            return null;
        }

        $content = $block->isLeaf()
            ? []
            : $this->children($node, $block->content(), $block, $profile, $depth - 1);

        if (! $block->isLeaf() && ! $block->isTextblock() && $content === []) {
            return null;
        }

        return $block->sanitize(new Node($block->name(), $block->castAttributes($node->attrs), $content), $this);
    }

    protected function text(Node $node, ContentExpression $expression, ?Block $block, Profile $profile): ?Node
    {
        if (! $expression->allows('text', ['inline'])) {
            return null;
        }

        $text = Url::stripControlCharacters($node->text ?? '');

        if ($text === '') {
            return null;
        }

        return Node::text($text, $this->marks($node->marks, $block, $profile));
    }

    /**
     * @param  array<int, array{type: string, attrs?: array<string, mixed>}>  $marks
     * @return array<int, array{type: string, attrs?: array<string, mixed>}>
     */
    protected function marks(array $marks, ?Block $block, Profile $profile): array
    {
        $allowed = $block?->allowedMarks();
        $sanitized = [];

        foreach ($marks as $mark) {
            $type = $mark['type'];

            if (isset($sanitized[$type]) || ! $this->manager->hasMark($type) || ! $profile->allowsMark($type)) {
                continue;
            }

            if (! is_null($allowed) && ! in_array($type, $allowed, true)) {
                continue;
            }

            $definition = $this->manager->mark($type);
            $attrs = $definition->sanitize($definition->castAttributes($mark['attrs'] ?? []));

            if (is_null($attrs)) {
                continue;
            }

            $sanitized[$type] = $attrs === [] ? ['type' => $type] : ['type' => $type, 'attrs' => $attrs];
        }

        return array_values($sanitized);
    }

    /**
     * Joins neighbouring text nodes with the same marks, as ProseMirror does.
     *
     * @param  array<int, Node>  $children
     * @return array<int, Node>
     */
    protected function mergeText(array $children): array
    {
        $merged = [];

        foreach ($children as $child) {
            $last = end($merged);

            if ($last instanceof Node && $last->isText() && $child->isText() && $last->marks == $child->marks) {
                $merged[array_key_last($merged)] = $last->withText($last->text . $child->text);

                continue;
            }

            $merged[] = $child;
        }

        return $merged;
    }
}
