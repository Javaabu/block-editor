<?php

namespace Javaabu\BlockEditor\Blocks;

use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Rendering\Renderer;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;
use Javaabu\BlockEditor\Support\ContentExpression;

/**
 * A block (node type) of the editor: its JSON name, where it may appear, its
 * attributes and their validation, how it renders in Blade and React, and the JS
 * module that implements it in the editor.
 */
abstract class Block
{
    /**
     * The node type in the JSON, also the name of the TipTap node (camelCase).
     */
    protected string $name;

    /**
     * Space-separated groups. `block` blocks may appear wherever blocks may; an
     * empty group means the block only appears inside a parent that names it.
     */
    protected string $group = 'block';

    /**
     * What the block contains, as a ProseMirror content expression: `inline*` for
     * text, `block+` for nested blocks, `listItem+`, or empty for a leaf block.
     */
    protected string $content = '';

    /**
     * Marks allowed in the block's text: null for every mark, or a list of names.
     *
     * @var array<int, string>|null
     */
    protected ?array $marks = null;

    /**
     * The Blade view that renders the block. Default: block-editor::blocks.{name}.
     */
    protected ?string $view = null;

    /**
     * The javaabu/manifest script asset that implements the block in the editor
     * (`acme::alert-block`). Without one, the editor builds a generic block from
     * the attributes.
     */
    protected ?string $script = null;

    /**
     * Shown in the "/" and "+" menus. Child blocks (list items, columns) aren't.
     */
    protected bool $insertable = true;

    /**
     * The menu section: text, media, layout, embed or advanced.
     */
    protected string $category = 'text';

    /**
     * A Lucide icon name for the menus.
     */
    protected string $icon = 'square';

    /**
     * Extra search words for the menus.
     *
     * @var array<int, string>
     */
    protected array $keywords = [];

    public static function make(): static
    {
        return app(static::class);
    }

    public function name(): string
    {
        return $this->name;
    }

    /** @return array<int, string> */
    public function groups(): array
    {
        return array_values(array_filter(explode(' ', $this->group)));
    }

    public function content(): ContentExpression
    {
        return ContentExpression::parse($this->content);
    }

    public function isLeaf(): bool
    {
        return $this->content()->isEmpty();
    }

    /**
     * True when the block holds text (and marks), as opposed to other blocks.
     */
    public function isTextblock(): bool
    {
        return $this->content()->allows('text', ['inline']);
    }

    /**
     * @return array<int, string>|null
     */
    public function allowedMarks(): ?array
    {
        return $this->marks;
    }

    public function isInsertable(): bool
    {
        return $this->insertable;
    }

    public function category(): string
    {
        return $this->category;
    }

    public function icon(): string
    {
        return $this->icon;
    }

    /** @return array<int, string> */
    public function keywords(): array
    {
        return $this->keywords;
    }

    public function script(): ?string
    {
        return $this->script;
    }

    public function view(): string
    {
        return $this->view ?? 'block-editor::blocks.' . Str::kebab($this->name);
    }

    public function title(): string
    {
        return $this->translated('title', Str::headline($this->name));
    }

    public function description(): string
    {
        return $this->translated('description', '');
    }

    protected function translated(string $key, string $fallback): string
    {
        $line = "block-editor::strings.blocks.{$this->name}.{$key}";
        $translated = __($line);

        return $translated === $line ? $fallback : $translated;
    }

    /**
     * The block's attributes, keyed by name.
     *
     * @return array<string, Attribute>
     */
    public function attributes(): array
    {
        return [];
    }

    /**
     * Validation rules for the attributes, keyed by name, on top of the rules each
     * Attribute brings.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Custom validation messages for the attribute rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [];
    }

    /**
     * Every rule for the attributes: each Attribute's rules plus rules().
     *
     * @return array<string, array<int, mixed>>
     */
    public function getValidationRules(): array
    {
        $rules = [];

        foreach ($this->attributes() as $name => $attribute) {
            $rules[$name] = $attribute->getRules();
        }

        foreach ($this->rules() as $name => $extra) {
            $rules[$name] = [...($rules[$name] ?? []), ...(is_array($extra) ? $extra : explode('|', $extra))];
        }

        return $rules;
    }

    /** @return array<string, string> */
    public function getValidationAttributes(): array
    {
        $names = [];

        foreach ($this->attributes() as $name => $attribute) {
            $names[$name] = $attribute->getLabel($name);
        }

        return $names;
    }

    /**
     * The attributes with every value cast to its type and every missing one set
     * to its default. Attributes the block doesn't define are dropped.
     *
     * @param  array<string, mixed>  $attrs
     * @return array<string, mixed>
     */
    public function castAttributes(array $attrs): array
    {
        $cast = [];

        foreach ($this->attributes() as $name => $attribute) {
            $cast[$name] = $attribute->cast($attrs[$name] ?? null);
        }

        return $cast;
    }

    /**
     * Last changes to a node after its attributes, marks and children were
     * sanitized. Return null to drop the node.
     */
    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        return $node;
    }

    /**
     * True when the node shows nothing: a text block without text, or a container
     * whose children are all empty. Leaf blocks (an image, a divider) never are.
     */
    public function isEmpty(Node $node): bool
    {
        if ($this->isLeaf()) {
            return false;
        }

        $manager = app(BlockEditorManager::class);

        foreach ($node->content as $child) {
            if ($child->isText()) {
                if (trim($child->text ?? '') !== '') {
                    return false;
                }

                continue;
            }

            if (! $manager->has($child->type)) {
                continue;
            }

            if (! $manager->get($child->type)->isEmpty($child)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Renders the node to HTML. By default with the block's Blade view, which gets
     * `$node`, `$attrs`, `$content` (the rendered children), `$block` and `$renderer`.
     */
    public function render(Node $node, Renderer $renderer): string
    {
        return trim(view($this->view(), $this->viewData($node, $renderer))->render());
    }

    /** @return array<string, mixed> */
    protected function viewData(Node $node, Renderer $renderer): array
    {
        return [
            'node' => $node,
            'attrs' => $node->attrs,
            'content' => new HtmlString($renderer->renderChildren($node)),
            'block' => $this,
            'renderer' => $renderer,
        ];
    }

    /**
     * The block's text for search indexes and excerpts.
     */
    public function toText(Node $node, Renderer $renderer): string
    {
        return $renderer->childrenToText($node);
    }

    /**
     * The `textAlign` attribute of text blocks: logical start, center or end, set from the toolbar.
     */
    protected static function alignment(): Attribute
    {
        return Attribute::enum(['start', 'center', 'end'])->hidden();
    }

    /**
     * An explicit `dir` (from pasted HTML). Without one, blocks render `dir="auto"`.
     */
    protected static function direction(): Attribute
    {
        return Attribute::enum(['ltr', 'rtl'])->hidden();
    }

    /**
     * What the editor needs to know about the block.
     *
     * @return array<string, mixed>
     */
    public function toEditor(): array
    {
        $attributes = [];

        foreach ($this->attributes() as $name => $attribute) {
            $attributes[$name] = $attribute->toEditor($name);
        }

        return [
            'name' => $this->name(),
            'title' => $this->title(),
            'description' => $this->description(),
            'group' => $this->group,
            'content' => $this->content,
            'marks' => $this->allowedMarks(),
            'insertable' => $this->isInsertable(),
            'category' => $this->category(),
            'icon' => $this->icon(),
            'keywords' => $this->keywords(),
            'attributes' => (object) $attributes,
        ];
    }
}
