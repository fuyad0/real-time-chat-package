<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Chat Configuration
    |--------------------------------------------------------------------------
    */

    // The user model class used by the host application
    'user_model' => 'App\\Models\\User',

    // WebSocket driver: 'reverb' or 'pusher'
    'websocket_driver' => env('CHAT_WEBSOCKET_DRIVER', 'reverb'),

    // Typing indicator timeout in milliseconds
    'typing_timeout' => env('CHAT_TYPING_TIMEOUT', 3000),

    // Message retention period in days
    'message_retention' => env('CHAT_MESSAGE_RETENTION', 90),

    // Maximum attachment size in MB
    'max_attachment_size' => env('CHAT_MAX_ATTACHMENT_SIZE', 25),

    // Allowed MIME types for attachments
    'allowed_mime_types' => [
        'image/*',
        'application/pdf',
        'video/*',
        'audio/*',
    ],

    // Pagination per page
    'pagination_per_page' => env('CHAT_PAGINATION_PER_PAGE', 50),

    // Notification channels
    'notification_channels' => ['database', 'mail'],

    // Rate limiting
    'rate_limit' => [
        'messages_per_minute' => 30,
        'conversations_per_minute' => 10,
        'api_calls_per_hour' => 1000,
    ],

    // Feature toggles
    'features' => [
        'message_reactions' => true,
        'message_editing' => true,
        'message_deletion' => true,
        'media_uploads' => true,
        'read_receipts' => true,
        'typing_indicators' => true,
        'user_blocking' => true,
        'group_chats' => true,
    ],
];
