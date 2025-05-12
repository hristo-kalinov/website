import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Edit2, HomeIcon, MessageSquare, BookOpen, Settings,
  GraduationCap, Search, Bell, LogOut, Clock, Calendar,
  TrendingUp, Users, Plus, Menu, X, Loader2, ChevronRight,
  Star, CreditCard, Bookmark, Video, FileText, HelpCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate(); // ✅ Moved here

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:8001/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: HomeIcon, label: 'Начало', path: '/dashboard' },
    { icon: MessageSquare, label: 'Съобщения', path: '/messages' },
  ];

  if (user?.user_type === 'tutor') {
    navItems.push({ icon: Calendar, label: 'Календар', path: '/availability' });
  }
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img 
                src="/favicon.png" 
                alt="Logo" 
                className="h-8 w-8 md:h-12 md:w-12" 
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Infizity
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                    location.pathname === item.path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg group-hover:bg-blue-50 ${
                    location.pathname === item.path ? 'bg-blue-50' : ''
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="flex items-center space-x-4 ml-4">
                <button
                  onClick={() => navigate('/tutors')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Search className="w-5 h-5" />
                  <span className="font-medium">Търси преподаватели</span>
                </button>

                <button className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span>
                </button>

                <div className="w-px h-8 bg-gray-200"></div>

                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors" onClick={handleLogout}>
                  <div className="p-1.5 rounded-lg hover:bg-blue-50">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Изход</span>
                </button>
              </div>
            </div>

            {/* Mobile Navigation Button */}
            <div className="flex md:hidden items-center space-x-4">
              <button className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-inner">
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              <button
                onClick={() => {
                  navigate('/tutors');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-white text-base font-medium shadow-md"
              >
                <Search className="w-5 h-5" />
                <span>Търси преподаватели</span>
              </button>

              <button
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={handleLogout}
              >
                <div className="p-1.5 rounded-lg hover:bg-blue-50">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-medium">Изход</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

export default AuthenticatedLayout;
