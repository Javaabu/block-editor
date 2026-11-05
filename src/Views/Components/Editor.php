<?php

namespace Javaabu\BlockEditor\Views\Components;

use Illuminate\Support\Str;
use Illuminate\Support\ViewErrorBag;
use Javaabu\BlockEditor\Assets\Assets;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Document;
use Javaabu\Forms\Views\Components\Input;

/**
 * The block editor as a javaabu/forms field, with model binding, old input,
 * label, help and errors: `<x-block-editor::editor name="body" :model="$post" />`.
 * It posts the content as JSON in a hidden input.
 */
class Editor extends Input
{
    public function __construct(
        string $name,
        string $label = '',
        $model = null,
        $default = null,
        $value = null,
        bool $showErrors = true,
        bool $showLabel = true,
        bool $required = false,
        bool $inline = false,
        public ?string $profile = null,
        public bool $readonly = false,
        public bool $thaanaKeyboard = true,
        public bool $toolbar = true,
        string $inlineLabelClass = '',
        string $inlineInputClass = '',
        string $framework = '',
    ) {
        parent::__construct(
            $name,
            label: $label,
            type: 'block-editor',
            model: $model,
            default: $default,
            showErrors: $showErrors,
            showLabel: $showLabel,
            required: $required,
            inline: $inline,
            inlineLabelClass: $inlineLabelClass,
            inlineInputClass: $inlineInputClass,
            framework: $framework,
        );

        if (! is_null($value)) {
            $this->value = $value;
        }
    }

    public function getView(): string
    {
        return 'block-editor::components.editor';
    }

    /**
     * The content as JSON for the hidden input. Old input (a JSON string) is kept
     * as it was posted, so nothing the user typed is lost to validation.
     */
    public function json(): string
    {
        return Document::make($this->value)->toJson();
    }

    /** @return array<string, mixed> */
    public function config(): array
    {
        $config = app(BlockEditorManager::class)->editorConfig($this->profile);

        if (! $this->thaanaKeyboard) {
            $config['thaana'] = ['enabled' => false];
        }

        if ($this->thaana) {
            $config['thaana'] = [...(array) $config['thaana'], 'default_on' => true];
        }

        return $config;
    }

    /**
     * The field name in dot notation, as the error keys start with it.
     */
    public function dotName(): string
    {
        return static::convertBracketsToDots(Str::before($this->name, '[]'));
    }

    /**
     * Errors on blocks (`body.content.2.attrs.url`), for the editor to show on them.
     *
     * @return array<string, array<int, string>>
     */
    public function blockErrors(): array
    {
        if (! $this->showErrors) {
            return [];
        }

        $errors = session('errors');

        if (! $errors instanceof ViewErrorBag) {
            return [];
        }

        $prefix = "{$this->dotName()}.";

        return array_filter($errors->getBag('default')->toArray(), fn ($key) => str_starts_with($key, $prefix), ARRAY_FILTER_USE_KEY);
    }

    /** @return array<int, string> */
    public function requiredAssets(): array
    {
        if (! config('block-editor.assets', true)) {
            return [];
        }

        return [
            Assets::STYLES,
            Assets::EDITOR,
            ...app(BlockEditorManager::class)->scripts($this->profile),
        ];
    }
}
