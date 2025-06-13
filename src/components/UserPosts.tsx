import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, CircularProgress } from '@mui/material';
import { adminService, Post } from '../api/services/adminService';

interface UserPostsProps {
  userId: string;
  username: string;
  open: boolean;
  onClose: () => void;
}

const UserPosts: React.FC<UserPostsProps> = ({ userId, username, open, onClose }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch all posts and filter by user ID
        const allPosts = await adminService.getAllApprovedPosts();
        const userPosts = allPosts.filter(post => post.user_id === userId);
        setPosts(userPosts);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, open]);

  // Helper function to determine if a URL is a video
  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="bg-blue-500 text-white">
        Posts by {username}
      </DialogTitle>
      <DialogContent className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No posts found for this user.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.video_url && (
                  <div className="aspect-video">
                    {isVideo(post.video_url) ? (
                      <video
                        src={post.video_url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={post.video_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Views: {post.views}</span>
                    <span>Likes: {post.likes}</span>
                    <span>Shares: {post.shares}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Posted on: {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
      <div className="p-4 border-t">
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </div>
    </Dialog>
  );
};

export default UserPosts; 