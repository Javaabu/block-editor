<?php

namespace Javaabu\BlockEditor\Blocks;

use Closure;
use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;
use Javaabu\BlockEditor\Support\Url;

class Image extends Block
{
    protected string $name = 'image';

    protected string $category = 'media';

    protected string $icon = 'image';

    protected array $keywords = ['photo', 'picture', 'img', 'figure'];

    public function attributes(): array
    {
        return [
            'src' => Attribute::url()->required()->rules([$this->imageUrlRule()]),
            'alt' => Attribute::string()->max(255)->thaana(),
            'title' => Attribute::string()->max(255)->hidden(),
            'caption' => Attribute::string()->max(500)->thaana(),
        ];
    }

    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        return Url::isSafeImage($node->attr('src'))
            ? $node
            : null;
    }

    protected function imageUrlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! is_string($value) || Url::isSafeImage($value)) {
                return;
            }

            $fail(__('block-editor::strings.validation.url'));
        };
    }
}
