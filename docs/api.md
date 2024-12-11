# WSPR Web API Documentation

## 🔐 Authentication

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### POST /api/auth/login
Authenticate a user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

## 💬 Messages

### POST /api/messages
Send a new message.

**Request Body:**
```json
{
  "content": "string",
  "recipientId": "string",
  "threadId": "string?",
  "replyToId": "string?",
  "type": "text | file",
  "metadata": {
    "encryptedKey": "string",
    "fileId": "string?",
    "fileMetadata": {
      "name": "string",
      "size": "number",
      "type": "string"
    }
  }
}
```

### GET /api/messages/:recipientId
Get message history with a specific recipient.

**Query Parameters:**
- `limit`: number (default: 50)
- `before`: number (timestamp)
- `after`: number (timestamp)
- `includeDeleted`: boolean (default: false)

### PUT /api/messages/:messageId
Update a message.

**Request Body:**
```json
{
  "content": "string",
  "status": "sent | delivered | read",
  "isPinned": "boolean?",
  "isBookmarked": "boolean?"
}
```

### DELETE /api/messages/:messageId
Delete a message.

**Query Parameters:**
- `type`: "self" | "all" (default: "self")

### POST /api/messages/:messageId/reactions
Add a reaction to a message.

**Request Body:**
```json
{
  "emoji": "string"
}
```

### DELETE /api/messages/:messageId/reactions/:reactionId
Remove a reaction from a message.

### POST /api/messages/:messageId/pin
Pin a message in a thread.

### DELETE /api/messages/:messageId/pin
Unpin a message from a thread.

### POST /api/messages/:messageId/bookmark
Bookmark a message.

### DELETE /api/messages/:messageId/bookmark
Remove a bookmark from a message.

### GET /api/messages/unread
Get count of unread messages.

**Response:**
```json
{
  "count": "number"
}
```

## 📝 Message Templates

### Create Message Template

```http
POST /api/templates
```

**Request Body:**
```json
{
  "name": "string",
  "content": "string",
  "category": "string (optional)",
  "tags": ["string"] (optional)
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "isShared": false,
  "metadata": {},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Get Message Templates

```http
GET /api/templates
```

**Query Parameters:**
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags (comma-separated)
- `includeShared` (optional): Include shared templates (default: true)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "content": "string",
    "category": "string",
    "tags": ["string"],
    "isShared": boolean,
    "metadata": {},
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "user": {
      "id": "uuid",
      "username": "string"
    }
  }
]
```

### Search Message Templates

```http
GET /api/templates/search?query=string
```

**Query Parameters:**
- `query`: Search term
- `includeShared` (optional): Include shared templates (default: true)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "string",
    "content": "string",
    "category": "string",
    "tags": ["string"],
    "isShared": boolean,
    "metadata": {},
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "user": {
      "id": "uuid",
      "username": "string"
    }
  }
]
```

### Update Message Template

```http
PUT /api/templates/:templateId
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "content": "string (optional)",
  "category": "string (optional)",
  "tags": ["string"] (optional)
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "isShared": boolean,
  "metadata": {},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Delete Message Template

```http
DELETE /api/templates/:templateId
```

**Response:** `204 No Content`

### Toggle Template Sharing

```http
POST /api/templates/:templateId/share
```

