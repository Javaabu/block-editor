<?php

namespace Javaabu\BlockEditor\Blocks;

use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

class CodeBlock extends Block
{
    protected string $name = 'codeBlock';

    protected string $content = 'text*';

    protected ?array $marks = [];

    protected string $icon = 'code';

    protected array $keywords = ['code', 'snippet', 'pre'];

    public function attributes(): array
    {
        return [
            'language' => Attribute::string()->max(32)->rules(['regex:/^[A-Za-z0-9_+#.\-]*$/']),
        ];
    }

    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        $language = $node->attr('language');

        if (is_string($language) && preg_match('/^[A-Za-z0-9_+#.\-]{1,32}$/', $language) === 1) {
            return $node;
        }

        return $node->withAttrs([...$node->attrs, 'language' => null]);
    }

    public function isEmpty(Node $node): bool
    {
        return trim($node->textContent()) === '';
    }
}
