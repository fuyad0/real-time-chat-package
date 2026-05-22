<?php

namespace Fuyad\Chat\Services;

class PresenceService
{
    /**
     * Set user online.
     */
    public function setOnline(int $userId): void
    {
        cache()->put('user_online_' . $userId, true, now()->addHours(24));
    }

    /**
     * Set user offline.
     */
    public function setOffline(int $userId): void
    {
        cache()->forget('user_online_' . $userId);
    }

    /**
     * Check if user is online.
     */
    public function isOnline(int $userId): bool
    {
        return cache()->has('user_online_' . $userId);
    }

    /**
     * Get online users in a conversation.
     */
    public function getOnlineInConversation($conversation, ?int $exceptUserId = null)
    {
        $members = $conversation->members;

        return $members->filter(function ($member) use ($exceptUserId) {
            if ($exceptUserId && $member->id === $exceptUserId) {
                return false;
            }
            return $this->isOnline($member->id);
        });
    }
}
