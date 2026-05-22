<?php

namespace Fuyad\Chat\Policies;

use Fuyad\Chat\Models\Message;
use Illuminate\Foundation\Auth\User;

class MessagePolicy
{
    /**
     * Determine if user can view a message.
     */
    public function view(User $user, Message $message): bool
    {
        // User can view if they're a member of the conversation
        return $message->conversation->isMember($user->id);
    }

    /**
     * Determine if user can edit a message.
     */
    public function update(User $user, Message $message): bool
    {
        // Only the sender can edit
        return $message->user_id === $user->id;
    }

    /**
     * Determine if user can delete a message.
     */
    public function delete(User $user, Message $message): bool
    {
        // Only the sender can delete
        return $message->user_id === $user->id;
    }

    /**
     * Determine if user can add reactions.
     */
    public function react(User $user, Message $message): bool
    {
        return $this->view($user, $message);
    }

    /**
     * Determine if user can mark as read.
     */
    public function markAsRead(User $user, Message $message): bool
    {
        return $this->view($user, $message);
    }
}
