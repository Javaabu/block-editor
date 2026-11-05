<x-forms::form-group :class="$groupClass()" :inline-input-class="$inlineInputClass" :inline-label-class="$inlineLabelClass" :wrap="$showLabel" :label="$label ?: $label()" :name="$id()" :framework="$framework" :inline="$inline" :required="$required">
    <div
        {!! $attributes->merge(['class' => 'block-editor-field']) !!}
        data-block-editor
        data-slot="block-editor"
        data-config="{{ json_encode($config(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) }}"
        data-input-id="{{ $id() }}"
        data-label="{{ $label ?: $label() }}"
        data-error-prefix="{{ $dotName() }}"
        data-errors="{{ json_encode((object) $blockErrors(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) }}"
        @if($toolbar === false) data-toolbar="false" @endif
        @if($hasErrorAndShow($name)) data-invalid @endif
        @if($required) data-required @endif
        @if($readonly) data-readonly @endif
        @if(! empty($help)) data-describedby="{{ $id() }}-help" @endif
    >
        <input type="hidden" name="{{ $name }}" value="{{ $json() }}" data-block-editor-input>
    </div>

    @if(! empty($help))
        <x-forms::input-help :framework="$framework" id="{{ $id() }}-help">
            {!! $help !!}
        </x-forms::input-help>
    @endif

    @if($hasErrorAndShow($name))
        <x-forms::errors :framework="$framework" :name="$name" />
    @endif
</x-forms::form-group>
