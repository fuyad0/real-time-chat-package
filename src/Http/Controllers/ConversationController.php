<?php

namespace Fuyad\Chat\Http\Controllers;

use Fuyad\Chat\Http\Requests\CreateConversationRequest;
use Fuyad\Chat\Models\Conversation;
use Fuyad\Chat\Services\ConversationService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ConversationController extends Controller
{
    use AuthorizesRequests;

    protected ConversationService $conversationService;

    public function __construct(ConversationService $conversationService)
    {
        $this->conversationService = $conversationService;
    }

    /**
     * List all conversations for the authenticated user.
     */
    public function index(Request $request)
    {
        $conversations = $this->conversationService->getForUser(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', config('chat.pagination_per_page', 50))
        );

        return response()->json([
            'success' => true,
            'data' => $conversations->items(),
            'pagination' => [
                'total' => $conversations->total(),
                'per_page' => $conversations->perPage(),
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific conversation.
     */
    public function show(Request $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        return response()->json([
            'success' => true,
            'data' => $conversation->load('members', 'lastMessage'),
            'code' => 200,
        ]);
    }

    /**
     * Create a new conversation.
     */
    public function store(CreateConversationRequest $request)
    {
        $validated = $request->validated();

        $conversation = $this->conversationService->create(
            $validated['type'],
            $request->user()->id,
            $validated['member_ids'],
            $validated['name'] ?? null,
            $validated['avatar_path'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $conversation->load('members'),
            'message' => 'Conversation created successfully',
        ], 201);
    }

    /**
     * Update a conversation.
     */
    public function update(Request $request, Conversation $conversation)
    {
        $this->authorize('update', $conversation);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'avatar_path' => 'sometimes|string|nullable',
        ]);

        $updated = $this->conversationService->update($conversation, $validated);

        return response()->json([
            'success' => true,
            'data' => $updated,
            'message' => 'Conversation updated successfully',
            'code' => 200,
        ]);
    }

    /**
     * Delete (archive) a conversation.
     */
    public function destroy(Request $request, Conversation $conversation)
    {
        $this->authorize('delete', $conversation);

        $this->conversationService->removeMember($conversation, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Conversation archived successfully',
            'code' => 200,
        ]);
    }

    /**
     * Get conversation members.
     */
    public function getMembers(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        return response()->json([
            'success' => true,
            'data' => $conversation->members()->whereNull('left_at')->get(),
            'code' => 200,
        ]);
    }

    /**
     * Add a member to conversation.
     */
    public function addMember(Request $request, Conversation $conversation)
    {
        $this->authorize('update', $conversation);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $this->conversationService->addMember(
            $conversation,
            $validated['user_ids']
        );

        return response()->json([
            'success' => true,
            'message' => 'Members added successfully',
            'code' => 200,
        ]);
    }

    /**
     * Remove a member from conversation.
     */
    public function removeMember(Request $request, Conversation $conversation, int $userId)
    {
        $this->authorize('update', $conversation);

        $this->conversationService->removeMember($conversation, $userId);

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully',
            'code' => 200,
        ]);
    }

    /**
     * Search conversations.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $conversations = $this->conversationService->search(
            $request->user()->id,
            $validated['query'],
            $request->get('page', 1),
            $request->get('per_page', config('chat.pagination_per_page', 50))
        );

        return response()->json([
            'success' => true,
            'data' => $conversations->items(),
            'pagination' => [
                'total' => $conversations->total(),
                'per_page' => $conversations->perPage(),
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
            ],
        ]);
    }
}
