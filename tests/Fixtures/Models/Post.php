<?php

namespace Javaabu\BlockEditor\Tests\Fixtures\Models;

use Illuminate\Database\Eloquent\Model;
use Javaabu\BlockEditor\Casts\AsBlockDocument;
use Javaabu\BlockEditor\Document;

class Post extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'body' => AsBlockDocument::class,
            'summary' => Document::class . ':minimal',
        ];
    }
}
