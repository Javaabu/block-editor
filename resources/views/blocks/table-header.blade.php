<th{!! $renderer->attributes([
    'colspan' => ($attrs['colspan'] ?? 1) > 1 ? $attrs['colspan'] : null,
    'rowspan' => ($attrs['rowspan'] ?? 1) > 1 ? $attrs['rowspan'] : null,
    'dir' => $attrs['dir'] ?? 'auto',
]) !!}>{{ $content }}</th>
