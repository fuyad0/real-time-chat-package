<?php

namespace Fuyad\Chat\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @var array<int> */
    public array $messageIds;
    public int $conversationId;
    public int $userId;

    public function __construct(int $conversationId, int $userId, array $messageIds)
    {
        $this->conversationId = $conversationId;
        $this->userId = $userId;
        $this->messageIds = $messageIds;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->conversationId);
    }

    public function broadcastAs(): string
    {
        return 'message:read';
    }
}
