<?php

namespace Javaabu\BlockEditor\Blocks;

class TableRow extends Block
{
    protected string $name = 'tableRow';

    protected string $group = '';

    protected string $content = '(tableCell | tableHeader)*';

    protected bool $insertable = false;
}
