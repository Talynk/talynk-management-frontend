import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar"
import Sidebar from "@/components/overview/sidebar"
import Cards from "../components/Cards"
import { data as originalData } from "../data"
import Pending from "@/Reusable/pending"
import Videos from '../components/overview/Videos'
import { adminService, Post as AdminPost } from '@/api/services/adminService'
import { approverService } from '@/api/services/approverService'
import { CircularProgress } from "@mui/material";
import { Alert, Snackbar } from "@mui/material";
import { IoCheckmarkCircle } from 'react-icons/io5';
import Navigation from './navigation';
import LogoutButton from "../components/auth/LogoutButton";

// Add refresh interval constant
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

// Define a type for our stats cards that includes the required image property for CardItem
interface StatCard {
    id: number;
    text: string;
    count: number | string;
    color?: string;
    image: string; // Make sure this is required to match CardItem
}

// Create a local interface for approver stats to be used in this component
interface ApproverDashboardStats {
    pendingVideos: number;
    approvedVideos: number;
    rejectedVideos: number;
    todayVideos: number;
}

// Use the Post type from approverService
interface ApproverPost {
    id: string;
    title: string;
    description: string;
    video_url: string;
    status: 'pending' | 'approved' | 'rejected';
    user_id: string;
    user: {
        username: string;
        email: string;
    };
    approver_id: string | null;
    admin_id: string | null;
    approved_at: string | null;
    unique_traceability_id: string | null;
    views: number;
    likes: number;
    shares: number;
    category_id: number;
    createdAt: string;
    updatedAt: string;
}

