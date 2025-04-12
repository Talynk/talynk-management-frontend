import React, { useState } from 'react';
import { Post } from '@/api/services/adminService'; // Import Post type
import { adminService } from '@/api/services/adminService'; // For calling approve/reject

interface PendingPostsListProps {
  posts: Post[];
  onPostUpdate: (postId: string) => void; // Callback to update parent state
  highlightedPostId?: string; // Add prop for highlighted post
}

const PendingPostsList: React.FC<PendingPostsListProps> = ({ posts, onPostUpdate, highlightedPostId }) => {
  const [loadingStates, setLoadingStates] = useState<{ [postId: string]: boolean }>({});
  const [errorStates, setErrorStates] = useState<{ [postId: string]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6; // Show 6 posts per page (2 rows of 3)

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

  // Pagination calculations
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPosts.map((post) => (
          <div 
            key={post.id} 
            className={`border rounded-lg p-4 shadow bg-white ${highlightedPostId === post.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          >
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
                className="flex-1 px-3 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] disabled:opacity-50 text-sm"
              >
                {loadingStates[post.id] ? 'Approving...' : 'Approve'}
              </button>
              <button 
                onClick={() => handleReject(post.id)}
                disabled={loadingStates[post.id]}
                className="flex-1 px-3 py-2 bg-[#EF4444] text-white rounded hover:bg-[#DC2626] disabled:opacity-50 text-sm"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-4 py-2 border-t border-b border-gray-300 text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-[#004896] text-white border-[#004896]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Post count info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, posts.length)} of {posts.length} pending posts
      </div>
    </div>
  );
};

export default PendingPostsList; 