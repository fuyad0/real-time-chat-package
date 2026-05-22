<?php

namespace Fuyad\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'message_id',
        'user_id',
        'reaction',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the message this reaction is on.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the user who added the reaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('chat.user_model', 'App\\Models\\User'));
    }
}
