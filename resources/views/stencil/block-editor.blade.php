{{-- The stencil block-editor field: $node->name is the input name, $node->props its props. --}}
<x-block-editor::editor
    :name="$node->name"
    :label="$node->prop('label', '')"
    :value="$stencil->value($node)"
    :required="(bool) $node->prop('required')"
    :inline="(bool) $node->prop('inline')"
    :show-label="$node->prop('showLabel', true)"
    :readonly="(bool) $node->prop('disabled')"
    :toolbar="(bool) $node->prop('toolbar', true)"
    :profile="$node->prop('profile')"
>
    @if($node->prop('help'))
        <x-slot:help>{{ $node->prop('help') }}</x-slot:help>
    @endif
</x-block-editor::editor>
