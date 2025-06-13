import { useEffect, useState, useCallback } from 'react';
import { approverService, Post as ApproverPostType } from '@/api/services/approverService';
import { CircularProgress, Alert } from '@mui/material';
import Navbar from './Navbar'
import Header from '@/Reusable/Header'
import Tab from '@/Reusable/tab';
import Videos from '../components/overview/Videos'
import { FiUser, FiClock, FiEye, FiThumbsUp, FiShare2 } from 'react-icons/fi';

const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const PendingApprovals = () => {
  const [pendingPosts, setPendingPosts] = useState<ApproverPostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPendingPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const posts = await approverService.getPendingPosts();
      setPendingPosts(posts.filter(post => post.status === 'pending'));
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred";
      setError(`Failed to fetch pending posts: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPosts();
  }, [fetchPendingPosts]);

  const handleApprove = async (postId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await approverService.approvePost(postId);
      await fetchPendingPosts();
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred";
      setActionError(`Failed to approve post: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (postId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Rejection reason cannot be empty.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await approverService.rejectPost(postId, reason);
      await fetchPendingPosts();
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred";
      setActionError(`Failed to reject post: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to determine if a URL is a video
  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  return (
    <div>
      <Navbar />
      <div className="px-9 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Approvals</h1>
        <p className="text-gray-600 text-lg mb-8">You have {pendingPosts.length} videos awaiting your review.</p>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        ) : error ? (
          <Alert severity="error" className="mb-4">{error}</Alert>
        ) : pendingPosts.length === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            <img 
              src="/src/assets/no-data.svg" 
              alt="No pending posts" 
              className="w-32 h-32 mx-auto mb-4 opacity-50"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <p className="text-xl font-medium">No pending videos to review at this time.</p>
            <p className="mt-2">All caught up! Check back later for new submissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPosts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 transition-all duration-300 hover:shadow-md flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{post.title}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full flex-shrink-0 ml-2">
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                  <span className="inline-flex items-center">
                    <FiUser className="w-4 h-4 mr-1" />
                    {post.user?.username || 'Unknown user'}
                  </span>
                  <span className="inline-flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    {timeAgo(post.createdAt)}
                  </span>
                </div>
                {post.category?.name && (
                  <div className="text-xs text-gray-600 mb-3">
                    Category: <span className="font-medium">{post.category.name}</span>
                  </div>
                )}
                <p className="text-gray-600 mb-4 line-clamp-3">{post.description || 'No description provided.'}</p>
                {post.video_url && (
                  <div className="mb-4 rounded-lg overflow-hidden flex-grow flex items-center justify-center bg-gray-100">
                    {isVideo(post.video_url) ? (
                      <video 
                        src={`${post.video_url}`}
                        className="w-full h-full object-cover" 
                        controls
                        poster="/src/assets/video-placeholder.jpg"
                      />
                    ) : (
                      <img 
                        src={`${post.video_url}`}
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    )}
                  </div>
                )}
                
                {(post.views !== undefined || post.likes !== undefined || post.shares !== undefined) && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    {post.views !== undefined && (
                      <span className="inline-flex items-center"><FiEye className="mr-1" /> {post.views}</span>
                    )}
                    {post.likes !== undefined && (
                      <span className="inline-flex items-center"><FiThumbsUp className="mr-1" /> {post.likes}</span>
                    )}
                    {post.shares !== undefined && (
                      <span className="inline-flex items-center"><FiShare2 className="mr-1" /> {post.shares}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(post.id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB] disabled:opacity-50 text-base font-semibold transition-colors duration-200"
                  >
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(post.id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md hover:bg-[#DC2626] disabled:opacity-50 text-base font-semibold transition-colors duration-200"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
                {actionError && <p className="text-red-500 text-xs mt-2">{actionError}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals
