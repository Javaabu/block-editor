<?php

namespace Javaabu\BlockEditor\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes;
use Illuminate\Database\Eloquent\Model;
use Javaabu\BlockEditor\Document;

/**
 * Casts a JSON column to a Document. Values are sanitized for the profile when
 * they're set (config `block-editor.sanitize.on_save`); a null column reads as an
 * empty document. Serializes to the JSON array (for Inertia props and APIs).
 *
 * `'body' => AsBlockDocument::class` or `AsBlockDocument::class . ':comment'`
 * (or `Document::class`, `Document::class . ':comment'`).
 *
 * @implements CastsAttributes<Document, mixed>
 */
class AsBlockDocument implements CastsAttributes, SerializesCastableAttributes
{
    public function __construct(protected ?string $profile = null) {}

    public function get(Model $model, string $key, mixed $value, array $attributes): Document
    {
        return Document::make($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if (is_null($value)) {
            return null;
        }

        $document = Document::make($value);

        if (config('block-editor.sanitize.on_save', true)) {
            $document = $document->sanitize($this->profile);
        }

        return $document->toJson();
    }

    /** @return array<string, mixed> */
    public function serialize(Model $model, string $key, mixed $value, array $attributes): array
    {
        return Document::make($value)->toArray();
    }
}
