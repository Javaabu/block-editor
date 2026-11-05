<div class="block-button" data-align="{{ $attrs['align'] ?? 'start' }}">
    <a{!! $renderer->attributes([
        'href' => $attrs['url'],
        'class' => 'block-button__link',
        'data-variant' => $attrs['variant'] ?? 'primary',
        'target' => ($attrs['newTab'] ?? false) ? '_blank' : null,
        'rel' => ($attrs['newTab'] ?? false) ? 'noopener noreferrer' : null,
        'dir' => 'auto',
    ]) !!}>{{ $attrs['text'] }}</a>
</div>
