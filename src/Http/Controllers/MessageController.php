<?php

namespace Fuyad\Chat\Http\Controllers;

use Fuyad\Chat\Events\MessageDelivered;
use Fuyad\Chat\Events\MessageReactionAdded;
use Fuyad\Chat\Events\MessageDeleted;
use Fuyad\Chat\Events\MessageEdited;
use Fuyad\Chat\Events\MessageRead;
use Fuyad\Chat\Events\MessageSent;
use Fuyad\Chat\Http\Requests\StoreMessageRequest;
use Fuyad\Chat\Http\Requests\UpdateMessageRequest;
use Fuyad\Chat\Models\Conversation;
use Fuyad\Chat\Models\Message;
use Fuyad\Chat\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class MessageController extends Controller
{
    use AuthorizesRequests;

    protected MessageService $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    /**
     * Get messages for a conversation.
     */
    public function index(Request $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $messages = $this->messageService->getMessages(
            $conversation,
            $request->get('page', 1),
            $request->get('per_page', config('chat.pagination_per_page', 50))
        );

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'pagination' => [
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    /**
     * Send a new message.
     */
    public function store(StoreMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $validated = $request->validated();

        $message = $this->messageService->send(
            $conversation->id,
            $request->user()->id,
            $validated['message'],
            $request->file('attachments', [])
        );

        broadcast(new MessageSent($message->load('user', 'attachments', 'reactions')))->toOthers();
        broadcast(new MessageDelivered($message->id, $conversation->id));

        return response()->json([
            'success' => true,
            'data' => $message->load('user', 'attachments', 'reactions'),
            'message' => 'Message sent successfully',
        ], 201);
    }

    public function sendToUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string',
            'attachments.*' => 'file',
        ]);

        $message = $this->messageService->sendToUser(
            $request->user()->id,
            $validated['user_id'],
            $validated['message'],
            $request->file('attachments', [])
        );

        broadcast(new MessageSent(
            $message->load('user', 'attachments', 'reactions')
        ))->toOthers();
        broadcast(new MessageDelivered($message->id, $message->conversation_id));

        return response()->json([
            'success' => true,
            'data' => $message->load('conversation', 'user', 'attachments'),
            'message' => 'Message sent successfully',
        ], 201);
    }

    /**
     * Update (edit) a message.
     */
    public function update(UpdateMessageRequest $request, Message $message)
    {
        $this->authorize('update', $message);

        $validated = $request->validated();

        $updated = $this->messageService->edit($message, $validated['body']);

        broadcast(new MessageEdited($updated->load('user', 'attachments', 'reactions')))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $updated->load('user', 'attachments', 'reactions'),
            'message' => 'Message updated successfully',
            'code' => 200,
        ]);
    }

    /**
     * Delete a message.
     */
    public function destroy(Request $request, Message $message)
    {
        $this->authorize('delete', $message);

        $conversationId = $message->conversation_id;
        $this->messageService->delete($message);

        broadcast(new MessageDeleted($message->id, $conversationId))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
            'code' => 200,
        ]);
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(Request $request, Message $message)
    {
        $this->messageService->markAsRead($message, $request->user()->id);

        broadcast(new MessageRead(
            $message->conversation_id,
            $request->user()->id,
            [$message->id],
        ))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read',
            'code' => 200,
        ]);
    }

    /**
     * Mark all messages in conversation as read.
     */
    public function markConversationAsRead(Request $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $messageIds = $this->messageService->markConversationAsRead(
            $conversation,
            $request->user()->id,
        );

        if (! empty($messageIds)) {
            broadcast(new MessageRead(
                $conversation->id,
                $request->user()->id,
                $messageIds,
            ))->toOthers();
        }

        return response()->json([
            'success' => true,
            'message' => 'Conversation marked as read',
            'code' => 200,
        ]);
    }

    /**
     * Add a reaction to a message.
     */
    public function addReaction(Request $request, Message $message)
    {
        $validated = $request->validate([
            'reaction' => 'required|string|max:10',
        ]);

        $this->messageService->addReaction($message, $request->user()->id, $validated['reaction']);

        broadcast(new MessageReactionAdded(
            $message->id,
            $message->conversation_id,
            $request->user()->id,
            $validated['reaction']
        ))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Reaction added successfully',
            'code' => 200,
        ]);
    }

    /**
     * Remove a reaction from a message.
     */
    public function removeReaction(Request $request, Message $message, string $reaction)
    {
        $this->messageService->removeReaction($message, $request->user()->id, $reaction);

        return response()->json([
            'success' => true,
            'message' => 'Reaction removed successfully',
            'code' => 200,
        ]);
    }

    /**
     * Search messages in a conversation.
     */
    public function search(Request $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $validated = $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $messages = $this->messageService->search(
            $conversation,
            $validated['query'],
            $request->get('page', 1),
            $request->get('per_page', config('chat.pagination_per_page', 50))
        );

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'pagination' => [
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }
}
