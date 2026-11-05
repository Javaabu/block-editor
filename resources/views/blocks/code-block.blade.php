<pre class="block-code" dir="ltr"><code{!! $renderer->attributes(['class' => ($attrs['language'] ?? null) ? "language-{$attrs['language']}" : null]) !!}>{{ $node->textContent() }}</code></pre>