**Request Body:**
```json
{
  "shared": boolean
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "isShared": boolean,
  "metadata": {},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## 📅 Scheduled Messages

### Create Scheduled Message

```http
POST /api/scheduled-messages
```

**Request Body:**
```json
{
  "threadId": "uuid",
  "content": "string",
  "scheduledFor": "datetime",
  "recurring": boolean (optional),
  "recurringPattern": {
    "frequency": "daily" | "weekly" | "monthly" | "yearly",
    "interval": number (optional),
    "daysOfWeek": [number] (optional, 0-6),
    "dayOfMonth": number (optional, 1-31),
    "monthOfYear": number (optional, 1-12),
    "endDate": "datetime" (optional),
    "maxOccurrences": number (optional)
  } (optional)
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "threadId": "uuid",
  "content": "string",
  "scheduledFor": "datetime",
  "status": "pending",
  "recurring": boolean,
  "recurringPattern": object,
  "nextOccurrence": "datetime",
  "metadata": {},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Get Scheduled Messages

```http
GET /api/scheduled-messages
```

**Query Parameters:**
- `threadId` (optional): Filter by thread
- `status` (optional): Filter by status (pending, sent, failed, cancelled)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "threadId": "uuid",
    "content": "string",
    "scheduledFor": "datetime",
    "status": "pending" | "sent" | "failed" | "cancelled",
    "recurring": boolean,
    "recurringPattern": object,
    "nextOccurrence": "datetime",
    "metadata": {},
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "user": {
      "id": "uuid",
      "username": "string"
    },
    "thread": {
      "id": "uuid",
      "title": "string"
    }
  }
]
```

### Update Scheduled Message

```http
PUT /api/scheduled-messages/:messageId
```

**Request Body:**
```json
{
  "content": "string (optional)",
  "scheduledFor": "datetime (optional)",
  "recurring": boolean (optional),
  "recurringPattern": object (optional)
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "threadId": "uuid",
  "content": "string",
  "scheduledFor": "datetime",
  "status": "pending" | "sent" | "failed" | "cancelled",
  "recurring": boolean,
  "recurringPattern": object,
  "nextOccurrence": "datetime",
  "metadata": {},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Cancel Scheduled Message

```http
DELETE /api/scheduled-messages/:messageId
```

**Response:** `204 No Content`

## 🔖 Bookmarks

### GET /api/messages/bookmarked
Get all bookmarked messages.

**Query Parameters:**
- `tags`: string[]
- `search`: string

### PUT /api/messages/:messageId/bookmark
Bookmark/unbookmark a message.

**Request Body:**
```json
{
  "isBookmarked": "boolean",
  "tags": "string[]?"
}
```

## 📌 Pinned Messages

### GET /api/messages/pinned
Get all pinned messages.

### PUT /api/messages/:messageId/pin
Pin/unpin a message.

**Request Body:**
```json
{
  "isPinned": "boolean"
}
```

## 🔄 WebSocket Events

### Message Events
- `message:delivery`: Message delivery status updates
- `message:sent`: Message sent confirmation
- `message:blocked`: Message blocked notification
- `message:scheduled`: Scheduled message updates
- `message:retry`: Message retry attempts
- `message:cancel-scheduled`: Scheduled message cancellation

### Status Events
- `status:typing`: Typing indicator
- `status:online`: Online status updates
- `status:read`: Message read receipts

## 🔒 Security

### Headers
All API requests must include:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Rate Limiting
- 100 requests per minute per user
- 5 failed login attempts per 15 minutes
- 10 file uploads per minute

### Error Responses
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object?"
  }
}
```

## 📊 Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## 🔄 WebSocket Connection

### Connection URL
```
ws://api.wspr.io/ws?token=<jwt_token>
```

### Heartbeat
- Client must send ping every 30 seconds
- Server will respond with pong
- Connection closed after 2 missed pings

### Reconnection
- Exponential backoff
- Maximum retry interval: 30 seconds
- Maximum retry attempts: 10

## 📝 Examples

### Send a Message
```typescript
const response = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Hello World',
    recipientId: 'user123',
    metadata: {
      encryptionVersion: '1.0',
      iv: 'base64_encoded_iv'
    }
  })
});
```

### Create Template
```typescript
const response = await fetch('/api/templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Greeting',
    content: 'Hello {{name}}!',
    category: 'General',
    tags: ['greeting', 'formal']
  })
});
```

### WebSocket Usage
```typescript
const ws = new WebSocket(`ws://api.wspr.io/ws?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'message:delivery':
      updateMessageStatus(data.messageId, data.status);
      break;
    case 'message:sent':
      confirmMessageSent(data.messageId);
      break;
    // ... handle other events
  }
};
```

## 🔄 Changelog

### v1.0.0
- Initial API release
- Basic messaging functionality
- Authentication system
- WebSocket integration

### v1.1.0
- Added message templates
- Added scheduled messages
- Added bookmarks and pins
- Enhanced message status tracking

### v1.2.0
- Added group messaging
- Enhanced security features
- Improved error handling
- Added rate limiting
