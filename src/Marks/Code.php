<?php

namespace Javaabu\BlockEditor\Marks;

/**
 * Inline code. Always left to right, also inside Dhivehi text.
 */
class Code extends Mark
{
    protected string $name = 'code';

    protected string $tag = 'code';

    public function htmlAttributes(array $attrs): array
    {
        return ['dir' => 'ltr'];
    }
}
