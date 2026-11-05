<?php

namespace Javaabu\BlockEditor\Blocks;

use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

class TableCell extends Block
{
    protected string $name = 'tableCell';

    protected string $group = '';

    protected string $content = 'block+';

    protected bool $insertable = false;

    public function attributes(): array
    {
        return [
            'colspan' => Attribute::integer()->default(1)->min(1)->max(100)->hidden(),
            'rowspan' => Attribute::integer()->default(1)->min(1)->max(100)->hidden(),
            'colwidth' => Attribute::json(),
            'dir' => static::direction(),
        ];
    }

    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        $widths = $node->attr('colwidth');

        $widths = is_array($widths) && array_is_list($widths)
            ? array_map(fn ($width) => is_numeric($width) ? max(0, (int) $width) : 0, $widths)
            : null;

        return $node->withAttrs([
            ...$node->attrs,
            'colspan' => max(1, (int) $node->attr('colspan', 1)),
            'rowspan' => max(1, (int) $node->attr('rowspan', 1)),
            'colwidth' => $widths,
        ]);
    }
}
