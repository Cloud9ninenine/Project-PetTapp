# Backend Changes Required for Messaging System

## Files Created

### 1. Message Model
**File**: `petTapp-be/src/models/Message.ts`
✅ Created - Defines Message and Conversation schemas

### 2. Message Routes
**File**: `petTapp-be/src/routes/messages.ts`
✅ Created - All message API endpoints

---

## Manual Changes Needed

### Update `petTapp-be/src/app.ts`

**Step 1**: Add import at top (around line 23)
```typescript
import messageRoutes from './routes/messages';
```

**Step 2**: Add route registration (around line 52, after notifications)
```typescript
app.use('/messages', messageRoutes);
```

**Complete change**:
```typescript
// Around line 11-23, add:
import messageRoutes from './routes/messages';

// Around line 40-52, add:
app.use('/messages', messageRoutes);
```

---

## API Endpoints Available

Once registered, these endpoints will be available:

### 1. Get Conversations
```
GET /messages/conversations
Authorization: Bearer <token>
```

Returns all conversations for the logged-in user with unread counts.

### 2. Get Messages in Conversation
```
GET /messages/:conversationId?page=1&limit=50
Authorization: Bearer <token>
```

Returns all messages in a specific conversation (paginated).

### 3. Send Message
```
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "user_id_here",
  "message": "Hello!",
  "messageType": "text",  // or "image", "file"
  "fileUrl": "optional_file_url",
  "fileName": "optional_file_name",
  "bookingId": "optional_booking_reference"
}
```

### 4. Mark Messages as Read
```
PUT /messages/:conversationId/read
Authorization: Bearer <token>
```

Marks all messages in a conversation as read for the current user.

### 5. Get Unread Count
```
GET /messages/unread/count
Authorization: Bearer <token>
```

Returns total number of unread messages.

---

## Testing the API

After adding the route to `app.ts`, restart the server and test:

```bash
# Get conversations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/messages/conversations

# Send a message
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"USER_ID","message":"Test message"}' \
  http://localhost:5000/messages

# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/messages/unread/count
```

---

## Database Collections Created

The Message model will create two collections:

1. **messages** - Individual messages
2. **conversations** - Conversation metadata

Both will be automatically created when first message is sent.

---

## Next Steps

1. ✅ Add import to `app.ts`
2. ✅ Add route registration to `app.ts`
3. ✅ Restart backend server
4. ✅ Test API endpoints
5. ✅ Integrate with mobile app
