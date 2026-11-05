<?php

namespace Javaabu\BlockEditor\Blocks;

class Table extends Block
{
    protected string $name = 'table';

    protected string $content = 'tableRow+';

    protected string $icon = 'table';

    protected array $keywords = ['grid', 'rows', 'columns', 'spreadsheet'];

    public function attributes(): array
    {
        return ['dir' => static::direction()];
    }
}
