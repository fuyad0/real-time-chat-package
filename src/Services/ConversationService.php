<?php

namespace Fuyad\Chat\Services;

use Fuyad\Chat\Models\Conversation;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    /**
     * Create a new conversation.
     */
    public function create(string $type, int $createdBy, array $memberIds, ?string $name = null, ?string $avatar = null): Conversation
    {
        return DB::transaction(function () use ($type, $createdBy, $memberIds, $name, $avatar) {
            $conversation = Conversation::create([
                'type' => $type,
                'name' => $name,
                'avatar_path' => $avatar,
                'created_by' => $createdBy,
            ]);

            // Add creator as member
            $memberIds = array_unique(array_merge($memberIds, [$createdBy]));

            // Attach members
            $members = collect($memberIds)->mapWithKeys(function ($userId) use ($createdBy) {
                return [$userId => [
                    'joined_at' => now(),
                    'is_admin' => ($userId === $createdBy) // Creator is admin
                ]];
            })->toArray();

            $conversation->members()->attach($members);

            return $conversation;
        });
    }

    /**
     * Update a conversation.
     */
    public function update(Conversation $conversation, array $data): Conversation
    {
        $conversation->update($data);
        return $conversation;
    }

    /**
     * Get all conversations for a user.
     */
    public function getForUser(int $userId, int $page = 1, int $perPage = 50)
    {
        return Conversation::whereHas('members', function ($query) use ($userId) {
            $query->where('user_id', $userId)->whereNull('left_at');
        })
            ->with(['members', 'lastMessage'])
            ->withCount([
                'messages' => function ($query) use ($userId) {
                    $query->whereDoesntHave('readReceipts', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })->where('user_id', '!=', $userId);
                }
            ])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Add a member to a conversation.
     */
    public function addMember(Conversation $conversation, array $userIds, bool $isAdmin = false): void
    {
        $members = [];

        foreach ($userIds as $userId) {
            $members[$userId] = [
                'joined_at' => now(),
                'is_admin' => $isAdmin,
            ];
        }

        $conversation->members()->syncWithoutDetaching($members);
    }

    /**
     * Remove a member from a conversation.
     */
    public function removeMember(Conversation $conversation, int $userId): bool
    {
        return $conversation->members()
            ->where('user_id', $userId)
            ->update(['left_at' => now()]) > 0;
    }

    /**
     * Check if user is member of conversation.
     */
    public function isMember(Conversation $conversation, int $userId): bool
    {
        return $conversation->isMember($userId);
    }

    /**
     * Search conversations for a user.
     */
    public function search(int $userId, string $query, int $page = 1, int $perPage = 50)
    {
        return Conversation::whereHas('members', function ($q) use ($userId) {
            $q->where('user_id', $userId)->whereNull('left_at');
        })
            ->where(function ($q) use ($query) {
                // Search by conversation name
                $q->where('name', 'like', '%' . $query . '%');

                // Or search by message content in conversations
                $q->orWhereHas('messages', function ($msg) use ($query) {
                    $msg->where('body', 'like', '%' . $query . '%');
                });
            })
            ->with(['members'])
            ->distinct()
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Get or create a direct conversation.
     */
    public function getOrCreateDirect(int $userId1, int $userId2): Conversation
    {
        // Try to find existing direct conversation
        $conversation = Conversation::where('type', 'direct')
            ->whereHas('members', function ($query) use ($userId1) {
                $query->where('user_id', $userId1);
            })
            ->whereHas('members', function ($query) use ($userId2) {
                $query->where('user_id', $userId2);
            })
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Create new direct conversation
        return $this->create('direct', $userId1, [$userId2]);
    }
}
