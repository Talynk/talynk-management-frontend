import apiClient from '../apiClient';
import axios from 'axios';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Approver {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ApproverRequest {
  username: string;
  email: string;
  password: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  approver_id: string | null;
  admin_id: string | null;
  approved_at: string | null;
  unique_traceability_id: string | null;
  views: number;
  likes: number;
  shares: number;
  category_id: number | null;
  createdAt: string;
  updatedAt: string;
  fullUrl: string | null;
  user: {
    id: string;
    username: string;
    email: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalApprovers: number;
  pendingVideos: number;
  approvedVideos: number;
  rejectedVideos: number;
  frozenUsers: number;
  activeUsers: number;
  // Add other stats fields as needed based on the backend response
}

export interface UserStats {
  users: {
    total: number;
    active: number;
    frozen: number;
  };
  posts: {
    total: number;
    approved: number;
    pending: number;
  };
}

export interface UserStatsResponse {
  status: string;
  data: UserStats;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  status: string;
  postsApproved: number;
  postsPending: number;
  posts_count: number;
  phone1?: string;
  phone2?: string;
  profile_picture?: string;
  approved_posts_count?: number;
  pending_posts_count?: number;
  rejected_posts_count?: number;
}

export interface UsersResponse {
  status: string;
  data: {
    users: User[];
  };
}

export interface SearchResponse {
  status: string;
  data: Post[];
}

export const adminService = {
  // User management
  getAllUsers: async (): Promise<UsersResponse> => {
    try {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  manageAccount: async (data: { userId: string; action: 'freeze' | 'reactivate' }): Promise<unknown> => {
    try {
      // Ensure the parameters match the API's expectations
      const payload = {
        id: data.userId,
        action: data.action
      };
      
      const response = await apiClient.post('/api/admin/accounts/manage', payload);
      return response.data;
    } catch (error: unknown) {
      console.error('Error managing account:', error);
      throw error;
    }
  },

  // Approver management
  getAllApprovers: async (): Promise<Approver[]> => {
    const response = await apiClient.get<Approver[]>('/api/admin/approvers');
    return response.data;
  },

  getApproverById: async (id: string): Promise<Approver> => {
    const response = await apiClient.get<Approver>(`/api/admin/approvers/${id}`);
    return response.data;
  },

  registerApprover: async (data: ApproverRequest): Promise<Approver> => {
    try {
      const response = await apiClient.post('/api/admin/approvers', data);

      // Try to extract the new approver from the response
      if (response.data) {
        if (response.data.status === 'success' && response.data.data) {
          return response.data.data;
        }
        if (response.data.id && response.data.username && response.data.email) {
          return response.data;
        }
        if (response.data.status === 'error') {
          const errorMessage = response.data.message || 'Failed to register approver';
          if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
            throw new Error('An approver with this username or email already exists');
          }
          throw new Error(errorMessage);
        }
      }

      // If the backend returns nothing but the request succeeded, fake the object
      if (response.status === 201 || response.status === 200) {
        // Use the data we just sent, but generate a fake id (since we don't have it)
        return {
          id: Math.random().toString(36).substring(2, 15), // fake id
          username: data.username,
          email: data.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      throw new Error('Failed to register approver');
    } catch (error: unknown) {
      console.error('Error registering approver:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; status?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Failed to register approver';
        if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
          throw new Error('An approver with this username or email already exists');
        }
        throw new Error(errorMessage);
      }
      throw new Error('Failed to register approver');
    }
  },

  deleteApprover: async (identifier: string): Promise<void> => {
    try {
      // Try deleting by id first
      let response = await apiClient.delete(`/api/admin/approvers/${identifier}`);
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      // If backend returns a status: 'error' or message, throw it
      if (response.data && response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to delete approver');
      }
      // If not found, try by username
      if (response.status === 404 || response.status === 400) {
        response = await apiClient.delete(`/api/admin/approvers/${encodeURIComponent(identifier)}`);
        if (response.status >= 200 && response.status < 300) {
          return;
        }
        if (response.data && response.data.status === 'error') {
          throw new Error(response.data.message || 'Failed to delete approver');
        }
      }
      throw new Error('Failed to delete approver');
    } catch (error: unknown) {
      // If the first attempt fails, try the other identifier type
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        // If not found, try the other identifier
        if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
          try {
            const response = await apiClient.delete(`/api/admin/approvers/${encodeURIComponent(identifier)}`);
            if (response.status >= 200 && response.status < 300) {
              return;
            }
            if (response.data && response.data.status === 'error') {
              throw new Error(response.data.message || 'Failed to delete approver');
            }
          } catch (err) {
            throw new Error('Failed to delete approver');
          }
        }
        throw new Error(axiosError.response?.data?.message || 'Failed to delete approver');
      }
      throw new Error('Failed to delete approver');
    }
  },

  // Post management
  getAllApprovedPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: { posts: Post[] } }>('/api/admin/approved/posts');
      // Check if response has the expected format with nested posts array
      if (response.data && response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      console.error("Unexpected response format for approved posts:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching approved posts:", error);
      return [];
    }
  },

  getPendingPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: { posts: Post[] } }>('/api/admin/posts/pending');
      
      // Check if response has a nested posts property
      if (response.data && response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("Unexpected response format for pending posts:", response.data);
        return [];
      }
    } catch (error: unknown) {
      console.error("Error fetching pending posts:", error);
      return [];
    }
  },

  getRejectedPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: Post[] }>('/api/admin/posts/rejected');
      // Check if response has the expected format
      if (response.data && response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
      }
      console.error("Unexpected response format for rejected posts:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching rejected posts:", error);
      return [];
    }
  },

  // Get posts approved by a specific approver
  getPostsApprovedByApprover: async (approverId: string): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>(`/api/admin/approvers/${approverId}/posts`);
    return response.data;
  },

  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<{ status: string; data: DashboardStats }>('/api/admin/dashboard/stats');
      
      // Assuming the actual stats are nested under a 'data' property in the response
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      } else {
        // Handle potential errors or unexpected response structure
        console.error("Error fetching dashboard stats or invalid response structure:", response.data);
        // Return a default/empty stats object or throw an error
        return {
          totalUsers: 0,
          totalApprovers: 0,
          pendingVideos: 0,
          approvedVideos: 0,
          rejectedVideos: 0,
          frozenUsers: 0,
          activeUsers: 0,
        };
      }
    } catch (error: unknown) {
      console.error("Error fetching dashboard stats:", error);
      // Return default data
      return {
        totalUsers: 0,
        totalApprovers: 0,
        pendingVideos: 0,
        approvedVideos: 0,
        rejectedVideos: 0,
        frozenUsers: 0,
        activeUsers: 0,
      };
    }
  },

  updatePostStatus: async (data: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }): Promise<unknown> => {
    const response = await apiClient.put(`/api/admin/posts/${data.id}/status`, data);
    return response.data;
  },

  getUserStats: async (): Promise<UserStatsResponse> => {
    try {
      const response = await apiClient.get('/api/admin/users/stats');
      
      // Check if response has the expected format
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data;
      } else {
        console.error("Unexpected user stats response format:", response.data);
        // Return a default response to prevent UI errors
        return {
          status: 'success',
          data: {
            users: {
              total: 0,
              active: 0,
              frozen: 0
            },
            posts: {
              total: 0,
              approved: 0,
              pending: 0
            }
          }
        };
      }
    } catch (error: unknown) {
      console.error('Error fetching user statistics:', error);
      // Return a default response instead of throwing to prevent UI errors
      return {
        status: 'error',
        data: {
          users: {
            total: 0,
            active: 0,
            frozen: 0
          },
          posts: {
            total: 0,
            approved: 0,
            pending: 0
          }
        }
      };
    }
  },
  
  // Search posts by ID or traceability ID
  searchPosts: async (query: string): Promise<Post[]> => {
    try {
      if (!query.trim()) {
        throw new Error('Invalid search query');
      }

      // Check if query is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      
      // If it's a UUID, search by exact ID, otherwise use the general search
      const endpoint = isUUID 
        ? `/api/admin/posts/${encodeURIComponent(query)}` 
        : `/api/admin/posts/search?q=${encodeURIComponent(query)}`;

      const response = await apiClient.get<SearchResponse>(endpoint);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Handle case where response is a direct array
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure
        return response.data.data;
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        // Handle specific error responses
        switch (axiosError.response?.status) {
          case 400:
            throw new Error('Invalid search query');
          case 401:
            throw new Error('Unauthorized');
          case 404:
            throw new Error('Post not found');
          default:
            throw new Error('Error searching for posts');
        }
      }
      throw new Error('Error searching for posts');
    }
  },
  
  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      
      // Check if response has the expected format
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },
}; 