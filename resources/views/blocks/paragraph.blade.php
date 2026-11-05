<p{!! $renderer->attributes(['dir' => $attrs['dir'] ?? 'auto', 'style' => ($attrs['textAlign'] ?? null) ? "text-align: {$attrs['textAlign']}" : null]) !!}>{{ $content }}</p>
