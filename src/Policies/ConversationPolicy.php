<?php

namespace Fuyad\Chat\Policies;

use Fuyad\Chat\Models\Conversation;
use Illuminate\Foundation\Auth\User;

class ConversationPolicy
{
    /**
     * Determine if user can view a conversation.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->isMember($user->id);
    }

    /**
     * Determine if user can update a conversation.
     */
    public function update(User $user, Conversation $conversation): bool
    {
        // Only admin or creator can update
        return $conversation->members()
            ->where('user_id', $user->id)
            ->where('is_admin', true)
            ->exists() || $conversation->created_by === $user->id;
    }

    /**
     * Determine if user can delete a conversation.
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        // Creator can always delete
        return $conversation->created_by === $user->id;
    }

    /**
     * Determine if user can add members.
     */
    public function addMember(User $user, Conversation $conversation): bool
    {
        return $this->update($user, $conversation);
    }

    /**
     * Determine if user can remove members.
     */
    public function removeMember(User $user, Conversation $conversation): bool
    {
        return $this->update($user, $conversation);
    }
}
