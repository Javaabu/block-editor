<?php

namespace Javaabu\BlockEditor\Blocks;

class OrderedList extends Block
{
    protected string $name = 'orderedList';

    protected string $content = 'listItem+';

    protected string $icon = 'list-ordered';

    protected array $keywords = ['numbered', 'ordered', 'list', 'ol'];

    public function attributes(): array
    {
        return [
            'start' => Attribute::integer()->default(1)->min(0),
            'type' => Attribute::enum(['1', 'a', 'A', 'i', 'I'])->hidden(),
            'dir' => static::direction(),
        ];
    }
}
