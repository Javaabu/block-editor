<?php

namespace Javaabu\BlockEditor\Validation;

/**
 * One problem in block content, at a path in the JSON (`content.2.attrs.url`).
 */
final class ContentError
{
    public function __construct(
        public readonly string $path,
        public readonly string $message,
        public readonly ?int $position = null,
        public readonly ?string $block = null,
    ) {}

    /**
     * The message with the block it's about: "Block 3 (Button): The URL is required."
     */
    public function summary(): string
    {
        if (is_null($this->position)) {
            return $this->message;
        }

        return __('block-editor::strings.validation.summary', [
            'position' => $this->position,
            'block' => $this->block ?? __('block-editor::strings.validation.block'),
            'message' => $this->message,
        ]);
    }
}
