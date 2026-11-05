<figure class="block-image">
    <img{!! $renderer->attributes([
        'src' => $attrs['src'],
        'alt' => $attrs['alt'] ?? '',
        'title' => $attrs['title'] ?? null,
        'loading' => 'lazy',
        'decoding' => 'async',
    ]) !!}>
    @if($attrs['caption'] ?? null)
        <figcaption dir="auto">{{ $attrs['caption'] }}</figcaption>
    @endif
</figure>
