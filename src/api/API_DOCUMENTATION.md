# Video Approval System API Documentation

This document provides an overview of the API endpoints available in the Video Approval System.

## Base URL

The base URL for all API endpoints is: `{{baseUrl}}` (configured in environment variables)

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### Auth

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "user|admin|approver"
  }
  ```
- **Response**: Returns access token and user information

#### Register
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "role": "user|admin|approver"
  }
  ```

#### Refresh Token
- **URL**: `/api/auth/refresh-token`
- **Method**: `GET`
- **Headers**: Requires valid refresh token

### Admin

#### User Management
- **Get All Users**: `GET /api/admin/users`
- **Manage Account**: `POST /api/admin/accounts/manage`

#### Approver Management
- **Get All Approvers**: `GET /api/admin/approvers`
- **Get Approver By ID**: `GET /api/admin/approvers/:id`
- **Register Approver**: `POST /api/admin/approvers`
- **Delete Approver**: `DELETE /api/admin/approvers/:username`
- **Get Posts Approved By Approver**: `GET /api/admin/approvers/:id/posts`

#### Post Management
- **Get All Approved Posts**: `GET /api/admin/posts/approved`
- **Get Pending Posts**: `GET /api/admin/posts/pending`
- **Get Rejected Posts**: `GET /api/admin/posts/rejected`

### Approver

#### Post Management
- **Get Pending Posts**: `GET /api/approver/posts/pending`
- **Get Approved Posts**: `GET /api/approver/posts/approved`
- **Approve Post**: `PUT /api/approver/posts/:id/approve`
- **Reject Post**: `PUT /api/approver/posts/:id/reject`

#### Report Management
- **Generate Report**: `POST /api/approver/reports`

### User

#### Post Management
- **Create Post**: `POST /api/posts` (multipart/form-data)
- **Delete Post**: `DELETE /api/posts/:id`
- **Get User Posts**: `GET /api/posts/user`
- **Get All Approved Posts**: `GET /api/posts/approved`

#### Profile Management
- **Get Profile**: `GET /api/profile`
- **Get User Profile**: `GET /api/user/profile`
- **Update Profile**: `PUT /api/profile`

#### Search Management
- **Get Recent Searches**: `GET /api/user/searches`
- **Add Search**: `POST /api/user/searches`

#### Notification Management
- **Get Notifications**: `GET /api/user/notifications`
- **Toggle Notification**: `PUT /api/user/notifications/:id/toggle`

#### User Statistics
- **Get User Statistics**: `GET /api/user/statistics`

#### Subscription
- **Subscribe**: `POST /api/user/subscribe`

### Posts

#### Post Actions
- **Like Post**: `POST /api/posts/:id/like`
- **Unlike Post**: `DELETE /api/posts/:id/like`
- **Share Post**: `POST /api/posts/:id/share`
- **Add Comment**: `POST /api/posts/:id/comments`
- **Get Comments**: `GET /api/posts/:id/comments`
- **Delete Comment**: `DELETE /api/posts/:id/comments/:commentId`
- **Check Like Status**: `GET /api/posts/:id/like/check`
- **Get Post Details**: `GET /api/posts/:id`
- **Update Views**: `POST /api/posts/:id/view`
- **Get All Posts**: `GET /api/posts`
- **Get Posts By Category**: `GET /api/posts/category/:categoryId`
- **Search Posts**: `GET /api/posts/search?q=:query`

## Data Models

### Post
```typescript
interface Post {
  id: string;
  title: string;
  caption: string;
  post_category: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
```

### Approver
```typescript
interface Approver {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

### Profile
```typescript
interface Profile {
  id: string;
  username: string;
  email: string;
  phone1?: string;
  phone2?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Notification
```typescript
interface Notification {
  id: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
}
```

### Search
```typescript
interface Search {
  id: string;
  searchTerm: string;
  userId: string;
  createdAt: string;
}
```

### PostComment
```typescript
interface PostComment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
}
``` 