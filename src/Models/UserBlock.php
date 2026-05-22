<?php

namespace Fuyad\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBlock extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'blocker_id',
        'blocked_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the user who blocked.
     */
    public function blocker(): BelongsTo
    {
        return $this->belongsTo(config('chat.user_model', 'App\\Models\\User'), 'blocker_id');
    }

    /**
     * Get the user who was blocked.
     */
    public function blockedUser(): BelongsTo
    {
        return $this->belongsTo(config('chat.user_model', 'App\\Models\\User'), 'blocked_user_id');
    }
}
