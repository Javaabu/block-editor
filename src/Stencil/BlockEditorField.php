<?php

namespace Javaabu\BlockEditor\Stencil;

use Closure;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Document;
use Javaabu\BlockEditor\Rules\BlockContent;
use Javaabu\Stencil\Fields\Field;

/**
 * The block editor as a javaabu/stencil field:
 * `BlockEditorField::make('body')->profile('minimal')->required()`.
 *
 * Blade renders `<x-block-editor::editor>`; React renders the `block-editor` type,
 * registered with `StencilProvider components={{ "block-editor": StencilBlockEditor }}`.
 */
class BlockEditorField extends Field
{
    protected string $type = 'block-editor';

    protected ?string $view = 'block-editor::stencil.block-editor';

    protected string|Closure|null $profile = null;

    protected bool|Closure $has_toolbar = true;

    protected int|Closure|null $max_blocks = null;

    public function profile(string|Closure|null $profile): static
    {
        $this->profile = $profile;

        return $this;
    }

    public function toolbar(bool|Closure $condition = true): static
    {
        $this->has_toolbar = $condition;

        return $this;
    }

    public function maxBlocks(int|Closure|null $max): static
    {
        $this->max_blocks = $max;

        return $this;
    }

    public function getProfile(): ?string
    {
        return $this->evaluate($this->profile);
    }

    protected function getTypeRules(): array
    {
        return [
            BlockContent::make($this->getProfile())
                ->required($this->isRequired())
                ->maxBlocks($this->evaluate($this->max_blocks)),
        ];
    }

    protected function getFieldProps(): array
    {
        return [
            'profile' => $this->getProfile(),
            'toolbar' => (bool) $this->evaluate($this->has_toolbar),
            'config' => app(BlockEditorManager::class)->editorConfig($this->getProfile()),
        ];
    }

    /**
     * Content from the record (a Document) or old input (a JSON string), as JSON arrays.
     */
    public function normalizeState(mixed $state): mixed
    {
        if (is_null($state) || $state === '') {
            return null;
        }

        return Document::make($state)->toArray();
    }

    protected function castDehydratedState(mixed $state): mixed
    {
        if (is_null($state) || $state === '') {
            return null;
        }

        return Document::make($state)->toArray();
    }
}
