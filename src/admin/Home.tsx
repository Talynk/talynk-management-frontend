import React, { useState, useEffect, useCallback } from 'react';
import Graph from "../components/overview/graph";
import Navbar from "../components/overview/navbar";
import { adminService } from '@/api/services/adminService'; // Adjust path if necessary
import type { DashboardStats, Post, UserStats } from '@/api/services/adminService'; // Import Post type and UserStats
import Navigation from '../components/overview/navigation';

const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const Home = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null); // Add user stats
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]); // State for pending posts
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true); // Loading state for posts
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the fetchData function
  const fetchData = useCallback(async () => {
    try {
      setLoadingStats(true);
      setLoadingPosts(true);
      setError(null);

      // Fetch stats, user stats, and posts concurrently
      const [fetchedStats, fetchedUserStats, fetchedPosts] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserStats().then(res => res.data),
        adminService.getPendingPosts()
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
    setPendingPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
    
    // Refresh the stats to update the counts
    try {
      const [updatedStats, updatedUserStats] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserStats().then(res => res.data)
      ]);
      setStats(updatedStats);
      setUserStats(updatedUserStats);
    } catch (err) {
      console.error("Error refreshing stats:", err);
    }
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
      {/* Add Navigation component */}
      <div className="mb-8">
        <Navigation />
      </div>
      
      {/* Stats Cards */}
      {!loadingStats && userStats && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-5xl font-bold text-red-500 mb-2">
              {stats.totalUsers.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Total Users</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-green-300 stroke-current">
                <path 
                  d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                  fill="none" 
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-5xl font-bold text-green-500 mb-2">
              {stats.activeUsers.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Active Users</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-green-300 stroke-current">
                <path 
                  d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                  fill="none" 
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-5xl font-bold text-red-500 mb-2">
              {stats.frozenUsers.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Frozen Users</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-red-300 stroke-current">
                <path 
                  d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                  fill="none" 
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-5xl font-bold text-blue-500 mb-2">
              {stats.approvedVideos.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Approved Videos</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-blue-300 stroke-current">
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
              {stats.pendingVideos.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Pending Videos</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-yellow-300 stroke-current">
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
              {stats.rejectedVideos.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">Rejected Videos</div>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 30" className="w-full h-full text-red-300 stroke-current">
                <path 
                  d="M 0,15 Q 30,25 60,10 T 100,15" 
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
          // dashboardStats={stats}
          pendingPosts={pendingPosts}
          isLoadingStats={loadingStats}
          isLoadingPosts={loadingPosts}
          error={error}
          onPostUpdate={handlePostUpdate}
        />
      </div>
    </div>
  );
};

export default Home;



