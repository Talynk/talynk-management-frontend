import apiClient  from "../apiClient";

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

interface Post {
  id: string;
  title: string;
  description: string;
  video_url: string;
  fullUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  views: number;
  likes: number;
  shares: number;
  category_id: number;
  createdAt: string;
  updatedAt: string;
  PostLikes: any[];
  user: {
    username: string;
    email: string;
  };
}

export interface LikePostResponse {
  success: boolean;
  data: {
    post: {
      id: string;
      likes: number;
    };
    isLiked: boolean;
  };
}

export const postService = {
  // Like a post
  likePost: async (postId: string): Promise<LikePostResponse> => {
    try {
      const response = await apiClient.post(`/api/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId: string): Promise<LikePostResponse> => {
    try {
      const response = await apiClient.delete(`/api/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Share a post
  sharePost: async (postId: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.post(`/api/posts/${postId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },

  // Add a comment to a post
  addComment: async (postId: string, content: string): Promise<PostComment> => {
    try {
      const response = await apiClient.post(`/api/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments for a post
  getComments: async (postId: string): Promise<PostComment[]> => {
    try {
      const response = await apiClient.get(`/api/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (postId: string, commentId: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Check if user has liked a post
  hasLiked: async (postId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/api/posts/${postId}/like/check`);
      return response.data.hasLiked;
    } catch (error) {
      console.error('Error checking like status:', error);
      throw error;
    }
  },

  // Get post details
  getPost: async (postId: string): Promise<Post> => {
    try {
      const response = await apiClient.get(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  },

  // Update post views
  updateViews: async (postId: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.post(`/api/posts/${postId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error updating views:', error);
      throw error;
    }
  },

  // Get all posts
  getAllPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get('/api/posts');
      return response.data;
    } catch (error) {
      console.error('Error getting all posts:', error);
      throw error;
    }
  },

  // Get posts by category
  getPostsByCategory: async (categoryId: string): Promise<Post[]> => {
    try {
      const response = await apiClient.get(`/api/posts/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting posts by category:', error);
      throw error;
    }
  },

  // Search posts
  searchPosts: async (query: string): Promise<Post[]> => {
    try {
      const response = await apiClient.get(`/api/posts/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }
};
