<?php

namespace Fuyad\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'reply_to_id',
        'body',
        'edited_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the conversation this message belongs to.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the message this message is replying to.
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    /**
     * Get the user who sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('chat.user_model', 'App\\Models\\User'));
    }

    /**
     * Get the attachments for this message.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Get the reactions on this message.
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * Get the read receipts for this message.
     */
    public function readReceipts(): HasMany
    {
        return $this->hasMany(ReadReceipt::class);
    }

    /**
     * Check if message is edited.
     */
    public function isEdited(): bool
    {
        return !is_null($this->edited_at);
    }

    /**
     * Check if message is read by a user.
     */
    public function isReadBy($userId): bool
    {
        return $this->readReceipts()
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get reaction count by emoji.
     */
    public function getReactionCount($emoji): int
    {
        return $this->reactions()
            ->where('reaction', $emoji)
            ->distinct('user_id')
            ->count();
    }
}
