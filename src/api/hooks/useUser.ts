import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services';

// Post management hooks
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useGetPosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: userService.getPosts,
  });
};

// Profile management hooks
export const useGetProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Search management hooks
export const useGetRecentSearches = () => {
  return useQuery({
    queryKey: ['searches'],
    queryFn: userService.getRecentSearches,
  });
};

export const useAddSearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.addSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });
}; 