import React, { useState, useEffect, useCallback } from "react";
import Graph from "../components/overview/graph";
import Navbar from "../components/overview/navbar";
import { adminService } from "@/api/services/adminService"; // Adjust path if necessary
import type {
  DashboardStats,
  Post,
  UserStats,
} from "@/api/services/adminService"; // Import Post type and UserStats
import Navigation from "../components/overview/navigation";
import Sidebar from "../components/overview/sidebar";
import { IoCheckmarkCircle } from "react-icons/io5";

const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const Home = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null); // Add user stats
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]); // State for pending posts
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true); // Loading state for posts
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Use useCallback to memoize the fetchData function
  const fetchData = useCallback(async () => {
    try {
      setLoadingStats(true);
      setLoadingPosts(true);
      setError(null);

      // Fetch stats, user stats, and posts concurrently
      const [fetchedStats, fetchedUserStats, fetchedPosts] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserStats().then((res) => res.data),
        adminService.getPendingPosts(),
      ]);

      setStats(fetchedStats);
      setUserStats(fetchedUserStats);
      setPendingPosts(fetchedPosts);

      console.log("Dashboard stats:", fetchedStats); // Log stats structure to debug
      console.log("User stats:", fetchedUserStats); // Log user stats structure to debug
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoadingStats(false);
      setLoadingPosts(false);
    }
  }, []);

  // Function to update posts list and refresh stats after approval/rejection
  const handlePostUpdate = async (postId: string) => {
    // Remove the post from the list immediately for better UX
    setPendingPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );

    // Refresh the stats to update the counts
    try {
      const [updatedStats, updatedUserStats] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserStats().then((res) => res.data),
      ]);
      setStats(updatedStats);
      setUserStats(updatedUserStats);
    } catch (err) {
      console.error("Error refreshing stats:", err);
    }
  };

  // Handler for when a post is selected from the sidebar
  const handleSelectPost = (post: Post) => {
    setSelectedPost(post);
    // If the post is pending, you might want to scroll to it in the pending posts list
    // or highlight it in some way
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up periodic refresh of data
  useEffect(() => {
    // Set up an interval to refresh data automatically
    const intervalId = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <div className="container mx-auto p-4">
      {/* Talynk Logo */}
      <div className="flex justify-between items-center mb-4">
        <div></div> {/* Empty div for spacing */}
        <div className="flex items-center gap-2">
          <IoCheckmarkCircle className="h-6 w-6 text-[#004896]" />
          <h2 className="text-[#004896] font-bold text-xl">Talynk</h2>
        </div>
      </div>

      {/* Add Navigation component */}
      <div className="mb-8">
        <Navigation />
      </div>

      {/* Layout with sidebar and main content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/3">
          <Sidebar onSelectPost={handleSelectPost} />
        </div>

        {/* Main content */}
        <div className="lg:w-2/3">
          {/* Stats Cards for Users */}
          {!loadingStats && userStats && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="text-5xl font-bold text-[#DC2626] mb-2">
                  {stats.totalUsers.toLocaleString() || "0"}
                </div>
                <div className="text-gray-600">Total Users</div>
                <div className="mt-4 h-12">
                  <svg
                    viewBox="0 0 100 30"
                    className="w-full h-full text-[#FECACA] stroke-current"
                  >
                    <path
                      d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="text-5xl font-bold text-[#10B981] mb-2">
                  {stats.activeUsers.toLocaleString() || "0"}
                </div>
                <div className="text-gray-600">Active Users</div>
                <div className="mt-4 h-12">
                  <svg
                    viewBox="0 0 100 30"
                    className="w-full h-full text-[#A7F3D0] stroke-current"
                  >
                    <path
                      d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="text-5xl font-bold text-[#EF4444] mb-2">
                  {stats.frozenUsers.toLocaleString() || "0"}
                </div>
                <div className="text-gray-600">Frozen Users</div>
                <div className="mt-4 h-12">
                  <svg
                    viewBox="0 0 100 30"
                    className="w-full h-full text-[#FEE2E2] stroke-current"
                  >
                    <path
                      d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Show loading state for stats */}
          {loadingStats && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Show error if any */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="pt-5">
            <Graph
              pendingPosts={pendingPosts}
              isLoadingPosts={loadingPosts}
              error={error}
              onPostUpdate={handlePostUpdate}
              highlightedPostId={selectedPost?.id}
              dashboardStats={stats}
              isLoadingStats={loadingStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
