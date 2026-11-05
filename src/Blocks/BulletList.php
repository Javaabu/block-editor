<?php

namespace Javaabu\BlockEditor\Blocks;

class BulletList extends Block
{
    protected string $name = 'bulletList';

    protected string $content = 'listItem+';

    protected string $icon = 'list';

    protected array $keywords = ['bullet', 'list', 'ul', 'unordered'];

    public function attributes(): array
    {
        return ['dir' => static::direction()];
    }
}
