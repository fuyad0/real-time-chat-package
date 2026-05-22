<?php

use Fuyad\Chat\Http\Controllers\ConversationController;
use Fuyad\Chat\Http\Controllers\MessageController;
use Fuyad\Chat\Http\Controllers\PresenceController;
use Fuyad\Chat\Http\Controllers\BlockController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')
    ->middleware(['api', 'auth:sanctum'])->group(function () {
        // Conversation endpoints - specific routes first (before apiResource to avoid conflicts)
        Route::get('conversations/search', [ConversationController::class, 'search']);

        Route::apiResource('conversations', ConversationController::class);
        Route::get('conversations/{conversation}/members', [ConversationController::class, 'getMembers']);
        Route::post('conversations/{conversation}/members', [ConversationController::class, 'addMember']);
        Route::delete('conversations/{conversation}/members/{userId}', [ConversationController::class, 'removeMember']);

        // Message endpoints
        Route::post('conversations/{conversation}/messages', [MessageController::class, 'store']);

        Route::post('messages/send-to-user', [MessageController::class, 'sendToUser']);

        Route::get('conversations/{conversation}/messages', [MessageController::class, 'index']);
        Route::patch('messages/{message}', [MessageController::class, 'update']);
        Route::delete('messages/{message}', [MessageController::class, 'destroy']);
        Route::post('messages/{message}/read', [MessageController::class, 'markAsRead']);
        Route::post('conversations/{conversation}/mark-as-read', [MessageController::class, 'markConversationAsRead']);
        Route::post('messages/{message}/reactions', [MessageController::class, 'addReaction']);
        Route::delete('messages/{message}/reactions/{reaction}', [MessageController::class, 'removeReaction']);
        Route::get('conversations/{conversation}/search-messages', [MessageController::class, 'search']);

        // Presence endpoints
        Route::post('presence/online', [PresenceController::class, 'online']);
        Route::post('presence/offline', [PresenceController::class, 'offline']);
        Route::get('presence/{userId}/check', [PresenceController::class, 'check']);
        Route::post('presence/typing', [PresenceController::class, 'typing']);

        // Block endpoints
        Route::post('users/{userId}/block', [BlockController::class, 'store']);
        Route::delete('users/{userId}/block', [BlockController::class, 'destroy']);
        Route::get('users/blocked', [BlockController::class, 'index']);
    });
