<?php

namespace Javaabu\BlockEditor\Blocks;

class Callout extends Block
{
    public const array VARIANTS = ['info', 'success', 'warning', 'error'];

    protected string $name = 'callout';

    protected string $content = 'inline*';

    protected string $icon = 'info';

    protected array $keywords = ['note', 'notice', 'alert', 'warning', 'tip'];

    public function attributes(): array
    {
        return [
            'variant' => Attribute::enum(static::VARIANTS)->default('info')->required(),
            'dir' => static::direction(),
        ];
    }
}
