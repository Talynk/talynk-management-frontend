import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'button', 
  className = '' 
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    authService.logout();
    
    // Redirect to landing page
    navigate('/');
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${className}`}
        title="Logout"
      >
        <LogOut className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
};

export default LogoutButton; 