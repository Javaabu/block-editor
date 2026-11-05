<?php

namespace Javaabu\BlockEditor\Validation;

use Illuminate\Support\Facades\Validator;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Blocks\Attribute;
use Javaabu\BlockEditor\Blocks\Block;
use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Profile;
use Javaabu\BlockEditor\Support\ContentExpression;

/**
 * Checks content against the registered blocks: known and allowed node types,
 * children that fit each block's content expression, allowed marks, and each
 * block's (and mark's) attribute rules.
 */
class ContentValidator
{
    /** @var array<int, ContentError> */
    protected array $errors = [];

    public function __construct(protected BlockEditorManager $manager) {}

    /**
     * @return array<int, ContentError>
     */
    public function validate(Node $root, Profile $profile): array
    {
        $this->errors = [];

        $this->children($root, ContentExpression::parse('block*'), null, $profile, '', null, (int) config('block-editor.sanitize.max_depth', 20));

        return $this->errors;
    }

    protected function children(Node $parent, ContentExpression $expression, ?Block $block, Profile $profile, string $path, ?int $top, int $depth): void
    {
        if ($depth <= 0) {
            $this->error($path, $top, $block, __('block-editor::strings.validation.too_deep'));

            return;
        }

        $count = count($this->errors);
        $types = [];

        foreach ($parent->content as $index => $child) {
            $child_path = ltrim("{$path}.content.{$index}", '.');
            $child_top = $top ?? $index;
            $types[] = [$child->type, $this->manager->groupsOf($child->type)];

            if ($child->isText()) {
                $this->text($child, $expression, $block, $profile, $child_path, $child_top);

                continue;
            }

            $this->node($child, $expression, $profile, $child_path, $child_top, $depth);
        }

        if (count($this->errors) > $count) {
            return;
        }

        if ($expression->matches($types)) {
            return;
        }

        $this->error($path === '' ? 'content' : "{$path}.content", $top, $block, __('block-editor::strings.validation.content'));
    }

    protected function node(Node $node, ContentExpression $expression, Profile $profile, string $path, int $top, int $depth): void
    {
        if ($node->type === '' || ! $this->manager->has($node->type)) {
            $this->error($path, $top, null, __('block-editor::strings.validation.unknown', ['type' => $node->type ?: '?']));

            return;
        }

        $block = $this->manager->get($node->type);

        if (! $profile->allowsBlock($block) || ! $expression->allows($block->name(), $block->groups())) {
            $this->error($path, $top, $block, __('block-editor::strings.validation.not_allowed', ['block' => $block->title()]));

            return;
        }

        $this->attributes($this->withDefaults($node->attrs, $block->attributes()), $block->getValidationRules(), $block->messages(), $block->getValidationAttributes(), "{$path}.attrs", $top, $block);

        if ($block->isLeaf()) {
            return;
        }

        $this->children($node, $block->content(), $block, $profile, $path, $top, $depth - 1);
    }

    protected function text(Node $node, ContentExpression $expression, ?Block $block, Profile $profile, string $path, int $top): void
    {
        if (! $expression->allows('text', ['inline'])) {
            $this->error($path, $top, $block, __('block-editor::strings.validation.content'));

            return;
        }

        if (is_null($node->text) || $node->text === '') {
            $this->error($path, $top, $block, __('block-editor::strings.validation.text'));

            return;
        }

        $allowed = $block?->allowedMarks();

        foreach ($node->marks as $index => $mark) {
            $mark_path = "{$path}.marks.{$index}";

            if (! $this->manager->hasMark($mark['type'])) {
                $this->error($mark_path, $top, $block, __('block-editor::strings.validation.unknown_mark', ['type' => $mark['type']]));

                continue;
            }

            $definition = $this->manager->mark($mark['type']);

            if (! $profile->allowsMark($mark['type']) || (! is_null($allowed) && ! in_array($mark['type'], $allowed, true))) {
                $this->error($mark_path, $top, $block, __('block-editor::strings.validation.mark_not_allowed', ['mark' => $definition->title()]));

                continue;
            }

            $this->attributes($this->withDefaults($mark['attrs'] ?? [], $definition->attributes()), $definition->getValidationRules(), [], [], "{$mark_path}.attrs", $top, $block);
        }
    }

    /**
     * @param  array<string, mixed>  $attrs
     * @param  array<string, array<int, mixed>>  $rules
     * @param  array<string, string>  $messages
     * @param  array<string, string>  $names
     */
    protected function attributes(array $attrs, array $rules, array $messages, array $names, string $path, int $top, ?Block $block): void
    {
        if ($rules === []) {
            return;
        }

        $validator = Validator::make($attrs, $rules, $messages, $names);

        if ($validator->passes()) {
            return;
        }

        foreach ($validator->errors()->messages() as $key => $errors) {
            foreach ($errors as $message) {
                $this->error("{$path}.{$key}", $top, $block, $message);
            }
        }
    }

    /**
     * The attributes with defaults for the ones that are missing or null, as the
     * sanitizer stores them.
     *
     * @param  array<string, mixed>  $attrs
     * @param  array<string, Attribute>  $definitions
     * @return array<string, mixed>
     */
    protected function withDefaults(array $attrs, array $definitions): array
    {
        foreach ($definitions as $name => $attribute) {
            $attrs[$name] ??= $attribute->getDefault();
        }

        return $attrs;
    }

    protected function error(string $path, ?int $top, ?Block $block, string $message): void
    {
        $this->errors[] = new ContentError($path, $message, is_null($top) ? null : $top + 1, $block?->title());
    }
}
