<?php

namespace Fuyad\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'type',
        'name',
        'avatar_path',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created the conversation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(config('chat.user_model', 'App\\Models\\User'), 'created_by');
    }

    /**
     * Get the members of the conversation.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            config('chat.user_model', 'App\\Models\\User'),
            'conversation_members',
            'conversation_id',
            'user_id'
        )->withPivot('joined_at', 'left_at', 'is_admin', 'muted_at', 'blocked_at')
            ->withTimestamps();
    }

    /**
     * Get the messages in the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Check if user is a member of this conversation.
     */
    public function isMember($userId): bool
    {
        return $this->members()
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();
    }

    /**
     * Get the last message (as a proper relationship for eager loading).
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get unread messages count for user.
     */
    public function unreadCount($userId): int
    {
        return $this->messages()
            ->whereDoesntHave('readReceipts', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->where('user_id', '!=', $userId)
            ->count();
    }
}
