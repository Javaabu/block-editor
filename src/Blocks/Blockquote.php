<?php

namespace Javaabu\BlockEditor\Blocks;

class Blockquote extends Block
{
    protected string $name = 'blockquote';

    protected string $content = 'block+';

    protected string $icon = 'quote';

    protected array $keywords = ['quote', 'citation'];

    public function attributes(): array
    {
        return ['dir' => static::direction()];
    }
}
