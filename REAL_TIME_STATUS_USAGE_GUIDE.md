# Real-Time Chat Status - Usage Guide

## Overview
This guide explains how the real-time status features work and how to use them in your chat application.

## Features Implemented

### 1. **Message Status Indicators** ✓
Shows the delivery status of messages sent by the current user.

**Status Types:**
- **Sent** (✓) - Gray - Message created but may not be delivered yet
- **Delivered** (✓) - Gray - Message confirmed delivered to server (500ms after creation)
- **Seen** (✓✓) - Blue - Message has been read by recipient

**How it works:**
- When you send a message, it shows as "sent"
- After 500ms, it updates to "delivered"
- When the recipient reads the message, it shows as "seen"
- Recipients must call the mark-as-read endpoint for the message to show as seen

**API Used:**
```
POST /conversations/{id}/mark-as-read  // Mark all messages as read
```

### 2. **Typing Indicators** ⌨️
Shows when other users are typing in the conversation.

**How it works:**
1. User types in the message input box
2. The `useTypingIndicator` hook emits typing event every 2 seconds (throttled)
3. Server broadcasts event to all conversation members
4. Other clients receive event and show "User is typing..." with animated dots
5. Typing indicator auto-clears after 3 seconds of inactivity

**Visual:**
```
John is typing •••
```

**API Used:**
```
POST /presence/typing
{
  "conversation_id": 1
}
```

### 3. **Online/Offline Status** 🟢/⚫
Shows whether users are currently online or offline.

**Status Display:**
- **Green dot** (●) - User is online
- **Gray dot** (●) - User is offline
- Shows in conversation list next to user name
- Shows on user avatar with overlay indicator

**How it works:**
1. When ChatPage component mounts, user is marked as online
2. Heartbeat every 30 seconds keeps user marked as online
3. When ChatPage unmounts, user is marked as offline
4. All clients receive online/offline events via broadcast
5. Online status updates in real-time across all conversations

**API Used:**
```
POST /presence/online   // Set user online
POST /presence/offline  // Set user offline
```

## Implementation Details

### Frontend Components

#### ChatPage.tsx
Main component that orchestrates everything:
```typescript
- useUserPresence() - Manages online/offline status
- useRealtimeChat() - Listens for real-time events
- Passes onlineUsers and typingUsers to child components
- Auto-marks conversation as read when opened
```

#### MessageBox.tsx
Displays messages with status indicators:
```typescript
- Shows <MessageStatus /> for each message
- Shows <TypingIndicator /> when users are typing
- Receives typingUsers set to display typing users
```

#### ConversationList.tsx
Shows conversations with presence:
```typescript
- Shows <OnlineStatus /> dot on user avatar
- Shows "●" green dot next to online users
- Shows "typing..." instead of last message when user is typing
- Receives onlineUsers and typingUsers sets
```

#### MessageInput.tsx
Triggers typing indicators:
```typescript
- Uses useTypingIndicator hook
- Emits typing event when user types
- Throttled to 2-second intervals
```

### Hooks

#### useRealtimeChat(config)
Listens for real-time events:
```typescript
interface RealtimeChatConfig {
  conversationId: number;
  userId: number;
  onMessageReceived?: (message) => void;
  onUserTyping?: (userId) => void;
  onUserStoppedTyping?: (userId) => void;
  onUserOnline?: (userId) => void;
  onUserOffline?: (userId) => void;
}
```

#### useTypingIndicator(conversationId)
Emits typing indicators:
```typescript
// Usage in component:
const notifyTyping = useTypingIndicator(conversationId);

// Call when user types:
notifyTyping();
```

#### useUserPresence()
Manages online/offline status:
```typescript
// Usage in component:
useUserPresence();

// Automatically:
// - Sets online on mount
// - Sends heartbeat every 30 seconds
// - Sets offline on unmount
```

## Database Schema

### ReadReceipt Table
```sql
CREATE TABLE read_receipts (
  id BIGINT PRIMARY KEY,
  message_id BIGINT,
  user_id BIGINT,
  read_at TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Broadcasting Channels

### Private Channels
- `private:chat.presence` - Broadcasts user online/offline events
- `private:conversation.{id}` - Broadcasts messages and typing indicators

**Note:** Clients must be authenticated to subscribe to these channels.

## API Endpoints

### Presence Endpoints
```
POST /presence/online        // Set user online
POST /presence/offline       // Set user offline
GET  /presence/{userId}/check // Check if user is online
POST /presence/typing        // Emit typing indicator
```

### Message Endpoints
```
POST /conversations/{id}/mark-as-read  // Mark all as read
POST /messages/{id}/read               // Mark single message as read
```

## Workflow Example

### Sending and Reading a Message

1. **User A sends message:**
   ```
   POST /conversations/1/messages
   Body: { message: "Hello!" }
   ```

2. **Backend broadcasts:**
   ```
   Channel: private:conversation.1
   Event: message:received
   Payload: { message: {...} }
   ```

3. **User B receives event:**
   - Message appears in chat
   - `useRealtimeChat` calls `onMessageReceived` callback
   - Messages reload to show latest messages

4. **Chat opens or User B is active:**
   ```
   POST /conversations/1/mark-as-read
   ```

5. **Backend creates read receipt and broadcasts:**
   ```
   Channel: private:conversation.1
   Event: message:received (with read_receipts)
   ```

6. **User A receives update:**
   - Message status changes from ✓ to ✓✓
   - MessageStatus component re-renders

## Real-Time Events

### Message Events
- `message:received` - New message in conversation
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `message:reaction:added` - Reaction added to message

### Presence Events
- `user:online` - User came online
- `user:offline` - User went offline
- `user:typing` - User is typing

## Configuration

### Heartbeat Interval
Located in `useUserPresence.ts`:
```typescript
const heartbeatInterval = setInterval(() => {
    setOnline();
}, 30000); // Currently 30 seconds
```

### Typing Throttle
Located in `useTypingIndicator.ts`:
```typescript
typingTimeoutRef.current = setTimeout(() => {
    typingTimeoutRef.current = null;
}, 2000); // Currently 2 seconds
```

### Typing Indicator Timeout
Located in `useRealtimeChat.ts`:
```typescript
setTimeout(() => {
    // Clear typing indicator
}, 3000); // Currently 3 seconds
```

## Troubleshooting

### Typing indicators not showing
- Check if Echo/Reverb is properly configured
- Verify broadcasting is enabled in `config/broadcasting.php`
- Check browser console for WebSocket connection errors
- Ensure user is authenticated before opening chat

### Online status not updating
- Verify heartbeat interval is reasonable (30s)
- Check if presence endpoints are returning 200 OK
- Look for network errors in browser network tab
- Ensure auth middleware is properly set up

### Messages not showing as read
- Verify `POST /conversations/{id}/mark-as-read` is being called
- Check if `read_receipts` table exists and has data
- Ensure message query includes `with(['readReceipts'])`
- Check if current user ID matches in read receipt

## Performance Considerations

1. **Typing Throttle:** 2-second throttle prevents server spam
2. **Heartbeat:** 30-second interval balances real-time feel with server load
3. **Message Pagination:** Loads messages in pages to reduce payload
4. **Read Receipts:** Batched inserts for multiple messages

## Security Notes

- All endpoints require authentication
- Users can only see conversations they're members of
- Typing indicators only broadcast within conversation members
- Presence events only broadcast to authenticated users
- Read receipts only visible to conversation members
