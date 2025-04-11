import apiClient from '../apiClient';

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

interface Report {
  id: string;
  content: string;
  approverId: string;
  createdAt: string;
}

export const approverService = {
  // Post management
  getPendingPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>('/api/approver/posts/pending');
    return response.data;
  },

  getApprovedPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>('/api/approver/posts/approved');
    return response.data;
  },

  approvePost: async (postId: string): Promise<Post> => {
    const response = await apiClient.put<Post>(`/api/approver/posts/${postId}/approve`);
    return response.data;
  },

  rejectPost: async (postId: string): Promise<Post> => {
    const response = await apiClient.put<Post>(`/api/approver/posts/${postId}/reject`);
    return response.data;
  },

  // Report management
  generateReport: async (data: { content: string }): Promise<Report> => {
    const response = await apiClient.post<Report>('/api/approver/reports', data);
    return response.data;
  },
}; 