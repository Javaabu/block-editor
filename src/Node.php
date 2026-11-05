<?php

namespace Javaabu\BlockEditor;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

/**
 * One node of the TipTap/ProseMirror JSON: a block, an inline node or a text node.
 *
 * @implements Arrayable<string, mixed>
 */
final class Node implements Arrayable, JsonSerializable
{
    /**
     * @param  array<string, mixed>  $attrs
     * @param  array<int, Node>  $content
     * @param  array<int, array{type: string, attrs?: array<string, mixed>}>  $marks
     */
    public function __construct(
        public readonly string $type,
        public readonly array $attrs = [],
        public readonly array $content = [],
        public readonly array $marks = [],
        public readonly ?string $text = null,
    ) {}

    /**
     * Builds a node from decoded JSON. Anything that isn't a node becomes a node with
     * an empty type, which the sanitizer drops and validation rejects.
     */
    public static function fromArray(mixed $data): self
    {
        if (! is_array($data) || ! is_string($data['type'] ?? null)) {
            return new self('');
        }

        $content = [];

        foreach (is_array($data['content'] ?? null) ? $data['content'] : [] as $child) {
            $content[] = self::fromArray($child);
        }

        $marks = [];

        foreach (is_array($data['marks'] ?? null) ? $data['marks'] : [] as $mark) {
            if (! is_array($mark) || ! is_string($mark['type'] ?? null)) {
                continue;
            }

            $marks[] = array_filter([
                'type' => $mark['type'],
                'attrs' => is_array($mark['attrs'] ?? null) ? $mark['attrs'] : null,
            ], fn ($value) => ! is_null($value));
        }

        return new self(
            type: $data['type'],
            attrs: is_array($data['attrs'] ?? null) ? $data['attrs'] : [],
            content: $content,
            marks: $marks,
            text: is_string($data['text'] ?? null) ? $data['text'] : null,
        );
    }

    public static function text(string $text, array $marks = []): self
    {
        return new self('text', marks: $marks, text: $text);
    }

    public function isText(): bool
    {
        return $this->type === 'text';
    }

    public function attr(string $name, mixed $default = null): mixed
    {
        return $this->attrs[$name] ?? $default;
    }

    /**
     * The node's text, with the text of its descendants joined.
     */
    public function textContent(): string
    {
        if ($this->isText()) {
            return $this->text ?? '';
        }

        $text = '';

        foreach ($this->content as $child) {
            $text .= $child->textContent();
        }

        return $text;
    }

    /**
     * @param  array<int, Node>  $content
     */
    public function withContent(array $content): self
    {
        return new self($this->type, $this->attrs, array_values($content), $this->marks, $this->text);
    }

    /**
     * @param  array<string, mixed>  $attrs
     */
    public function withAttrs(array $attrs): self
    {
        return new self($this->type, $attrs, $this->content, $this->marks, $this->text);
    }

    /**
     * @param  array<int, array{type: string, attrs?: array<string, mixed>}>  $marks
     */
    public function withMarks(array $marks): self
    {
        return new self($this->type, $this->attrs, $this->content, array_values($marks), $this->text);
    }

    public function withText(string $text): self
    {
        return new self($this->type, $this->attrs, $this->content, $this->marks, $text);
    }

    /**
     * Calls the callback for this node and every descendant, depth first, with the
     * node and its path of child indexes from this node.
     *
     * @param  callable(Node, array<int, int>): void  $callback
     * @param  array<int, int>  $path
     */
    public function walk(callable $callback, array $path = []): void
    {
        $callback($this, $path);

        foreach ($this->content as $index => $child) {
            $child->walk($callback, [...$path, $index]);
        }
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        $data = ['type' => $this->type];

        if ($this->attrs) {
            $data['attrs'] = $this->attrs;
        }

        if ($this->content) {
            $data['content'] = array_map(fn (Node $child) => $child->toArray(), $this->content);
        }

        if ($this->marks) {
            $data['marks'] = $this->marks;
        }

        if (! is_null($this->text)) {
            $data['text'] = $this->text;
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
