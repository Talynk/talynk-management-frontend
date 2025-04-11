import React, { useEffect, useState, useCallback } from 'react';
import Tab from '../Reusable/tab'
import BlackCard from '../components/user/BlackCard'
import Cards from "../components/Cards";
import Navbar from "../components/overview/navbar";
import { FiSearch, FiFilter, FiChevronDown, FiArrowDown, FiCopy, FiUser, FiSlash } from "react-icons/fi"
import { data as originalData } from "../data";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Tabs, Tab as MuiTab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { adminService, User, UsersResponse, UserStats, DashboardStats } from '../api/services/adminService';
import Navigation from '../components/overview/navigation';

import Page from '../app/payments/page'

interface ApiResponse {
  status: string;
  data: {
    users: User[];
  };
}

interface ExtendedUser extends User {
  // No need for additional fields as they're now included in the User interface
}

// User profile modal interface 
interface UserProfileProps {
  user: ExtendedUser | null;
  open: boolean;
  onClose: () => void;
}

// User profile component
const UserProfile: React.FC<UserProfileProps> = ({ user, open, onClose }) => {
  if (!user) return null;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="bg-blue-500 text-white">
        User Profile: {user.username}
      </DialogTitle>
      <DialogContent className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">User ID:</div>
                <div className="text-sm text-gray-900 font-medium flex items-center">
                  {user.id}
                  <button 
                    onClick={() => navigator.clipboard.writeText(user.id)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">Username:</div>
                <div className="text-sm text-gray-900 font-medium">{user.username}</div>
                
                <div className="text-sm text-gray-500">Email:</div>
                <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                
                <div className="text-sm text-gray-500">Status:</div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Active' : 'Frozen'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500">Created:</div>
                <div className="text-sm text-gray-900 font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Post Statistics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-500">Approved Posts:</div>
                <div className="text-sm text-gray-900 font-medium text-green-600">
                  {user.postsApproved}
                </div>
                
                <div className="text-sm text-gray-500">Pending Posts:</div>
                <div className="text-sm text-gray-900 font-medium text-yellow-600">
                  {user.postsPending}
                </div>
                
                <div className="text-sm text-gray-500">Total Posts:</div>
                <div className="text-sm text-gray-900 font-medium">
                  {user.postsApproved + user.postsPending}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Actions</h3>
              <div className="flex gap-2">
                <Button 
                  variant="contained" 
                  color={user.status === 'active' ? 'error' : 'success'}
                  className={user.status === 'active' ? 'bg-red-500' : 'bg-green-500'}
                >
                  {user.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'}
                </Button>
                
                <Button variant="outlined" color="primary">
                  View All Posts
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add refresh interval constant at the top of the file
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // For the freeze account confirmation dialog
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);
  
  // User profile view
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<ExtendedUser | null>(null);

  // Refactor fetchData to use useCallback for memoization
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch users and dashboard stats in parallel
      const [usersResponse, dashboardStatsResponse] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getDashboardStats()
      ]);
      
      if (usersResponse?.data?.users && Array.isArray(usersResponse.data.users)) {
        // Use the actual user data from the API, including post counts
        setUsers(usersResponse.data.users);
      } else {
        throw new Error("Invalid users response format");
      }
      
      // Set dashboard stats
      setDashboardStats(dashboardStatsResponse);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a refreshStats function to update only dashboard stats
  const refreshStats = async () => {
    try {
      const statsResponse = await adminService.getDashboardStats();
      setDashboardStats(statsResponse);
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
    // Set up an interval to refresh stats automatically
    const intervalId = setInterval(() => {
      refreshStats();
    }, REFRESH_INTERVAL);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Filter users based on search term and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus ? user.status === filterStatus : true;

    return matchesSearch && matchesFilter;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField as keyof ExtendedUser] ?? '';
    const bValue = b[sortField as keyof ExtendedUser] ?? '';

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopyTooltip(id);
    setTimeout(() => {
      setCopyTooltip(null);
    }, 2000);
  };

  const handleViewProfile = (user: ExtendedUser) => {
    setProfileUser(user);
    setProfileOpen(true);
  };

  const openFreezeDialog = (user: ExtendedUser) => {
    setSelectedUser(user);
    setFreezeDialogOpen(true);
    setFreezeError(null);
  };

  const handleFreezeAccount = async () => {
    if (!selectedUser) return;
    
    setFreezeLoading(true);
    try {
      // Call the admin service to freeze/unfreeze the account
      const newStatus = selectedUser.status === 'active' ? 'frozen' : 'active';
      await adminService.manageAccount({
        userId: selectedUser.id,
        action: newStatus === 'active' ? 'reactivate' : 'freeze'
      });
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, status: newStatus } 
            : user
        )
      );
      
      // Also update the profile user if it's the same one
      if (profileUser && profileUser.id === selectedUser.id) {
        setProfileUser({ ...profileUser, status: newStatus });
      }
      
      setFreezeDialogOpen(false);
      setSelectedUser(null);
      
      // Refresh dashboard stats to reflect the changes
      await refreshStats();
    } catch (err) {
      setFreezeError('Failed to update account status. Please try again.');
      console.error('Error updating account status:', err);
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
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  // Compute user stats values from dashboard stats
  const activeUsers = dashboardStats?.activeUsers || 0;
  const frozenUsers = dashboardStats?.frozenUsers || 0;
  const totalApproved = dashboardStats?.approvedVideos || 0;
  const totalPending = dashboardStats?.pendingVideos || 0;
  const rejectedVideos = dashboardStats?.rejectedVideos || 0;

  return (
    <div className="container mx-auto p-4">
      {/* Add Navigation component */}
      <div className="mb-8">
        <Navigation />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-red-500 mb-2">
            {dashboardStats?.totalUsers.toLocaleString() || '0'}
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
            {dashboardStats?.activeUsers.toLocaleString() || '0'}
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
            {dashboardStats?.frozenUsers.toLocaleString() || '0'}
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
            {dashboardStats?.approvedVideos.toLocaleString() || '0'}
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
            {dashboardStats?.pendingVideos.toLocaleString() || '0'}
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
            {dashboardStats?.rejectedVideos.toLocaleString() || '0'}
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

      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex">
          <button 
            className={`py-2 px-4 font-medium ${filterStatus === 'active' || !filterStatus ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilterStatus('active')}
          >
            Active Accounts
          </button>
          <button 
            className={`py-2 px-4 font-medium ${filterStatus === 'frozen' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilterStatus('frozen')}
          >
            Freezed
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="flex items-center bg-gray-100 rounded-full px-6 py-3 shadow-sm mx-4">
            <FiSearch className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none pl-4 text-sm text-gray-700 w-full"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="relative ml-2">
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
                      setSortField("username");
                      setSortDirection("asc");
                      setShowSortMenu(false);
                    }}
                  >
                    Username (A-Z)
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setSortField("username");
                      setSortDirection("desc");
                      setShowSortMenu(false);
                    }}
                  >
                    Username (Z-A)
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setSortField("createdAt");
                      setSortDirection("desc");
                      setShowSortMenu(false);
                    }}
                  >
                    Newest First
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setSortField("createdAt");
                      setSortDirection("asc");
                      setShowSortMenu(false);
                    }}
                  >
                    Oldest First
                  </button>
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setSortField("postsApproved");
                      setSortDirection("desc");
                      setShowSortMenu(false);
                    }}
                  >
                    Most Posts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer">
                  User ID
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("email")}>
                  Email
                  {sortField === "email" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("username")}>
                  Username
                  {sortField === "username" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("postsApproved")}>
                  Posts (Approved/Pending)
                  {sortField === "postsApproved" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("createdAt")}>
                  Created At
                  {sortField === "createdAt" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("status")}>
                  Status
                  {sortField === "status" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-xs font-mono bg-gray-100 p-1 rounded mr-1">{user.id.substring(0, 10)}...</span>
                        <button 
                          onClick={() => handleCopyId(user.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FiCopy size={16} />
                          {copyTooltip === user.id && (
                            <span className="absolute ml-2 bg-gray-800 text-white text-xs rounded py-1 px-2">
                              Copied!
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-green-600">{user.postsApproved} approved</span>
                        <span className="text-yellow-600">{user.postsPending} pending</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Frozen'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewProfile(user)}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                        >
                          <FiUser size={16} className="mr-1" />
                          <span>View Profile</span>
                        </button>
                        <button 
                          onClick={() => openFreezeDialog(user)}
                          className={`p-1 ${user.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded flex items-center`}
                        >
                          <FiSlash size={16} className="mr-1" />
                          <span>{user.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                currentPage === 1 ? "text-gray-300" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                currentPage === totalPages ? "text-gray-300" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">{Math.min(indexOfLastItem, sortedUsers.length)}</span> of{" "}
                <span className="font-medium">{sortedUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    currentPage === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    currentPage === totalPages ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
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
          {selectedUser?.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.status === 'active' 
              ? `Are you sure you want to freeze ${selectedUser?.username}'s account? This will prevent them from using the platform until unfrozen.`
              : `Are you sure you want to unfreeze ${selectedUser?.username}'s account? This will restore their access to the platform.`
            }
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
            className={selectedUser?.status === 'active' ? 'bg-red-500' : 'bg-green-500'}
          >
            {freezeLoading ? 'Processing...' : selectedUser?.status === 'active' ? 'Freeze' : 'Unfreeze'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Profile Modal */}
      <UserProfile 
        user={profileUser} 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
      />
    </div>
  );
};

export default UserManagement;
