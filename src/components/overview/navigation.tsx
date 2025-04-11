import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  removeTab?: string | null; // Define prop types
}

const Navigation: React.FC<NavigationProps> = ({ removeTab = null }) => {
  const location = useLocation(); // Get current path to highlight the active tab

  const navItems = [
    { name: 'Overview', path: '/admin/overview' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Video Management', path: '/admin/videos' },
    { name: 'Approvers', path: '/admin/approvers' },
  ].filter(item => removeTab === null || item.name !== removeTab); // Filter out the tab to remove if provided

  return (
    <nav className="bg-gray-100 p-2 rounded-full w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        {navItems.map((item, index) => (
          <React.Fragment key={item.name}>
            <Link
              to={item.path}
              className={`px-6 py-2 rounded-full transition-all duration-200 text-sm ${
                location.pathname === item.path
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {item.name}
            </Link>
            {index < navItems.length - 1 && (
              <div className="h-6 w-px bg-gray-300 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
