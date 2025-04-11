import React, { useState } from 'react';
import { Post } from '@/api/services/adminService'; // Import Post type
import { adminService } from '@/api/services/adminService'; // For calling approve/reject

interface PendingPostsListProps {
  posts: Post[];
  onPostUpdate: (postId: string) => void; // Callback to update parent state
}

const PendingPostsList: React.FC<PendingPostsListProps> = ({ posts, onPostUpdate }) => {
  const [loadingStates, setLoadingStates] = useState<{ [postId: string]: boolean }>({});
  const [errorStates, setErrorStates] = useState<{ [postId: string]: string | null }>({});

  const handleApprove = async (postId: string) => {
    setLoadingStates(prev => ({ ...prev, [postId]: true }));
    setErrorStates(prev => ({ ...prev, [postId]: null }));
    try {
      await adminService.updatePostStatus({ id: postId, status: 'approved' });
      onPostUpdate(postId); // Notify parent component to remove the post from the list
    } catch (err) {
      console.error("Error approving post:", err);
      setErrorStates(prev => ({ ...prev, [postId]: 'Failed to approve' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReject = async (postId: string) => {
    // Basic rejection - add reason input if needed
    const reason = prompt("Please provide a reason for rejection:");
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert("Rejection reason cannot be empty.");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [postId]: true }));
    setErrorStates(prev => ({ ...prev, [postId]: null }));
    try {
      await adminService.updatePostStatus({ id: postId, status: 'rejected', rejectionReason: reason });
      onPostUpdate(postId);
    } catch (err) {
      console.error("Error rejecting post:", err);
      setErrorStates(prev => ({ ...prev, [postId]: 'Failed to reject' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Helper function to determine if a URL is a video
  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // Helper function to get the full URL for media
  const getFullUrl = (url: string): string => {
    if (!url) return '';
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Use the proxy by just returning the path
    return url;
  };

  if (!posts || posts.length === 0) {
    return <p className="text-gray-500">No pending posts found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-4 shadow bg-white">
          {/* Display Post Thumbnail/Video */}
          <div className="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center overflow-hidden">
            {post.video_url ? (
              isVideo(post.video_url) ? (
                <video 
                  src={getFullUrl(post.video_url)} 
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img 
                  src={getFullUrl(post.video_url)} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              )
            ) : (
              <span className="text-gray-500">No media available</span>
            )}
          </div>
          
          <h3 className="font-semibold text-lg mb-1 truncate">{post.title || 'Untitled'}</h3>
          <p className="text-sm text-gray-600 mb-2 truncate">{post.description || 'No description'}</p>
          <p className="text-xs text-gray-500 mb-3">
            Category: {post.category_id || 'N/A'} | 
            User: {post.user?.username || 'Unknown'}
          </p>
          
          {/* Action Buttons */} 
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => handleApprove(post.id)}
              disabled={loadingStates[post.id]}
              className="flex-1 px-3 py-2 bg-blue text-white rounded hover:opacity-80 disabled:opacity-50 text-sm"
            >
              {loadingStates[post.id] ? 'Approving...' : 'Approve'}
            </button>
            <button 
              onClick={() => handleReject(post.id)}
              disabled={loadingStates[post.id]}
              className="flex-1 px-3 py-2 bg-red text-white rounded hover:opacity-80 disabled:opacity-50 text-sm"
            >
              {loadingStates[post.id] ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
          {errorStates[post.id] && (
            <p className="text-red-500 text-xs mt-2">{errorStates[post.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PendingPostsList; 