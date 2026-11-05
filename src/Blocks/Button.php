<?php

namespace Javaabu\BlockEditor\Blocks;

class Button extends Block
{
    public const array VARIANTS = ['primary', 'secondary', 'outline'];

    protected string $name = 'button';

    protected string $category = 'advanced';

    protected string $icon = 'mouse-pointer-click';

    protected array $keywords = ['link', 'call to action', 'cta'];

    public function attributes(): array
    {
        return [
            'text' => Attribute::string()->required()->max(100)->thaana(),
            'url' => Attribute::url()->required(),
            'variant' => Attribute::enum(static::VARIANTS)->default('primary')->required(),
            'newTab' => Attribute::boolean(),
            'align' => Attribute::enum(['start', 'center', 'end'])->default('start')->required(),
        ];
    }
}
