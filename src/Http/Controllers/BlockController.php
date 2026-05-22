<?php

namespace Fuyad\Chat\Http\Controllers;

use Fuyad\Chat\Services\BlockService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BlockController extends Controller
{
    protected BlockService $blockService;

    public function __construct(BlockService $blockService)
    {
        $this->blockService = $blockService;
    }

    /**
     * Block a user.
     */
    public function store(Request $request, int $userId)
    {
        $this->blockService->block($request->user()->id, $userId);

        return response()->json([
            'success' => true,
            'message' => 'User blocked successfully',
            'code' => 200,
        ]);
    }

    /**
     * Unblock a user.
     */
    public function destroy(Request $request, int $userId)
    {
        $this->blockService->unblock($request->user()->id, $userId);

        return response()->json([
            'success' => true,
            'message' => 'User unblocked successfully',
            'code' => 200,
        ]);
    }

    /**
     * Get blocked users.
     */
    public function index(Request $request)
    {
        $blocked = $this->blockService->getBlockedUsers(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', config('chat.pagination_per_page', 50))
        );

        return response()->json([
            'success' => true,
            'data' => $blocked->items(),
            'pagination' => [
                'total' => $blocked->total(),
                'per_page' => $blocked->perPage(),
                'current_page' => $blocked->currentPage(),
                'last_page' => $blocked->lastPage(),
            ],
            'code' => 200,
        ]);
    }
}
