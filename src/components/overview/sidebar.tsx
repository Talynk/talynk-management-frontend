import { useState, useEffect, useCallback } from "react";
import {
  // IoChevronDown,
  // IoChevronForward,
  // IoExitOutline,
  // IoPerson,
  IoSearch,
  IoNotifications,
  IoPersonCircle,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { adminService, Post, SearchType, User as UserType } from "../../api/services/adminService";
import { CircularProgress, Dialog } from "@mui/material";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { UserProfile } from '../../admin/UserManagment';

// Extended User interface with additional properties
interface ExtendedUser {
  id: string;
  username: string;
  email: string;
  status?: string;
  profile_picture?: string;
  posts_count?: number;
  approved_posts_count?: number;
  pending_posts_count?: number;
  rejected_posts_count?: number;
}

interface SidebarProps {
  onSearchResults?: (results: Post[]) => void;
  onSelectPost?: (post: Post) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearchResults, onSelectPost }) => {
  const [selectedOption, setSelectedOption] = useState("Find Post By Traceability ID");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundPostOwner, setFoundPostOwner] = useState<ExtendedUser | null>(null);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchSuccess, setSearchSuccess] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<UserType | null>(null);

  // Map options to search types with proper validation
  const getSearchType = (option: string): SearchType => {
    switch (option) {
      case "Find Post By Traceability ID":
        return "post_id";
      case "Find Post By Author":
        return "username";
      case "Find Post By Date":
        return "date";
      case "Find Post By Status":
        return "status";
      default:
        return "post_title";
    }
  };

  // Validate search query based on type
  const validateSearchQuery = (query: string, type: SearchType): boolean => {
    switch (type) {
      case "date":
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(query)) {
          setSearchError("Date must be in YYYY-MM-DD format");
          return false;
        }
        break;
      case "status":
        // Validate status values
        const validStatuses = ["pending", "approved", "rejected"];
        if (!validStatuses.includes(query.toLowerCase())) {
          setSearchError("Status must be one of: pending, approved, rejected");
          return false;
        }
        break;
      case "post_id":
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(query)) {
          setSearchError("Invalid post ID format");
          return false;
        }
        break;
    }
    return true;
  };

  // Dropdown options with descriptions
  const options = [
    { value: "Find Post By Traceability ID", description: "Search by post ID (UUID format)" },
    { value: "Find Post By Author", description: "Search by username" },
    { value: "Find Post By Date", description: "Search by date (YYYY-MM-DD)" },
    { value: "Find Post By Status", description: "Search by status (pending/approved/rejected)" },
  ];

  // Handle option selection
  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
    setSearchError(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Clear search success message after delay
  useEffect(() => {
    if (searchSuccess) {
      const timer = setTimeout(() => {
        setSearchSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchSuccess]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchError("Please enter a search term");
        setSearchResults([]);
        if (onSearchResults) {
          onSearchResults([]);
        }
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setFoundPostOwner(null);
      setSearchResults([]);

      try {
        const searchType = getSearchType(selectedOption);
        
        // Validate search query
        if (!validateSearchQuery(query.trim(), searchType)) {
          setIsSearching(false);
          return;
        }

        const response = await adminService.searchPosts({
          query: query.trim(),
          type: searchType,
          page: currentPage,
          limit: 10,
          role: 'admin' // or get this from context/auth
        });

        const posts = response.posts;
        setSearchResults(posts);
        setTotalPages(response.pagination.total_pages);

        if (posts.length > 0) {
          if (onSearchResults) {
            onSearchResults(posts);
          }

          if (onSelectPost) {
            onSelectPost(posts[0]);
          }

          if (posts[0].user_id) {
            try {
              const userDetails = await adminService.getUserById(posts[0].user_id);
              if (userDetails) {
                setFoundPostOwner({
                  id: userDetails.id,
                  username: userDetails.username,
                  email: userDetails.email,
                  status: userDetails.status || 'active',
                  profile_picture: userDetails.profile_picture,
                  posts_count: userDetails.posts_count,
                  approved_posts_count: userDetails.approved_posts_count,
                  pending_posts_count: userDetails.pending_posts_count,
                  rejected_posts_count: userDetails.rejected_posts_count
                });
              }
            } catch (userError: unknown) {
              console.error("Error fetching user details:", userError);
              setSearchError("Could not fetch user details");
            }
          }

          setSearchSuccess(true);
        } else {
          setSearchError("No posts found");
          if (onSearchResults) {
            onSearchResults([]);
          }
        }
      } catch (error: unknown) {
        console.error("Search error:", error);
        if (error instanceof Error) {
          // Handle specific API error messages
          if (error.message.includes("UNAUTHORIZED")) {
            setSearchError("Authentication required. Please log in again.");
          } else if (error.message.includes("FORBIDDEN")) {
            setSearchError("You don't have permission to perform this search.");
          } else if (error.message.includes("INVALID_SEARCH_TYPE")) {
            setSearchError("Invalid search type selected.");
          } else {
            setSearchError(error.message);
          }
        } else {
          setSearchError("Error searching for posts");
        }
        setSearchResults([]);
        if (onSearchResults) {
          onSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [onSearchResults, onSelectPost, selectedOption, currentPage]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setSearchError(null);
      setFoundPostOwner(null);
      if (onSearchResults) {
        onSearchResults([]);
      }
    }
  };

  // Handle search form submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    }
  };

  // Freeze/Unfreeze account handler (stub, implement API call as needed)
  const freezeAccount = async (userId: string) => {
    // TODO: Implement freeze/unfreeze logic with API call
    alert(`Account action for user: ${userId}`);
  };

  const handleViewDetails = () => {
    if (foundPostOwner?.id) {
      navigate(`/admin/users/${foundPostOwner.id}`);
    }
  };

  return (
    <div className="bg-white h-full px-6 py-8 rounded-lg shadow-md border border-gray-100">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <IoCheckmarkCircle className="h-6 w-6 text-[#004896]" />
            <h2 className="text-[#004896] font-bold text-xl">Talynk</h2>
          </div>
        </div>

        {/* Search Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-3 text-left border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
          >
            <div>
              <span className="text-sm text-gray-700">{selectedOption}</span>
              <p className="text-xs text-gray-500 mt-1">
                {options.find(opt => opt.value === selectedOption)?.description}
              </p>
            </div>
            <span className="text-gray-400">▼</span>
          </button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-sm text-gray-700">{option.value}</span>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IoSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full p-3 pl-10 pr-24 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Search ${selectedOption.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            required
          />
          <button
            type="submit"
            className="absolute right-2 inset-y-2 px-4 py-1 bg-[#004896] hover:bg-[#003572] rounded-md text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSearching}
          >
            {isSearching ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Search Feedback */}
        {searchSuccess && !searchError && (
          <div className="text-green-600 text-sm bg-green-50 p-2 rounded-md flex items-center">
            <IoCheckmarkCircle className="mr-1" /> Found {searchResults.length}{" "}
            post(s)
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
            {searchError}
          </div>
        )}

        {/* Search Results Section */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold text-lg mb-2">Search Results</h3>
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {searchResults.map((post) => (
                <div key={post.id} className="p-3 bg-gray-50 rounded-lg border shadow flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{post.title || 'Untitled Post'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : post.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : post.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">User:</span> {post.user?.username || 'Unknown User'}
                    {post.user?.email && <span className="ml-2 text-gray-400">({post.user.email})</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      // className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-max text-xs"
                      // onClick={() => {
                      //   if (onSelectPost) onSelectPost(post);
                      //   if (post.id) navigate('/admin/videos', { state: { postId: post.id }, replace: true });
                      // }}
                    >
                      View Post Details
                    </button>
                    {post.user?.id && (
                      <button
                        className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 w-max text-xs"
                        onClick={async () => {
                          const userDetails = await adminService.getUserById(post.user.id);
                          setProfileUser(userDetails);
                          setProfileOpen(true);
                        }}
                      >
                        View User Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* End Search Results Section */}

        {/* Post Owner Section */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow border">
          <h3 className="font-bold text-lg mb-2">Post Owner</h3>
          {isSearching ? (
            <div className="flex justify-center items-center h-20">
              <CircularProgress />
            </div>
          ) : searchResults.length > 0 && searchResults[0].user ? (() => {
            const user = searchResults[0].user as any;
            return (
              <div className="flex flex-col items-center">
                <img
                  src={user.profile_picture ? user.profile_picture : '/default-avatar.png'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mb-2"
                />
                <div className="font-semibold">{user.username || "Unknown User"}</div>
                <div className="text-gray-500 text-sm">{user.email || "No email"}</div>
                <span className={`mt-1 px-2 py-1 rounded text-xs ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {user.status === 'active' ? 'Active' : user.status === 'frozen' ? 'Frozen' : 'Unknown'}
                </span>
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={async () => {
                      if (user.id) {
                        const userDetails = await adminService.getUserById(user.id);
                        setProfileUser(userDetails);
                        setProfileOpen(true);
                      }
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => freezeAccount(user.id)}
                  >
                    Freeze Account
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="text-gray-500 text-center">No user found</div>
          )}
          {searchError && (
            <div className="text-red-500 text-sm mt-2 text-center">{searchError}</div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-gray-50 px-4 py-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="relative">
              <IoNotifications className="h-5 w-5 text-gray-600" />
              <div className="h-2 w-2 bg-red-500 rounded-full absolute top-0 right-0" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-blue-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    John David
                  </p>
                  <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                    Just now
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  A new post pending approval from{" "}
                  {foundPostOwner?.username || "a user"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-gray-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    Robert Miles
                  </p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-600">
                  Created a new role Approver
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-gray-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    Robert Miles
                  </p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-600">
                  Added new content for review
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UserProfile user={profileUser} open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};

export default Sidebar;
