@php($html = $html())
@if($html !== '')
    <div {{ $attributes->merge(['class' => 'block-content']) }}>{!! $html !!}</div>
@else
    {{ $slot }}
@endif
