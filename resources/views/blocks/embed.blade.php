@php($url = $block->embedUrl($attrs['src'] ?? null))
@php($title = ($attrs['title'] ?? null) ?: __('block-editor::strings.embedded_content'))
@if($url)
    <figure class="block-embed">
        <iframe{!! $renderer->attributes([
            'src' => $url,
            'title' => $title,
            'loading' => 'lazy',
            'allow' => 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            'allowfullscreen' => true,
            'referrerpolicy' => 'strict-origin-when-cross-origin',
        ]) !!}></iframe>
    </figure>
@else
    <p class="block-embed" dir="auto"><a href="{{ $attrs['src'] }}" rel="noopener noreferrer nofollow">{{ ($attrs['title'] ?? null) ?: $attrs['src'] }}</a></p>
@endif
