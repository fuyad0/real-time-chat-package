<?php

namespace Fuyad\Chat\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;
    public int $conversationId;
    public int $userId;
    public string $reaction;

    public function __construct(int $messageId, int $conversationId, int $userId, string $reaction)
    {
        $this->messageId = $messageId;
        $this->conversationId = $conversationId;
        $this->userId = $userId;
        $this->reaction = $reaction;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->conversationId);
    }

    public function broadcastAs(): string
    {
        return 'message:reaction:added';
    }
}
