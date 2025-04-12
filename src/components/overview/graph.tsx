import Videos from '../overview/Videos'
import Trending from './Trending';
import Pending from '@/Reusable/pending.tsx';
import { DashboardStats, Post } from '@/api/services/adminService'; // Import Post type
import PendingPostsList from './PendingPostsList'; // Import new component

// Independent StatCard component
const StatCard = ({ count, title, color = "text-green-300", textColor = "text-red-500" }: { 
  count: number, 
  title: string, 
  color?: string,
  textColor?: string 
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className={`text-5xl font-bold ${textColor} mb-2`}>
        {count.toLocaleString()}
      </div>
      <div className="text-gray-600">{title}</div>
      <div className="mt-4 h-12">
        <svg viewBox="0 0 100 30" className={`w-full h-full ${color} stroke-current`}>
          <path 
            d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
            fill="none" 
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export interface GraphProps {
  pendingPosts?: Post[];
  isLoadingPosts?: boolean;
  onPostUpdate?: (postId: string) => void;
  highlightedPostId?: string;
  error?: string | null;
  dashboardStats?: DashboardStats | null;
  isLoadingStats?: boolean;
}

const Graph: React.FC<GraphProps> = ({ 
  pendingPosts = [], 
  isLoadingPosts = false, 
  onPostUpdate = () => {}, 
  highlightedPostId,
  error,
  dashboardStats,
  isLoadingStats = false
}) => {
  return (
    <div className="w-full px-6">
      {/* Stats Cards for Videos */}
      {!isLoadingStats && dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard 
            count={dashboardStats.approvedVideos} 
            title="Approved Videos" 
            textColor="text-[#3B82F6]"
            color="text-[#DBEAFE]"
          />
          
          <StatCard 
            count={dashboardStats.pendingVideos} 
            title="Pending Videos" 
            textColor="text-[#F59E0B]"
            color="text-[#FEF3C7]"
          />
          
          <StatCard 
            count={dashboardStats.rejectedVideos} 
            title="Rejected Videos" 
            textColor="text-[#EF4444]"
            color="text-[#FEE2E2]"
          />
        </div>
      )}

      {/* Loading state for stats */}
      {isLoadingStats && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Render Pending Posts List */} 
      {pendingPosts && pendingPosts.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Posts for Approval</h2>
          <PendingPostsList 
            posts={pendingPosts} 
            onPostUpdate={onPostUpdate} 
            highlightedPostId={highlightedPostId}
          />
        </div>
      ) : isLoadingPosts ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Posts for Approval</h2>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Posts for Approval</h2>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No pending posts to approve</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Graph;