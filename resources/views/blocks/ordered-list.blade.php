<ol{!! $renderer->attributes([
    'start' => ($attrs['start'] ?? 1) != 1 ? $attrs['start'] : null,
    'type' => $attrs['type'] ?? null,
    'dir' => \Javaabu\BlockEditor\Rendering\Direction::of($node),
]) !!}>{{ $content }}</ol>
