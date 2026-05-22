<?php

namespace Fuyad\Chat\Services;

use Fuyad\Chat\Models\UserBlock;

class BlockService
{
    /**
     * Block a user.
     */
    public function block(int $blockerId, int $blockedUserId): UserBlock
    {
        return UserBlock::firstOrCreate(
            [
                'blocker_id' => $blockerId,
                'blocked_user_id' => $blockedUserId,
            ]
        );
    }

    /**
     * Unblock a user.
     */
    public function unblock(int $blockerId, int $blockedUserId): bool
    {
        return UserBlock::where('blocker_id', $blockerId)
            ->where('blocked_user_id', $blockedUserId)
            ->delete() > 0;
    }

    /**
     * Check if a user is blocked.
     */
    public function isBlocked(int $blockerId, int $blockedUserId): bool
    {
        return UserBlock::where('blocker_id', $blockerId)
            ->where('blocked_user_id', $blockedUserId)
            ->exists();
    }

    /**
     * Get blocked users for a user.
     */
    public function getBlockedUsers(int $userId, int $page = 1, int $perPage = 50)
    {
        return UserBlock::where('blocker_id', $userId)
            ->with('blockedUser')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Check if user is blocked by another user.
     */
    public function isBlockedBy(int $userId, int $blockerId): bool
    {
        return UserBlock::where('blocker_id', $blockerId)
            ->where('blocked_user_id', $userId)
            ->exists();
    }
}
