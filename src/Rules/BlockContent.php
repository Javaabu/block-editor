<?php

namespace Javaabu\BlockEditor\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\BlockEditor\Document;
use Javaabu\BlockEditor\Validation\ContentValidator;

/**
 * Validates block editor content (JSON string, array or Document) for a profile.
 *
 * The first problem is reported on the field ("Block 3 (Button): The URL field is
 * required."); every problem is also reported on its JSON path
 * (`body.content.2.attrs.url`), so the editor can point at the block.
 */
class BlockContent implements ValidationRule
{
    protected bool $is_required = false;

    protected ?int $max_blocks = null;

    public function __construct(protected ?string $profile = null) {}

    public static function make(?string $profile = null): static
    {
        return new static($profile);
    }

    /**
     * Fail when the content is empty (no blocks, or only empty paragraphs). Use it
     * with Laravel's `required` rule, which passes for an empty document's JSON.
     */
    public function required(bool $condition = true): static
    {
        $this->is_required = $condition;

        return $this;
    }

    public function maxBlocks(?int $max): static
    {
        $this->max_blocks = $max;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $data = match (true) {
            $value instanceof Document => $value->toArray(),
            is_string($value) => json_decode($value, true),
            default => $value,
        };

        if (! is_array($data) || ($data['type'] ?? null) !== 'doc') {
            $fail(__('block-editor::strings.validation.invalid'));

            return;
        }

        $document = Document::make($data);

        if ($this->is_required && $document->isEmpty()) {
            $fail(__('validation.required'));

            return;
        }

        if ($this->max_blocks && count($document->blocks()) > $this->max_blocks) {
            $fail(__('block-editor::strings.validation.max_blocks', ['max' => $this->max_blocks]));

            return;
        }

        $profile = app(BlockEditorManager::class)->resolveProfile($this->profile);
        $errors = app(ContentValidator::class)->validate($document->root(), $profile);

        if ($errors === []) {
            return;
        }

        $fail($errors[0]->summary());

        foreach ($errors as $error) {
            $fail("{$attribute}.{$error->path}", $error->message);
        }
    }
}
