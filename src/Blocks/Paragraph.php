<?php

namespace Javaabu\BlockEditor\Blocks;

class Paragraph extends Block
{
    protected string $name = 'paragraph';

    protected string $content = 'inline*';

    protected string $icon = 'pilcrow';

    protected array $keywords = ['text', 'p'];

    public function attributes(): array
    {
        return [
            'textAlign' => static::alignment(),
            'dir' => static::direction(),
        ];
    }
}
