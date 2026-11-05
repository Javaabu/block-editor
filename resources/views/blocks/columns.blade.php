<div{!! $renderer->attributes([
    'class' => 'block-columns',
    'data-stack' => $attrs['stackAt'] ?? 'md',
    'data-gap' => $attrs['gap'] ?? 'md',
    'data-align' => $attrs['verticalAlign'] ?? 'stretch',
    'style' => '--block-columns: ' . $block->template($node),
]) !!}>{{ $content }}</div>
