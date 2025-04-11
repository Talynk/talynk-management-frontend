import Sidebar from './sidebar';
import Videos from '../overview/Videos'
import Trending from './Trending';
import Pending from '@/Reusable/pending.tsx';
import { DashboardStats, Post } from '@/api/services/adminService'; // Import Post type
import PendingPostsList from './PendingPostsList'; // Import new component

// Independent StatCard component
const StatCard = ({ count, title, color = "text-green-300" }: { count: number, title: string, color?: string }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="text-5xl font-bold text-red-500 mb-2">
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

interface GraphProps {
  // dashboardStats: DashboardStats | null;
  pendingPosts: Post[]; // Add pendingPosts prop
  isLoadingStats: boolean; // Rename isLoading to be specific
  isLoadingPosts: boolean; // Add loading state for posts
  error: string | null;
  onPostUpdate: (postId: string) => void; // Add handler prop
}

const Graph: React.FC<GraphProps> = ({ 
  // dashboardStats, 
  pendingPosts, 
  // isLoadingStats, 
  isLoadingPosts,
  error, 
  onPostUpdate 
}) => {
  return (
    <div className="flex justify-between px-6">
      <div className="w-full lg:w-2/3">

        {/* Render Pending Posts List */} 
        <div className="mt-8"> {/* Add margin top */} 
          <h2 className="text-xl font-semibold mb-4">Pending Videos</h2>
          {isLoadingPosts && <p>Loading posts...</p>}
          {error && !isLoadingPosts && <p className="text-red-500">Error loading posts: {error}</p>}
          {!isLoadingPosts && !error && (
            <PendingPostsList 
              posts={pendingPosts} 
              onPostUpdate={onPostUpdate} // Pass handler down
            />
          )}
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/3"> {/* Adjust width and visibility */}
        <Sidebar />
      </div>
    </div>
  );
};

export default Graph;