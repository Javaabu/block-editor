<?php

namespace Javaabu\BlockEditor\Blocks;

class ListItem extends Block
{
    protected string $name = 'listItem';

    protected string $group = '';

    protected string $content = 'paragraph block*';

    protected bool $insertable = false;
}
