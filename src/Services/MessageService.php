<?php

namespace Fuyad\Chat\Services;

use Fuyad\Chat\Models\Conversation;
use Fuyad\Chat\Models\Message;
use Fuyad\Chat\Models\MessageReaction;
use Fuyad\Chat\Models\ReadReceipt;
use Illuminate\Support\Facades\DB;

class MessageService
{
    /**
     * Send a message with optional attachments.
     */
    public function send(int $conversationId, int $userId, string $body, array $attachments = [], ?int $replyToId = null): Message
    {
        return DB::transaction(function () use ($conversationId, $userId, $body, $attachments, $replyToId) {
            $message = Message::create([
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'body' => $body,
                'reply_to_id' => $replyToId,
            ]);

            // Store attachments if provided
            if (!empty($attachments)) {
                $this->storeAttachments($message, $attachments);
            }

            // Touch conversation to update the updated_at timestamp for ordering
            Conversation::where('id', $conversationId)->update(['updated_at' => now()]);

            return $message;
        });
    }


    public function sendToUser(
        int $authUserId,
        int $targetUserId,
        string $body,
        array $attachments = [],
        ?int $replyToId = null
    ): Message {
        return DB::transaction(function () use (
            $authUserId,
            $targetUserId,
            $body,
            $attachments,
            $replyToId
        ) {
            // Find existing private conversation
            $conversation = Conversation::where('type', 'direct')
                ->whereHas('members', function ($q) use ($authUserId) {
                    $q->where('user_id', $authUserId);
                })
                ->whereHas('members', function ($q) use ($targetUserId) {
                    $q->where('user_id', $targetUserId);
                })
                ->withCount('members')
                ->get()
                ->first(function ($conversation) {
                    return $conversation->members_count === 2;
                });

            // Create new private conversation if not exists
            if (!$conversation) {

                $conversation = Conversation::create([
                    'type' => 'direct',
                    'created_by' => $authUserId,
                ]);

                $conversation->members()->attach([
                    $authUserId => [
                        'joined_at' => now(),
                        'is_admin' => false,
                    ],
                    $targetUserId => [
                        'joined_at' => now(),
                        'is_admin' => false,
                    ],
                ]);
            }

            // Create message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $authUserId,
                'body' => $body,
                'reply_to_id' => $replyToId,
            ]);

            // Store attachments
            if (!empty($attachments)) {
                $this->storeAttachments($message, $attachments);
            }

            // Update conversation timestamp
            $conversation->touch();

            return $message;
        });
    }

    /**
     * Store file attachments for a message.
     */
    protected function storeAttachments(Message $message, array $files): void
    {
        foreach ($files as $file) {
            $path = $file->store('chat/attachments', 'public');

            $message->attachments()->create([
                'file_path' => $path,
                'file_type' => $this->getFileType($file->getMimeType()),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);
        }
    }

    /**
     * Determine file type category from MIME type.
     */
    protected function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }
        if (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }
        return 'document';
    }

    /**
     * Edit a message.
     */
    public function edit(Message $message, string $body): Message
    {
        $message->update([
            'body' => $body,
            'edited_at' => now(),
        ]);

        return $message;
    }

    /**
     * Delete a message (soft delete).
     */
    public function delete(Message $message): bool
    {
        return $message->delete();
    }

    /**
     * Permanently delete a message.
     */
    public function permanentlyDelete(Message $message): bool
    {
        return $message->forceDelete();
    }

    /**
     * Add a reaction to a message.
     */
    public function addReaction(Message $message, int $userId, string $emoji): MessageReaction
    {
        return MessageReaction::firstOrCreate(
            [
                'message_id' => $message->id,
                'user_id' => $userId,
                'reaction' => $emoji,
            ]
        );
    }

    /**
     * Remove a reaction from a message.
     */
    public function removeReaction(Message $message, int $userId, string $emoji): bool
    {
        return MessageReaction::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->where('reaction', $emoji)
            ->delete() > 0;
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(Message $message, int $userId): ReadReceipt
    {
        return ReadReceipt::firstOrCreate(
            [
                'message_id' => $message->id,
                'user_id' => $userId,
            ],
            [
                'read_at' => now(),
            ]
        );
    }

    /**
     * Mark all messages in a conversation as read for a user.
     */
    public function markConversationAsRead(Conversation $conversation, int $userId): array
    {
        $messageIds = $conversation->messages()
            ->where('user_id', '!=', $userId)
            ->whereDoesntHave('readReceipts', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->pluck('id');

        if ($messageIds->isEmpty()) {
            return [];
        }

        $inserts = $messageIds->map(function ($messageId) use ($userId) {
            return [
                'message_id' => $messageId,
                'user_id' => $userId,
                'read_at' => now(),
            ];
        })->toArray();

        ReadReceipt::insertOrIgnore($inserts);

        return $messageIds->all();
    }

    /**
     * Get messages for a conversation with pagination.
     */
    public function getMessages(Conversation $conversation, int $page = 1, int $perPage = 50)
    {
        return $conversation->messages()
            ->with(['user', 'attachments', 'reactions', 'readReceipts', 'replyTo.user'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Search messages in a conversation.
     */
    public function search(Conversation $conversation, string $query, int $page = 1, int $perPage = 50)
    {
        return $conversation->messages()
            ->where('body', 'like', '%' . $query . '%')
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
