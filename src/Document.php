<?php

namespace Javaabu\BlockEditor;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\HtmlString;
use Javaabu\BlockEditor\Casts\AsBlockDocument;
use Javaabu\BlockEditor\Rendering\Renderer;
use JsonSerializable;

/**
 * Block editor content: the root `doc` node of the TipTap JSON.
 *
 * Echoing a document in Blade (`{{ $post->body }}`) renders it, sanitized.
 *
 * @implements Arrayable<string, mixed>
 */
final class Document implements Arrayable, Castable, Htmlable, Jsonable, JsonSerializable
{
    public function __construct(protected Node $root) {}

    /**
     * A document from a Document, a Node, decoded JSON (a `doc` node, another node
     * or a list of nodes), a JSON string, or null.
     */
    public static function make(mixed $content): self
    {
        if ($content instanceof self) {
            return $content;
        }

        if ($content instanceof Node) {
            return $content->type === 'doc'
                ? new self($content)
                : new self(new Node('doc', content: [$content]));
        }

        if (is_string($content)) {
            $content = trim($content) === '' ? null : json_decode($content, true);
        }

        if (! is_array($content) || $content === []) {
            return self::empty();
        }

        if (array_is_list($content)) {
            return new self(new Node('doc', content: array_map(fn ($node) => Node::fromArray($node), $content)));
        }

        return self::make(Node::fromArray($content));
    }

    public static function empty(): self
    {
        return new self(new Node('doc'));
    }

    public function root(): Node
    {
        return $this->root;
    }

    /**
     * The top-level blocks.
     *
     * @return array<int, Node>
     */
    public function blocks(): array
    {
        return $this->root->content;
    }

    /**
     * True when there's nothing to show: no blocks, or only empty paragraphs.
     */
    public function isEmpty(): bool
    {
        $manager = app(BlockEditorManager::class);

        foreach ($this->root->content as $node) {
            if (! $manager->has($node->type)) {
                continue;
            }

            if (! $manager->get($node->type)->isEmpty($node)) {
                return false;
            }
        }

        return true;
    }

    public function isNotEmpty(): bool
    {
        return ! $this->isEmpty();
    }

    public function sanitize(string|Profile|null $profile = null): self
    {
        return app(BlockEditorManager::class)->sanitize($this, $profile);
    }

    /**
     * Sanitized HTML of the blocks, for `{!! !!}`-free Blade: `{{ $document->render() }}`.
     */
    public function render(string|Profile|null $profile = null): HtmlString
    {
        return new HtmlString(app(BlockEditorManager::class)->render($this, $profile));
    }

    public function toHtml(): string
    {
        return $this->render()->toHtml();
    }

    /**
     * Plain text, with a blank line between blocks: for excerpts and search.
     */
    public function toText(string|Profile|null $profile = null): string
    {
        return app(Renderer::class)->toText($this->sanitize($profile)->root());
    }

    /**
     * The first characters of the text, on a word boundary.
     */
    public function excerpt(int $limit = 200, string $end = '…'): string
    {
        return str($this->toText())->squish()->limit($limit, $end, preserveWords: true)->toString();
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['type' => 'doc', 'content' => array_map(fn (Node $node) => $node->toArray(), $this->root->content)];
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    public function toJson($options = 0): string
    {
        return json_encode($this->toArray(), $options | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    public static function castUsing(array $arguments): string
    {
        return AsBlockDocument::class;
    }
}
