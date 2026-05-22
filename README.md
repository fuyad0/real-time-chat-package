# Fuyad Chat Package

A real-time chat package for Laravel inspired by Facebook Messenger with support for direct messages, group chats, media sharing, typing indicators, read receipts, and online status.

## Features

- ✅ **Direct Messaging** - One-to-one conversations
- ✅ **Group Chats** - Multi-user conversations
- ✅ **Real-time Messaging** - Instant message delivery using WebSockets (Reverb)
- ✅ **Typing Indicators** - "User is typing..." functionality
- ✅ **Read Receipts** - Message status (sent, delivered, read)
- ✅ **Online Status** - User presence tracking
- ✅ **Message Reactions** - Emoji reactions to messages
- ✅ **Message Editing** - Edit sent messages
- ✅ **Message Deletion** - Soft delete with notifications
- ✅ **User Blocking** - Block/unblock users
- ✅ **Message Search** - Search across conversations
- ✅ **Media Sharing** - Images, files, and links support
- ✅ **Notification Badges** - Unread message counts

## Installation

### 1. Install the package via Composer

```bash
composer require fuyad/chat
```

### 2. Publish the configuration

```bash
php artisan vendor:publish --provider="Fuyad\Chat\ChatServiceProvider" --tag="chat-config"
```

### 3. Run the migrations

```bash
php artisan migrate
```

### 4. Configure Broadcasting (Laravel Reverb)

```bash
php artisan install:broadcasting
php artisan reverb:start
```

Add to your `.env` file:

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 5. Publish the React chat UI

```bash
php artisan vendor:publish --tag=chat-ui
```

Wire the published page in your app (e.g. Inertia route to `resources/js/vendor/chat/ChatPage.tsx`).

**Frontend dependencies** (host app):

- `@laravel/echo-react`, `laravel-echo`, `pusher-js`
- A Dialog UI component at `@/components/ui/dialog` (used by the members popup)
- Call `configureEcho({ broadcaster: 'reverb', ... })` in your app entry (e.g. `app.tsx`)

See [PUBLISHING.md](PUBLISHING.md) for Packagist release and sync steps.

## Database Schema

The package creates the following tables:

### conversations
- `id` - Primary key
- `type` - 'direct' or 'group'
- `name` - Conversation name (nullable)
- `avatar_path` - Avatar URL (nullable)
- `created_by` - User ID who created the conversation
- `timestamps`

### conversation_members
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `user_id` - Foreign key to users
- `joined_at` - When user joined
- `left_at` - When user left (nullable)
- `is_admin` - Boolean flag for admin status
- `muted_at` - When user muted (nullable)
- `blocked_at` - When blocked (nullable)

### messages
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `user_id` - Foreign key to users (sender)
- `body` - Message content
- `edited_at` - When message was edited
- `deleted_at` - Soft delete timestamp
- `timestamps`

### message_attachments
- `id` - Primary key
- `message_id` - Foreign key to messages
- `file_path` - Path to the file
- `file_type` - Type of file (image, document, video, audio)
- `file_size` - Size in bytes
- `mime_type` - MIME type of file
- `timestamps`

### message_reactions
- `id` - Primary key
- `message_id` - Foreign key to messages
- `user_id` - Foreign key to users
- `reaction` - Emoji or reaction string
- `created_at`

### read_receipts
- `id` - Primary key
- `message_id` - Foreign key to messages
- `user_id` - Foreign key to users
- `read_at` - When message was read

### user_blocks
- `id` - Primary key
- `blocker_id` - User who blocked
- `blocked_user_id` - User who was blocked
- `created_at`

## API Endpoints

### Conversations

```
GET    /api/conversations                    - List all conversations
POST   /api/conversations                    - Create new conversation
GET    /api/conversations/{id}               - Get conversation details
PATCH  /api/conversations/{id}               - Update conversation
DELETE /api/conversations/{id}               - Archive conversation
GET    /api/conversations/{id}/members       - Get members
POST   /api/conversations/{id}/members       - Add member
DELETE /api/conversations/{id}/members/{userId} - Remove member
GET    /api/conversations/search             - Search conversations
```

### Messages

