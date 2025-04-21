import React, { useEffect, useState } from "react";
// import Navbar from "../components/overview/navbar";
import Navigation from "../components/overview/navigation";
import {
  FiSearch,
  // FiFilter,
  FiChevronDown,
  FiArrowDown,
  FiCopy,
  FiPlus,
  // FiUser,
  // FiSlash,
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
import thumbnail from "../assets/thumb1.jpg";

interface VideoUser {
  id: string;
  username: string;
  email: string;
  status: string;
}

interface ExtendedPost extends Omit<Post, "status"> {
  status: "approved" | "pending" | "rejected";
  user: VideoUser | null;
}

// Add refresh interval constant at the top of the file
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const VideoManagement = () => {
  const [videos, setVideos] = useState<ExtendedPost[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<ExtendedPost[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ExtendedPost | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Set the first video as selected if available
        if (allVideos.length > 0) {
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
  }, []);

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
  const handleTabChange = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setTabValue(newValue);
  };

  // Update the filter logic to prioritize exact ID matches
  const filteredVideos = videos.filter((video) => {
    // Check for exact ID match first (case insensitive)
    if (searchTerm && video.id?.toLowerCase() === searchTerm.toLowerCase()) {
      return true;
    }

    // Regular search for partial matches
    const matchesSearch =
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      if (result.status === "success") {
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
        console.log(result.message);

        // Refresh dashboard stats
        await refreshStats();
      } else {
        throw new Error(result.message || "Failed to update account status");
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
      {/* Navigation */}
      <div className="mb-8">
        <Navigation />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-blue-500 mb-2">
            {dashboardStats?.approvedVideos.toLocaleString() || "0"}
          </div>
          <div className="text-gray-600">Approved Videos</div>
          <div className="mt-4 h-12">
            <svg
              viewBox="0 0 100 30"
              className="w-full h-full text-blue-300 stroke-current"
            >
              <path
                d="M 0,15 Q 25,5 50,20 T 100,15"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-yellow-500 mb-2">
            {dashboardStats?.pendingVideos.toLocaleString() || "0"}
          </div>
          <div className="text-gray-600">Pending Videos</div>
          <div className="mt-4 h-12">
            <svg
              viewBox="0 0 100 30"
              className="w-full h-full text-yellow-300 stroke-current"
            >
              <path
                d="M 0,20 Q 20,15 40,20 T 70,10 T 100,15"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-red-500 mb-2">
            {dashboardStats?.rejectedVideos.toLocaleString() || "0"}
          </div>
          <div className="text-gray-600">Rejected Videos</div>
          <div className="mt-4 h-12">
            <svg
              viewBox="0 0 100 30"
              className="w-full h-full text-red-300 stroke-current"
            >
              <path
                d="M 0,15 Q 30,25 60,10 T 100,15"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Video Management</h1>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
        {/* Left side - Video details and user info - Static */}
        <div className="lg:w-1/3 lg:sticky lg:top-4 lg:self-start overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {selectedVideo ? (
              <>
                <div className="relative pt-[56.25%] bg-gray-100">
                  {selectedVideo.video_url ? (
                    <video
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      src={selectedVideo.video_url}
                      controls
                      poster={thumbnail}
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                      No video available
                    </div>
                  )}
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
              <h3 className="font-bold">Trending Videos</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {trendingVideos.length > 0 ? (
                trendingVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {video.video_url ? (
                        <img
                          src={thumbnail}
                          alt={video.title}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {video.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {video.views || 0}
                        </span>
                        <span className="flex items-center ml-2">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {video.likes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No trending videos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Videos list with fixed header and scrollable content */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Fixed header with tabs and search - sticky */}
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
                <div className="flex items-center bg-gray-100 rounded-full px-6 py-2 shadow-sm">
                  <FiSearch className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by video ID, title, or user"
                    className="bg-transparent outline-none pl-4 text-sm text-gray-700 w-full"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="flex items-center px-3 py-2 border rounded-full text-gray-700 border-gray-300 hover:bg-gray-100"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                  >
                    <FiArrowDown className="w-4 h-4 mr-2" />
                    Sort
                    <FiChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("title");
                            setShowSortMenu(false);
                          }}
                        >
                          Title (A-Z)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("createdAt");
                            setShowSortMenu(false);
                          }}
                        >
                          Date (Newest First)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("views");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Views
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("likes");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Likes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable video grid */}
          <div className="overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sortedVideos.length > 0 ? (
                sortedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`bg-white rounded-lg shadow-sm border ${
                      selectedVideo?.id === video.id
                        ? "border-blue-500"
                        : "border-gray-200"
                    } overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="relative pt-[40%] bg-gray-100">
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                        {/* Placeholder duration */}
                        0:30
                      </div>
                    </div>
                    <div className="p-1.5">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xs font-medium line-clamp-1">
                          {video.title}
                        </h3>
                        <span
                          className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            video.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : video.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {video.status?.charAt(0).toUpperCase() +
                            video.status?.slice(1)}
                        </span>
                      </div>

                      {/* Display video ID with copy button */}
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">ID:</span>
                        <span className="text-xs font-mono bg-gray-100 p-0.5 rounded mx-1 flex-grow truncate">
                          {video.id?.substring(0, 6)}...
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

                      {/* Add action buttons based on post status */}
                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-1">
                        {video.status === "pending" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprovePost(video);
                              }}
                              disabled={actionLoading === video.id}
                              className="w-full px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
                            >
                              {actionLoading === video.id
                                ? "Processing..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectDialog(video);
                              }}
                              disabled={actionLoading === video.id}
                              className="w-full px-3 py-2 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
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
                            className="col-span-2 w-full px-3 py-2 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                          >
                            {actionLoading === video.id
                              ? "Processing..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
                  No videos found matching your criteria
                </div>
              )}
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
