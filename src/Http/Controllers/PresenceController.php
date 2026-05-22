<?php

namespace Fuyad\Chat\Http\Controllers;

use Fuyad\Chat\Events\UserOnline;
use Fuyad\Chat\Events\UserOffline;
use Fuyad\Chat\Events\UserTyping;
use Fuyad\Chat\Services\PresenceService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PresenceController extends Controller
{
    protected PresenceService $presenceService;

    public function __construct(PresenceService $presenceService)
    {
        $this->presenceService = $presenceService;
    }

    /**
     * Set user online.
     */
    public function online(Request $request)
    {
        $this->presenceService->setOnline($request->user()->id);
        broadcast(new UserOnline($request->user()->id));

        return response()->json([
            'success' => true,
            'message' => 'User set online',
            'code' => 200,
        ]);
    }

    /**
     * Set user offline.
     */
    public function offline(Request $request)
    {
        $this->presenceService->setOffline($request->user()->id);
        broadcast(new UserOffline($request->user()->id));

        return response()->json([
            'success' => true,
            'message' => 'User set offline',
            'code' => 200,
        ]);
    }

    /**
     * Check if user is online.
     */
    public function check(Request $request, int $userId)
    {
        $isOnline = $this->presenceService->isOnline($userId);

        return response()->json([
            'success' => true,
            'message' => 'User presence checked',
            'data' => [
                'user_id' => $userId,
                'is_online' => $isOnline,
            ],
            'code' => 200,
        ]);
    }

    /**
     * Broadcast typing indicator.
     */
    public function typing(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
        ]);

        broadcast(new UserTyping($request->user()->id, $validated['conversation_id']))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Typing indicator sent',
            'code' => 200,
        ]);
    }
}