const Home = () => {
    const [pendingPosts, setPendingPosts] = useState<ApproverPost[]>([]);
    const [stats, setStats] = useState<ApproverDashboardStats | null>(null);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
    const [actionLoading, setActionLoading] = useState<{ [postId: string]: boolean }>({});
    
    // Fetch data function with useCallback for memoization
    const fetchData = useCallback(async () => {
        try {
            setIsLoadingPosts(true);
            setIsLoadingStats(true);
            setError(null);
            
            // Fetch pending posts from approverService
            const postsResponse = await approverService.getPendingPosts();
            
            if (postsResponse && Array.isArray(postsResponse)) {
                // Type the posts correctly
                setPendingPosts(postsResponse);
                
                // Show notification if there are new pending posts
                if (postsResponse.length > 0 && pendingPosts.length < postsResponse.length) {
                    setSnackbarMessage(`${postsResponse.length} pending videos to review`);
                    setSnackbarSeverity("info");
                    setSnackbarOpen(true);
                }
            } else {
                console.error("Invalid posts response format");
            }
            
            // Fetch stats from approverService
            const statsResponse = await approverService.getApproverStats();
            if (statsResponse) {
                // Convert the API response to our dashboard stats format
                setStats({
                    pendingVideos: statsResponse.pendingCount,
                    approvedVideos: statsResponse.approvedCount,
                    rejectedVideos: statsResponse.rejectedCount,
                    todayVideos: statsResponse.todayCount
                });
            }
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
            const errorMessage = (err instanceof Error) ? err.message : "Failed to fetch data. Please try again.";
            setError(errorMessage);
            
            if (errorMessage.includes("Authentication required")) {
                setSnackbarMessage("Authentication error. Please log in again.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } finally {
            setIsLoadingPosts(false);
            setIsLoadingStats(false);
        }
    }, [pendingPosts.length]);

    // Handler for when a post is selected from the sidebar
    const handleSelectPost = (post: AdminPost) => {
        console.log("Selected post in Approvers Portal:", post.id);
        
        // Find if the post is in pending posts
        const pendingPost = pendingPosts.find(p => p.id === post.id);
        if (pendingPost) {
            // Scroll to the post
            const postElement = document.getElementById(`post-${post.id}`);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth' });
                
                // Highlight the post
                postElement.classList.add('highlight-post');
                setTimeout(() => {
                    postElement.classList.remove('highlight-post');
                }, 2000);
            }
        } else {
            setSnackbarMessage("This post is not in your pending list");
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
        }
    };
    
    // Handler for post approval/rejection
    const handlePostUpdate = async (postId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
        try {
            setActionLoading(prev => ({ ...prev, [postId]: true }));
            setSnackbarMessage(`Processing ${status} request...`);
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
            
            if (status === 'approved') {
                await approverService.approvePost(postId);
            } else {
                await approverService.rejectPost(postId, rejectionReason);
            }
            
            // Remove the post from the pending list
            setPendingPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            
            // Refresh stats to reflect the changes
            await refreshStats();
            
            // Show success message
            setSnackbarMessage(`Post ${status} successfully`);
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err: unknown) {
            console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} post:`, err);
            const errorMessage = (err instanceof Error) ? err.message : "Failed to update post";
            setSnackbarMessage(`Error: ${errorMessage}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: false }));
        }
    };

    // Handler for approve button click
    const handleApprove = async (postId: string) => {
        await handlePostUpdate(postId, 'approved');
    };

    // Handler for reject button click
    const handleReject = async (postId: string) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return; // User cancelled
        if (!reason.trim()) {
            alert('Rejection reason cannot be empty.');
            return;
        }
        await handlePostUpdate(postId, 'rejected', reason);
    };
    
    // Add a refreshStats function to update only dashboard stats
    const refreshStats = async () => {
        try {
            const statsResponse = await approverService.getApproverStats();
            if (statsResponse) {
                setStats({
                    pendingVideos: statsResponse.pendingCount,
                    approvedVideos: statsResponse.approvedCount,
                    rejectedVideos: statsResponse.rejectedCount,
                    todayVideos: statsResponse.todayCount
                });
            }
        } catch (err) {
            console.error('Error refreshing stats:', err);
        }
    };

    // Initial data load 
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Add auto-refresh effect for periodic updates
    useEffect(() => {
        // Set up an interval to refresh data automatically
        const intervalId = setInterval(() => {
            fetchData();
        }, REFRESH_INTERVAL);

        // Clean up the interval when component unmounts
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // Helper function to determine if a URL is a video
    const isVideo = (url: string): boolean => {
        if (!url) return false;
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    };

    return (
        <div className="container mx-auto p-4">
            {/* Talynk Logo */}
            <div className="flex justify-between items-center mb-4">
                <div></div> {/* Empty div for spacing */}
                <div className="flex items-center gap-2">
                    <IoCheckmarkCircle className="h-6 w-6 text-[#004896]" />
                    <h2 className="text-[#004896] font-bold text-xl">Talynk</h2>
                </div>
                <LogoutButton variant="icon" />
            </div>
            
            {/* Navigation component */}
            <div className="mb-8">
                <Navigation removeTab="User Management" />
            </div>
            
            {/* Layout with sidebar and main content */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="lg:w-1/3">
                    <Sidebar onSelectPost={handleSelectPost} />
                </div>
                
                {/* Main content */}
                <div className="lg:w-2/3">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Welcome, <span className="text-blue-600 font-bold">Approver</span></h1>
                        <p className="text-gray-600">You have {pendingPosts.length} pending posts to review</p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isLoadingStats ? (
                            <div className="flex justify-center items-center h-32 col-span-4">
                                <CircularProgress />
                            </div>
                        ) : stats ? (
                            <>
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#FFC107] mb-2">
                                        {stats.pendingVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Pending Videos</div>
                                </div>
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#4CAF50] mb-2">
                                        {stats.approvedVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Approved Videos</div>
                                </div>
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#F44336] mb-2">
                                        {stats.rejectedVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Rejected Videos</div>
                                </div>
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#2196F3] mb-2">
                                        {stats.todayVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Today's Reviews</div>
                                </div>
                            </>
                        ) : null}
                    </div>
                    
                    {/* Pending Posts Section */}
                        <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
                        {isLoadingPosts ? (
                            <div className="flex justify-center items-center h-64">
                                <CircularProgress />
                            </div>
                        ) : error ? (
                            <div className="text-center p-8">
                                <Alert severity="error" className="mb-4">{error}</Alert>
                                <button 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={() => fetchData()}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : pendingPosts && pendingPosts.length > 0 ? (
                            <div id="pending-posts-container">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                    {pendingPosts.filter(post => post.status === 'pending').map(post => (
                                        <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-lg shadow p-4 border border-gray-200 transition-all duration-300 hover:shadow-md">
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{post.title}</h3>
                                                    <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <span className="inline-flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                                                        </svg>
                                                        {post.user?.username || "Unknown user"}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-4 line-clamp-3">{post.description || 'No description provided.'}</p>
                                                {post.video_url && (
                                                    <div className="mb-4 rounded-lg overflow-hidden flex-grow">
                                                        {isVideo(post.video_url) ? (
                                                            <video 
                                                                src={`${post.video_url}`}
                                                                className="w-full h-48 object-cover bg-gray-100" 
                                                                controls
                                                                poster="/src/assets/video-placeholder.jpg"
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={`${post.video_url}`}
                                                                alt={post.title} 
                                                                className="w-full h-48 object-cover bg-gray-100"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/placeholder.svg';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleApprove(post.id)}
                                                        disabled={actionLoading[post.id]}
                                                        className="flex-1 px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] disabled:opacity-50 text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                                                    >
                                                        {actionLoading[post.id] ? (
                                                            <div className="flex items-center">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                Approving...
                                                            </div>
                                                        ) : (
                                                            'Approve'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(post.id)}
                                                        disabled={actionLoading[post.id]}
                                                        className="flex-1 px-4 py-2 bg-[#F44336] text-white rounded-md hover:bg-[#da190b] disabled:opacity-50 text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                                                    >
                                                        {actionLoading[post.id] ? (
                                                            <div className="flex items-center">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                Rejecting...
                                                            </div>
                                                        ) : (
                                                            'Reject'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-gray-500">
                                <img 
                                    src="/src/assets/no-data.svg" 
                                    alt="No pending posts" 
                                    className="w-32 h-32 mx-auto mb-4 opacity-50"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <p className="text-xl font-medium">No pending posts to review at this time.</p>
                                <p className="mt-2">All caught up! Check back later for new submissions.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            
            {/* Add CSS for post highlight effect */}
            <style>{`
                .highlight-post {
                    animation: highlight 2s ease-in-out;
                }
                
                @keyframes highlight {
                    0% { box-shadow: 0 0 0 0 rgba(0, 111, 253, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 111, 253, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 111, 253, 0); }
                }
                
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}

export default Home