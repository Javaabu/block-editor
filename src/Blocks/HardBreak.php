<?php

namespace Javaabu\BlockEditor\Blocks;

use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Rendering\Renderer;

class HardBreak extends Block
{
    protected string $name = 'hardBreak';

    protected string $group = 'inline';

    protected bool $insertable = false;

    public function isEmpty(Node $node): bool
    {
        return true;
    }

    public function render(Node $node, Renderer $renderer): string
    {
        return '<br>';
    }
}
