@php($level = min(6, max(1, (int) ($attrs['level'] ?? 2))))
<h{{ $level }}{!! $renderer->attributes(['dir' => $attrs['dir'] ?? 'auto', 'style' => ($attrs['textAlign'] ?? null) ? "text-align: {$attrs['textAlign']}" : null]) !!}>{{ $content }}</h{{ $level }}>
