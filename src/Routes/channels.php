<?php

use Fuyad\Chat\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Chat Package Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the broadcast channels that your
| chat package supports. The given channel authorization callbacks
| are used to check if an authenticated user can listen to the channel.
|
*/

// Authorize conversation channels — only members can listen
Broadcast::channel('conversation.{conversationId}', function ($user, int $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    return $conversation->isMember($user->id);
});

// Authorize presence channel — any authenticated user can listen
Broadcast::channel('chat.presence', function ($user) {
    return (bool) $user->id;
});
