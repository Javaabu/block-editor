@php($dir = \Javaabu\BlockEditor\Rendering\Direction::of($node))
<div class="block-table" dir="{{ $dir }}">
    <table dir="{{ $dir }}"><tbody>{{ $content }}</tbody></table>
</div>
