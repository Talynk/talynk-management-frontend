import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/overview/navbar";
import Navigation from "../components/overview/navigation";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiArrowDown,
  FiCopy,
  FiUser,
  FiSlash,
} from "react-icons/fi";
import {
  adminService,
  Post,
  DashboardStats,
} from "../api/services/adminService";
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { useLocation } from "react-router-dom";

interface VideoUser {
  id: string;
  username: string;
  email: string;
  status: string;
}

interface ExtendedPost extends Omit<Post, "status" | "user"> {
  status: "approved" | "pending" | "rejected";
  user: VideoUser | null;
}

// Add refresh interval constant at the top of the file
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const VideoManagement = () => {
  const [videos, setVideos] = useState<ExtendedPost[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<ExtendedPost[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ExtendedPost | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // For the freeze account confirmation dialog
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<VideoUser | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);

  // Add these new state variables and functions for post actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [postToReject, setPostToReject] = useState<ExtendedPost | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<ExtendedPost | null>(null);

  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch videos from different endpoints based on status and dashboard stats
        const [
          pendingVideosResponse,
          approvedVideosResponse,
          rejectedVideosResponse,
          statsResponse,
        ] = await Promise.all([
          adminService.getPendingPosts(),
          adminService.getAllApprovedPosts(),
          adminService.getRejectedPosts(),
          adminService.getDashboardStats(),
        ]);

        // Ensure we have arrays for all video types (handle potential null or undefined)
        const pendingVideos = pendingVideosResponse || [];
        const approvedVideos = approvedVideosResponse || [];
        const rejectedVideos = rejectedVideosResponse || [];

        // Map posts to ensure they have proper user objects that match VideoUser interface
        const mapPostToExtended = (
          post: Post,
          status: "approved" | "pending" | "rejected"
        ): ExtendedPost => ({
          ...post,
          status,
          user: post.user
            ? {
                id: post.user_id || "",
                username: post.user.username || "",
                email: post.user.email || "",
                status: "active", // Default status since it might not come from the API
              }
            : null,
        });

        // Combine all videos with a status property and mapped user
        const allVideos = [
          ...pendingVideos.map((video) => mapPostToExtended(video, "pending")),
          ...approvedVideos.map((video) =>
            mapPostToExtended(video, "approved")
          ),
          ...rejectedVideos.map((video) =>
            mapPostToExtended(video, "rejected")
          ),
        ];

        // Sort videos by likes to get trending videos
        const sortedByLikes = [...allVideos].sort(
          (a, b) => (b.likes || 0) - (a.likes || 0)
        );

        setVideos(allVideos);
        setTrendingVideos(sortedByLikes.slice(0, 5)); // Get top 5 trending videos
        setDashboardStats(statsResponse);

        // Select video by ID from navigation state if provided
        const postIdFromState = location.state && location.state.postId;
        if (postIdFromState) {
          const found = allVideos.find(v => v.id === postIdFromState);
          if (found) {
            setSelectedVideo(found);
          } else if (allVideos.length > 0) {
            setSelectedVideo(allVideos[0]);
          }
        } else if (allVideos.length > 0) {
          setSelectedVideo(allVideos[0]);
        }

        setError(null);
      } catch (err) {
        setError("Failed to fetch videos");
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  // Add auto-refresh effect after the fetchData effect
  useEffect(() => {
    // Set up an interval to refresh stats automatically
    const intervalId = setInterval(() => {
      refreshStats();
    }, REFRESH_INTERVAL);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Update the filter logic to prioritize exact ID matches and add status-based search
  const filteredVideos = videos.filter((video) => {
    // Check for exact ID match first (case insensitive)
    if (searchTerm && video.id?.toLowerCase() === searchTerm.toLowerCase()) {
      return true;
    }

    // Check for status-based search
    if (searchTerm && ['pending', 'approved', 'rejected'].includes(searchTerm.toLowerCase())) {
      const statusMatch = video.status?.toLowerCase() === searchTerm.toLowerCase();
      if (statusMatch) {
        return true;
      }
    }

    // Regular search for partial matches
    const matchesSearch =
      !searchTerm ||
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      tabValue === 0 || // All videos
      (tabValue === 1 && video.status === "approved") || // Approved
      (tabValue === 2 && video.status === "pending") || // Pending
      (tabValue === 3 && video.status === "rejected"); // Rejected

    const matchesFilter = filterStatus ? video.status === filterStatus : true;

    return matchesSearch && matchesTab && matchesFilter;
  });

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField as keyof ExtendedPost] ?? "";
    let bValue = b[sortField as keyof ExtendedPost] ?? "";

    // Handle date fields
    if (sortField === "createdAt") {
      aValue = new Date(a.createdAt || "").getTime();
      bValue = new Date(b.createdAt || "").getTime();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopyTooltip(id);
    setTimeout(() => {
      setCopyTooltip(null);
    }, 2000);
  };

  const handleSelectVideo = (video: ExtendedPost) => {
    setSelectedVideo(video);
  };

  const openFreezeDialog = (user: VideoUser | null) => {
    if (!user) return;
    setSelectedUser(user);
    setFreezeDialogOpen(true);
    setFreezeError(null);
  };

  // Add a refreshStats function to update dashboard stats
  const refreshStats = async () => {
    try {
      const statsResponse = await adminService.getDashboardStats();
      setDashboardStats(statsResponse);
    } catch (err) {
      console.error("Error refreshing stats:", err);
    }
  };

  // Update handleApprovePost to refresh stats after approval
  const handleApprovePost = async (post: ExtendedPost) => {
    try {
      setActionLoading(post.id);
      await adminService.updatePostStatus({
        id: post.id,
        status: "approved",
      });

      // Update the post status in the local state
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === post.id
            ? { ...video, status: "approved" as const }
            : video
        )
      );

      // Update selected video if it's the same one
      if (selectedVideo && selectedVideo.id === post.id) {
        setSelectedVideo({
          ...selectedVideo,
          status: "approved",
        });
      }

      // Re-sort trending videos if needed
      const updatedVideos = videos.map((video) =>
        video.id === post.id ? { ...video, status: "approved" as const } : video
      );
      const sortedByLikes = [...updatedVideos].sort(
        (a, b) => (b.likes || 0) - (a.likes || 0)
      );
      setTrendingVideos(sortedByLikes.slice(0, 5));

      // Refresh dashboard stats
      await refreshStats();
    } catch (err) {
      console.error("Error approving post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Open reject dialog
  const openRejectDialog = (post: ExtendedPost) => {
    setPostToReject(post);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // Update handleRejectPost to refresh stats after rejection
  const handleRejectPost = async () => {
    if (!postToReject) return;

    try {
      setActionLoading(postToReject.id);
      await adminService.updatePostStatus({
        id: postToReject.id,
        status: "rejected",
        rejectionReason: rejectReason,
      });

      // Update the post status in the local state
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === postToReject.id
            ? { ...video, status: "rejected" as const }
            : video
        )
      );

      // Update selected video if it's the same one
      if (selectedVideo && selectedVideo.id === postToReject.id) {
        setSelectedVideo({
          ...selectedVideo,
          status: "rejected",
        });
      }

      setRejectDialogOpen(false);
      setPostToReject(null);
      setRejectReason("");

      // Refresh dashboard stats
      await refreshStats();
    } catch (err) {
      console.error("Error rejecting post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (post: ExtendedPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  // Update handleDeletePost to refresh stats after deletion
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      setActionLoading(postToDelete.id);
      // Implement API call for deleting post
      // await adminService.deletePost(postToDelete.id);

      // Remove the post from the local state
      setVideos((prevVideos) =>
        prevVideos.filter((video) => video.id !== postToDelete.id)
      );

      // Update trending videos
      setTrendingVideos((prevTrending) =>
        prevTrending.filter((video) => video.id !== postToDelete.id)
      );

      // Update selected video if it's the one being deleted
      if (selectedVideo && selectedVideo.id === postToDelete.id) {
        if (videos.length > 1) {
          const newSelected = videos.find((v) => v.id !== postToDelete.id);
          if (newSelected) setSelectedVideo(newSelected);
        } else {
          setSelectedVideo(null);
        }
      }

      setDeleteDialogOpen(false);
      setPostToDelete(null);

      // Refresh dashboard stats
      await refreshStats();
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Update handleFreezeAccount to refresh stats after freeze/unfreeze
  const handleFreezeAccount = async () => {
    if (!selectedUser) return;

    setFreezeLoading(true);
    try {
      // Call the admin service to freeze/reactivate the account
      const newStatus = selectedUser.status === "active" ? "frozen" : "active";
      const result = await adminService.manageAccount({
        userId: selectedUser.id,
        action: newStatus === "active" ? "reactivate" : "freeze",
      });

      if ((result as any).status === "success") {
        // Update videos with updated user status
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video.user?.id === selectedUser.id
              ? { ...video, user: { ...video.user, status: newStatus } }
              : video
          )
        );

        // Update selected video if it's from the same user
        if (selectedVideo && selectedVideo.user?.id === selectedUser.id) {
          setSelectedVideo({
            ...selectedVideo,
            user: {
              ...selectedVideo.user,
              status: newStatus,
            },
          });
        }

        setFreezeDialogOpen(false);
        setSelectedUser(null);

        // Show success message (if you have a toast/notification system)
        console.log((result as any).message);

        // Refresh dashboard stats
        await refreshStats();
      } else {
        throw new Error((result as any).message || "Failed to update account status");
      }
    } catch (err) {
      setFreezeError(
        err instanceof Error
          ? err.message
          : "Failed to update account status. Please try again."
      );
      console.error("Error updating account status:", err);
    } finally {
      setFreezeLoading(false);
    }
  };

  // Helper function to determine if a URL is a video
  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // Add pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedVideos.slice(indexOfFirstPost, indexOfLastPost);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <Navigation />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
        {/* Left side - Scrollable section */}
        <div className="lg:w-1/3 lg:sticky lg:top-4 lg:self-start overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Dashboard Stats</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {dashboardStats?.approvedVideos?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Approved Videos</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-500 mb-1">
                  {dashboardStats?.pendingVideos?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Pending Videos</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-500 mb-1">
                  {dashboardStats?.rejectedVideos?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Rejected Videos</div>
              </div>
            </div>
          </div>
          {/* Selected Video Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {selectedVideo ? (
              <>
                <div className="relative pt-[56.25%] bg-gray-100">
                  {selectedVideo.video_url ? (
                    isVideo(selectedVideo.video_url) ? (
                      <video
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                        src={selectedVideo.video_url}
                        controls
                        preload="metadata"
                        poster="/video-poster.jpg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <img
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                        src={selectedVideo.video_url}
                        alt={selectedVideo.title}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 rounded-t-lg">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">No media available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Media type indicator */}
                  <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {isVideo(selectedVideo.video_url) ? 'VIDEO' : 'IMAGE'}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold">
                    {selectedVideo.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-2">
                    {selectedVideo.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">ID: </span>
                      <span className="text-xs font-mono bg-gray-100 p-1 rounded mx-1">
                        {selectedVideo.id?.substring(0, 10)}...
                      </span>
                      <button
                        onClick={() => handleCopyId(selectedVideo.id)}
                        className="text-blue-500 hover:text-blue-700 relative"
                        title="Copy unique traceability ID"
                      >
                        <FiCopy size={16} />
                        {copyTooltip === selectedVideo.id && (
                          <span className="absolute ml-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedVideo.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedVideo.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedVideo.status?.charAt(0).toUpperCase() +
                        selectedVideo.status?.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Views: {selectedVideo.views || 0}</span>
                    <span>Likes: {selectedVideo.likes || 0}</span>
                    <span>Shares: {selectedVideo.shares || 0}</span>
                  </div>
                </div>

                {/* User information */}
                {selectedVideo.user && (
                  <div className="border-t border-gray-200 p-4">
                    <h3 className="font-medium mb-2">User Information</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        {selectedVideo.user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {selectedVideo.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedVideo.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedVideo.user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedVideo.user.status === "active"
                          ? "Active"
                          : "Frozen"}
                      </span>
                      <button
                        onClick={() =>
                          selectedVideo.user &&
                          openFreezeDialog(selectedVideo.user)
                        }
                        className={`px-3 py-1 text-xs rounded text-white ${
                          selectedVideo.user.status === "active"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {selectedVideo.user.status === "active"
                          ? "Freeze Account"
                          : "Unfreeze Account"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No video selected
              </div>
            )}
          </div>
          {/* Trending Videos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Trending Videos</h3>
              <p className="text-xs text-gray-500 mt-1">Most popular content</p>
            </div>
            <div className="divide-y divide-gray-200">
              {trendingVideos.length > 0 ? (
                trendingVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {video.video_url ? (
                        isVideo(video.video_url) ? (
                          <video
                            src={video.video_url}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            preload="metadata"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <img
                            src={video.video_url}
                            alt={video.title}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        )
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                          No media
                        </div>
                      )}
                      
                      {/* Media type indicator */}
                      <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-[10px] px-1 py-0.5 rounded">
                        {isVideo(video.video_url) ? 'VID' : 'IMG'}
                      </div>
                      
                      {/* Status indicator */}
                      <div className="absolute bottom-1 right-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            video.status === "approved"
                              ? "bg-green-500"
                              : video.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate text-gray-800">
                        {video.title || 'Untitled'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {video.description || 'No description'}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-2 gap-3">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {video.views || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {video.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                          {video.shares || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium mb-2">No trending videos</p>
                  <p className="text-xs mt-1">Videos will appear here based on engagement</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right side - Main content */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Fixed header */}
          <div className="sticky top-0 bg-white z-10 pb-1">
            <div className="mb-4">
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                aria-label="video tabs"
              >
                <Tab label="All Videos" />
                <Tab label="Approved" />
                <Tab label="Pending" />
                <Tab label="Rejected" />
              </Tabs>
            </div>

            {/* Search and sort */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="w-full sm:w-auto flex-1">
                <div className="relative">
                  <div className="flex items-center bg-white border border-gray-300 rounded-full px-6 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                    <FiSearch className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ID, title, description, username, or status..."
                      className="bg-transparent outline-none pl-4 text-sm text-gray-700 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Clear search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Search suggestions */}
                  {searchTerm && searchTerm.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2 px-2">Quick filters:</div>
                        <button
                          onClick={() => { setSearchTerm('pending'); setShowFilterMenu(false); }}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Pending videos
                        </button>
                        <button
                          onClick={() => { setSearchTerm('approved'); setShowFilterMenu(false); }}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Approved videos
                        </button>
                        <button
                          onClick={() => { setSearchTerm('rejected'); setShowFilterMenu(false); }}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Rejected videos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                      !searchTerm ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({videos.length})
                  </button>
                  <button
                    onClick={() => setSearchTerm('pending')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                      searchTerm === 'pending' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pending ({videos.filter(v => v.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setSearchTerm('approved')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                      searchTerm === 'approved' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Approved ({videos.filter(v => v.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setSearchTerm('rejected')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${
                      searchTerm === 'rejected' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Rejected ({videos.filter(v => v.status === 'rejected').length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Results count */}
                <div className="text-sm text-gray-500 hidden sm:block bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-medium">{sortedVideos.length}</span> of <span className="font-medium">{videos.length}</span> videos
                </div>
                
                <div className="relative">
                  <button
                    className="flex items-center px-4 py-2 border rounded-full text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                  >
                    <FiArrowDown className="w-4 h-4 mr-2" />
                    Sort
                    <FiChevronDown className={`w-4 h-4 ml-1 text-gray-400 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                          onClick={() => {
                            handleSort("title");
                            setShowSortMenu(false);
                          }}
                        >
                          Title (A-Z)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                          onClick={() => {
                            handleSort("createdAt");
                            setShowSortMenu(false);
                          }}
                        >
                          Date (Newest First)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                          onClick={() => {
                            handleSort("views");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Views
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                          onClick={() => {
                            handleSort("likes");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Likes
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                          onClick={() => {
                            handleSort("shares");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Shares
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Scrollable video grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPosts.map((video) => (
                <div
                  key={video.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    selectedVideo?.id === video.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200"
                  } overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200`}
                  onClick={() => handleSelectVideo(video)}
                >
                  {/* Media Preview */}
                  <div className="relative h-48 bg-gray-100">
                    {video.video_url ? (
                      isVideo(video.video_url) ? (
                        <video
                          src={video.video_url}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          preload="metadata"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <img
                          src={video.video_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        <span className="text-sm">No media</span>
                      </div>
                    )}
                    
                    {/* Media type indicator */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {isVideo(video.video_url) ? 'VIDEO' : 'IMAGE'}
                    </div>
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          video.status === "approved"
                            ? "bg-green-500 text-white"
                            : video.status === "pending"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {video.status?.charAt(0).toUpperCase() +
                          video.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title and stats */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2">
                        {video.title || 'Untitled'}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {video.description || 'No description'}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {video.views || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {video.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                          {video.shares || 0}
                        </span>
                      </div>
                    </div>

                    {/* User info */}
                    {video.user && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {video.user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-800 truncate">
                            {video.user.username}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {video.user.email}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video ID */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">ID:</span>
                      <span className="text-xs font-mono bg-gray-200 p-1 rounded flex-1 mx-2 truncate">
                        {video.id?.substring(0, 8)}...
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyId(video.id);
                        }}
                        className="text-blue-500 hover:text-blue-700 relative flex-shrink-0"
                        title="Copy unique traceability ID"
                      >
                        <FiCopy size={12} />
                        {copyTooltip === video.id && (
                          <span className="absolute top-0 right-4 bg-gray-800 text-white text-xs rounded py-0.5 px-1 whitespace-nowrap text-[10px]">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {video.status === "pending" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprovePost(video);
                            }}
                            disabled={actionLoading === video.id}
                            className="w-full px-3 py-2 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center transition-colors"
                          >
                            {actionLoading === video.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                Processing...
                              </div>
                            ) : (
                              'Approve'
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRejectDialog(video);
                            }}
                            disabled={actionLoading === video.id}
                            className="w-full px-3 py-2 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {video.status === "rejected" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(video);
                          }}
                          disabled={actionLoading === video.id}
                          className="col-span-2 w-full px-3 py-2 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center transition-colors"
                        >
                          {actionLoading === video.id ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                              Processing...
                            </div>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      )}
                      {video.status === "approved" && (
                        <div className="col-span-2 text-center text-xs text-green-600 font-medium py-2">
                          ✓ Approved
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Pagination - Always visible */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 mt-4">
            <div className="flex items-center justify-between px-4">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * postsPerPage + 1, sortedVideos.length)} to {Math.min(currentPage * postsPerPage, sortedVideos.length)} of {sortedVideos.length} videos
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(sortedVideos.length / postsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(sortedVideos.length / postsPerPage);
                      return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <span className="px-2">...</span>
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedVideos.length / postsPerPage)))}
                  disabled={currentPage === Math.ceil(sortedVideos.length / postsPerPage)}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Freeze/Unfreeze Confirmation Dialog */}
      <Dialog
        open={freezeDialogOpen}
        onClose={() => setFreezeDialogOpen(false)}
      >
        <DialogTitle>
          {selectedUser?.status === "active"
            ? "Freeze Account"
            : "Unfreeze Account"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.status === "active"
              ? `Are you sure you want to freeze ${selectedUser?.username}'s account? This will prevent them from uploading new videos.`
              : `Are you sure you want to unfreeze ${selectedUser?.username}'s account? This will restore their ability to upload videos.`}
          </DialogContentText>
          {freezeError && (
            <div className="text-red-500 mt-2">{freezeError}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreezeDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleFreezeAccount}
            color="primary"
            disabled={freezeLoading}
            variant="contained"
            className={
              selectedUser?.status === "active" ? "bg-red-500" : "bg-green-500"
            }
          >
            {freezeLoading
              ? "Processing..."
              : selectedUser?.status === "active"
              ? "Freeze"
              : "Unfreeze"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
      >
        <DialogTitle>Reject Post</DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-4">
            Please provide a reason for rejecting this post.
          </DialogContentText>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleRejectPost}
            color="primary"
            disabled={actionLoading !== null || !rejectReason.trim()}
            variant="contained"
            className="bg-red-500"
          >
            {actionLoading !== null ? "Processing..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeletePost}
            color="primary"
            disabled={actionLoading !== null}
            variant="contained"
            className="bg-red-500"
          >
            {actionLoading !== null ? "Processing..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VideoManagement;
