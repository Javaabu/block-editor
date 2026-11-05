<?php

namespace Javaabu\BlockEditor\Tests\Fixtures\Blocks;

use Javaabu\BlockEditor\Blocks\Attribute;
use Javaabu\BlockEditor\Blocks\Block;

class Alert extends Block
{
    protected string $name = 'alert';

    protected string $content = 'inline*';

    protected ?array $marks = ['bold'];

    protected ?string $view = 'fixtures::alert';

    protected ?string $script = 'acme::alert-block';

    protected string $icon = 'bell';

    protected array $keywords = ['notice'];

    public function title(): string
    {
        return 'Alert';
    }

    public function attributes(): array
    {
        return [
            'tone' => Attribute::enum(['calm', 'loud'])->default('calm')->required(),
            'link' => Attribute::url(),
        ];
    }

    public function rules(): array
    {
        return ['link' => ['required_if:tone,loud']];
    }
}
