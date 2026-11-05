---
title: Storing content
sidebar_position: 1
---

Content is [TipTap/ProseMirror JSON](../advanced-usage/json-format.md): a `doc` node whose `content` is the list of blocks. Store it in a `json` (or `text`) column:

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->json('body')->nullable();
    $table->timestamps();
});
```

# The cast

```php
use Javaabu\BlockEditor\Casts\AsBlockDocument;

class Post extends Model
{
    protected function casts(): array
    {
        return [
            'body' => AsBlockDocument::class,
            'summary' => AsBlockDocument::class . ':minimal',   // sanitized for the "minimal" profile
        ];
    }
}
```

`Document::class` works as a cast too (`Document::class . ':minimal'`).

- **Setting** accepts a `Document`, an array, a JSON string (what the editor posts) or `null`. The value is [sanitized](../advanced-usage/sanitizing.md) for the cast's profile before it's stored, unless `block-editor.sanitize.on_save` is `false`.
- **Getting** returns a `Javaabu\BlockEditor\Document`. A `null` column reads as an empty document, so `$post->body->isEmpty()` always works.
- **Serializing** (`toArray()`, JSON responses, Inertia props) gives the JSON array, ready for `<BlockContent>` and the React editor.

```php
$post->update(['body' => $request->input('body')]);   // the JSON string from the form
```

# Documents

```php
use Javaabu\BlockEditor\Document;

$document = Document::make($json);       // Document, Node, array, JSON string or null
$document = Document::empty();

$document->blocks();                     // array of Node: the top-level blocks
$document->isEmpty();                    // no blocks, or only empty paragraphs
$document->isNotEmpty();
$document->render();                     // HtmlString, sanitized (default profile)
$document->render('minimal');
$document->toHtml();                     // string; also what {{ $document }} prints
$document->toText();                     // plain text, a blank line between blocks
$document->excerpt(160);                 // the start of the text, on a word boundary
$document->sanitize('minimal');          // a sanitized copy
$document->toArray();                    // ['type' => 'doc', 'content' => [...]]
$document->toJson();
```

`Node` is the value object for one node: `$node->type`, `$node->attrs`, `$node->content` (child nodes), `$node->marks`, `$node->text`, `$node->attr('level')`, `$node->textContent()` and `$node->walk(fn (Node $node, array $path) => …)`.

The `BlockEditor` facade has the same operations for any value:

```php
use Javaabu\BlockEditor\Facades\BlockEditor;

BlockEditor::render($post->body, 'default');    // HTML string
BlockEditor::sanitize($request->input('body')); // Document
```

# Search and excerpts

`toText()` gives the text of every block, including table cells, columns, captions and button labels, which suits a search index:

```php
public function toSearchableArray(): array
{
    return ['title' => $this->title, 'body' => $this->body->toText()];
}
```
