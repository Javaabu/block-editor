<?php

namespace Javaabu\BlockEditor\Marks;

use Illuminate\Support\Str;
use Javaabu\BlockEditor\Blocks\Attribute;

/**
 * Inline formatting on text: bold, a link, …. Marks render as a wrapping element.
 */
abstract class Mark
{
    protected string $name;

    protected string $tag;

    public function name(): string
    {
        return $this->name;
    }

    public function title(): string
    {
        $line = "block-editor::strings.marks.{$this->name}";
        $translated = __($line);

        return $translated === $line ? Str::headline($this->name) : $translated;
    }

    /** @return array<string, Attribute> */
    public function attributes(): array
    {
        return [];
    }

    /**
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
     * Last changes to a mark after its attributes were cast. Return null to drop it.
     *
     * @param  array<string, mixed>  $attrs
     * @return array<string, mixed>|null
     */
    public function sanitize(array $attrs): ?array
    {
        return $attrs;
    }

    /** @return array<string, array<int, mixed>> */
    public function getValidationRules(): array
    {
        $rules = [];

        foreach ($this->attributes() as $name => $attribute) {
            $rules[$name] = $attribute->getRules();
        }

        return $rules;
    }

    /**
     * HTML attributes of the wrapping element.
     *
     * @param  array<string, mixed>  $attrs
     * @return array<string, scalar|null>
     */
    public function htmlAttributes(array $attrs): array
    {
        return [];
    }

    /**
     * Wraps rendered (already escaped) HTML in the mark's element.
     *
     * @param  array<string, mixed>  $attrs
     */
    public function render(string $html, array $attrs): string
    {
        $attributes = '';

        foreach ($this->htmlAttributes($attrs) as $name => $value) {
            if (is_null($value) || $value === false) {
                continue;
            }

            $attributes .= ' ' . $name . '="' . e((string) $value) . '"';
        }

        return "<{$this->tag}{$attributes}>{$html}</{$this->tag}>";
    }

    /** @return array<string, mixed> */
    public function toEditor(): array
    {
        $attributes = [];

        foreach ($this->attributes() as $name => $attribute) {
            $attributes[$name] = $attribute->toEditor($name);
        }

        return [
            'name' => $this->name(),
            'title' => $this->title(),
            'attributes' => (object) $attributes,
        ];
    }
}
