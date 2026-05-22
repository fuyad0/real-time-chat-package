# Quick Start Guide

Get started with Fuyad Chat Package in 5 minutes!

## Step 1: Installation

```bash
composer require fuyad/chat
```

## Step 2: Publish Configuration

```bash
php artisan vendor:publish --provider="Fuyad\Chat\ChatServiceProvider" --tag="chat-config"
```

## Step 3: Run Migrations

```bash
php artisan migrate
```

## Step 4: Configure Broadcasting

Update your `.env`:

```env
BROADCAST_DRIVER=reverb
REVERB_APP_ID=123456
REVERB_APP_KEY=your_key
REVERB_APP_SECRET=your_secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

## Step 5: Start Using the API

### Create a Direct Conversation

```php
POST /api/conversations

{
  "type": "direct",
  "member_ids": [2, 3]
}
```

### Send a Message

```php
POST /api/conversations/{conversation_id}/messages

{
  "body": "Hello! How are you?"
}
```

### Set User Online

```php
POST /api/presence/online
```

### Get User's Conversations

```php
GET /api/conversations
```

### Add a Reaction

```php
POST /api/messages/{message_id}/reactions

{
  "reaction": "👍"
}
```

## Frontend Integration Example

### Using React + Socket.io

```typescript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

export function ChatApp() {
  const [conversations, setConversations] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    // Listen for new messages
    newSocket.on('message:received', (data) => {
      console.log('New message:', data);
    });

    // Listen for typing indicators
    newSocket.on('user:typing', (data) => {
      console.log('User typing:', data);
    });

    // Listen for online status
    newSocket.on('user:online', (data) => {
      console.log('User online:', data);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    // Fetch conversations
    axios.get('/api/conversations').then((res) => {
      setConversations(res.data.data);
    });

    // Set user online
    axios.post('/api/presence/online');
  }, []);

  const sendMessage = async (conversationId, message) => {
    const res = await axios.post(
      `/api/conversations/${conversationId}/messages`,
      { body: message }
    );
    return res.data.data;
  };

  const addReaction = async (messageId, emoji) => {
    await axios.post(`/api/messages/${messageId}/reactions`, {
      reaction: emoji,
    });
  };

  return (
    <div className="chat-app">
      <h1>Chat Conversations</h1>
      {conversations.map((conv) => (
        <div key={conv.id} className="conversation-item">
          <h2>{conv.name || 'Direct Chat'}</h2>
          <p>Last message: {conv.last_message?.body}</p>
        </div>
      ))}
    </div>
  );
}
```

## Common Tasks

### Create a Group Chat

```php
$conversation = app(ConversationService::class)->create(
    'group',
    auth()->id(),
    [2, 3, 4], // member IDs
    'Project Team' // name
);
```

### Get User's Messages

```php
$messages = app(MessageService::class)->getMessages($conversation, page: 1);
```

### Block a User

```php
app(BlockService::class)->block(auth()->id(), $userId);
```

### Search Conversations

```php
$results = app(ConversationService::class)->search(
    auth()->id(),
    'search query'
);
```

### Mark All as Read

```php
app(MessageService::class)->markConversationAsRead(
    $conversation,
    auth()->id()
);
```

## Troubleshooting

### WebSocket connection not working?

1. Ensure Reverb is installed: `composer require laravel/reverb`
2. Start Reverb server: `php artisan reverb:start`
3. Check your `.env` configuration

### Migrations not found?

```bash
php artisan migrate --path=vendor/fuyad/chat/src/Database/Migrations
```

### Events not broadcasting?

Check that broadcasting is properly configured:

```bash
php artisan config:clear
php artisan config:cache
```

## Next Steps

- Explore the [full API documentation](./README.md)
- Check out the [database schema](./README.md#database-schema)
- Review [available services](./README.md#services)
- Integrate with your frontend application

## Need Help?

- Check the README.md for comprehensive documentation
- Review the configuration file at `config/chat.php`
- Check Laravel documentation for broadcasting setup