```
GET    /api/conversations/{id}/messages              - List messages (paginated)
POST   /api/conversations/{id}/messages              - Send message
PATCH  /api/messages/{id}                            - Edit message
DELETE /api/messages/{id}                            - Delete message
POST   /api/messages/{id}/read                       - Mark as read
POST   /api/conversations/{id}/mark-as-read         - Mark all as read
POST   /api/messages/{id}/reactions                  - Add reaction
DELETE /api/messages/{id}/reactions/{reaction}       - Remove reaction
GET    /api/conversations/{id}/search-messages       - Search messages
```

### Presence & Status

```
POST   /api/presence/online                 - Set user online
POST   /api/presence/offline                - Set user offline
GET    /api/presence/{userId}/check         - Check user status
POST   /api/presence/typing                 - Broadcast typing indicator
```

### User Blocking

```
POST   /api/users/{userId}/block            - Block user
DELETE /api/users/{userId}/block            - Unblock user
GET    /api/users/blocked                   - Get blocked users list
```

## WebSocket Events

### Server to Client Events

```
message:received      - New message arrived
message:delivered     - Message delivered to conversation
message:read          - Message(s) read by a user
message:updated       - Message was edited
message:deleted       - Message was deleted
message:reaction:added - Reaction added to message
user:typing          - User is typing
user:online          - User came online
user:offline         - User went offline
```

## Services

### ConversationService

```php
// Create a conversation
$conversation = app(ConversationService::class)->create(
    'group', // type
    $userId, // created_by
    $memberIds, // array of user IDs
    'Chat Name', // optional name
    'avatar_path' // optional avatar
);

// Get user's conversations
$conversations = app(ConversationService::class)->getForUser($userId);

// Add member
app(ConversationService::class)->addMember($conversation, $userId);

// Remove member
app(ConversationService::class)->removeMember($conversation, $userId);

// Search conversations
$results = app(ConversationService::class)->search($userId, 'search query');
```

### MessageService

```php
// Send message
$message = app(MessageService::class)->send($conversationId, $userId, 'Hello');

// Edit message
app(MessageService::class)->edit($message, 'Updated message');

// Delete message
app(MessageService::class)->delete($message);

// Add reaction
app(MessageService::class)->addReaction($message, $userId, '👍');

// Mark as read
app(MessageService::class)->markAsRead($message, $userId);

// Mark conversation as read
app(MessageService::class)->markConversationAsRead($conversation, $userId);
```

### BlockService

```php
// Block user
app(BlockService::class)->block($blockerId, $blockedUserId);

// Unblock user
app(BlockService::class)->unblock($blockerId, $blockedUserId);

// Check if blocked
$isBlocked = app(BlockService::class)->isBlocked($blockerId, $blockedUserId);

// Get blocked users
$blockedUsers = app(BlockService::class)->getBlockedUsers($userId);
```

### PresenceService

```php
// Set online
app(PresenceService::class)->setOnline($userId);

// Set offline
app(PresenceService::class)->setOffline($userId);

// Check if online
$isOnline = app(PresenceService::class)->isOnline($userId);

// Get online users in conversation
$onlineUsers = app(PresenceService::class)->getOnlineInConversation($conversation);
```

## Configuration

Edit `config/chat.php`:

```php
return [
    // WebSocket driver: 'reverb' or 'pusher'
    'websocket_driver' => env('CHAT_WEBSOCKET_DRIVER', 'reverb'),

    // Typing indicator timeout in milliseconds
    'typing_timeout' => env('CHAT_TYPING_TIMEOUT', 3000),

    // Message retention period in days
    'message_retention' => env('CHAT_MESSAGE_RETENTION', 90),

    // Maximum attachment size in MB
    'max_attachment_size' => env('CHAT_MAX_ATTACHMENT_SIZE', 25),

    // Pagination per page
    'pagination_per_page' => env('CHAT_PAGINATION_PER_PAGE', 50),

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
```

## Advanced Usage

### Broadcasting with Reverb

```php
use Fuyad\Chat\Events\MessageSent;

// Broadcast an event
broadcast(new MessageSent($message));
```

### Using Models

```php
use Fuyad\Chat\Models\Conversation;
use Fuyad\Chat\Models\Message;

// Get all messages in conversation
$messages = $conversation->messages()->get();

// Get members
$members = $conversation->members()->get();

// Get unread count
$unreadCount = $conversation->unreadCount($userId);

// Get last message
$lastMessage = $conversation->lastMessage();

// Get reactions on message
$reactions = $message->reactions()->get();

// Check if message is read by user
$isRead = $message->isReadBy($userId);
```

## Testing

Run tests with:

```bash
composer test
```

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, visit the package repository.
