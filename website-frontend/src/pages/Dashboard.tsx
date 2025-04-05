import React, { useState, useEffect } from 'react';
import { 
  Camera, Edit2, HomeIcon, MessageSquare, BookOpen, Settings, 
  GraduationCap, Search, Bell, LogOut, Clock, Calendar, 
  TrendingUp, Users, Plus, Menu, X, Loader2, ChevronRight,
  Star, CreditCard, Bookmark, Video, FileText, HelpCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';


interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  subject?: string;
  profile_title?: string;
  bio?: string | null;
  hourly_rate?: number;
  profile_picture_url?: string | null;
  video_intro_url?: string | null;
  verification_status?: 'unverified' | 'pending' | 'verified';
  rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  is_active: boolean;
  user_type: 'tutor' | 'student';
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: HomeIcon, label: 'Начало', path: '/dashboard' },
    { icon: MessageSquare, label: 'Съобщения', path: '/messages' },
    { icon: BookOpen, label: 'Класна стая', path: '/classroom' },
    { icon: Settings, label: 'Настройки', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                УчиОнлайн
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center space-x-1.5 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-500'
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
                
                <button
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => {
                  localStorage.removeItem("token"); // Remove token
                  window.location.reload(); // Refresh the page
                }}
              >
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
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
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
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
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
                className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LogOut className="w-5 h-5" />
                <span>Изход</span>
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


export function BalanceButton() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8000/balance', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBalance(data.balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setError(error.message);
        setBalance(0); // Fallback to 0
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (isLoading) {
    return (
      <button className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Зареждане...</span>
      </button>
    );
  }

  if (error) {
    return (
      <button 
        className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all"
        title={error}
      >
        <CreditCard className="w-5 h-5" />
        <span>Грешка при зареждане</span>
      </button>
    );
  }

  return (
    <button className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all">
      <CreditCard className="w-5 h-5" />
      <span>Баланс: {(balance || 0).toFixed(2)} лв.</span>
    </button>
  );
}

function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [tempBio, setTempBio] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleProfilePictureUpload = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token || !file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-profile-picture/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      // Now setUserData is in scope
      setUserData(prev => prev ? { ...prev, profile_picture_url: data.file_url } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      // Optional: Add error handling UI feedback
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
  
      if (!token) {
        setError("Authentication token not found.");
        setIsLoading(false);
        navigate("/login");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:8000/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            setError("Authentication failed. Please log in again.");
            localStorage.removeItem("token");
            navigate("/login");
            return;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }
        }
  
        const data: UserData = await response.json();
        setUserData(data);
        // Update both bio states when user data changes
        setBio(data.bio || "");
        setTempBio(data.bio || "");
  
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data.");
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);

  const handleSaveBio = async () => {
    console.log("Saving bio:", tempBio);
    
    try {
      const response = await fetch('http://localhost:8000/users/change_bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bio: tempBio })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save bio');
      }
      console.log(tempBio);
      setIsEditingBio(false);
      setBio(tempBio);
      
    } catch (error) {
      console.error("Bio save error:", error.message);
      // Add your error state handling here, for example:
      // setError(error.message || "Failed to save bio");
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <span className="text-lg font-medium text-gray-600">Зареждане на вашите данни...</span>
          <span className="text-sm text-gray-500 mt-2">Моля, изчакайте</span>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Грешка при зареждане</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                >
                  Опитайте отново
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const stats = [
    { icon: Clock, label: 'Часове този месец', value: '24', trend: '+2.5%', color: 'bg-blue-100 text-blue-800' },
    { icon: Users, label: 'Активни ученици', value: '12', trend: '+1', color: 'bg-green-100 text-green-800' },
    { icon: TrendingUp, label: 'Среден рейтинг', value: userData?.rating?.toFixed(1) ?? 'N/A', trend: '+0.2', color: 'bg-amber-100 text-amber-800' },
    { icon: Calendar, label: 'Предстоящи часове', value: '8', trend: 'Тази седмица', color: 'bg-purple-100 text-purple-800' },
  ];

  const upcomingLessons = [
    { student: 'Петър Петров', subject: 'Математика', time: '14:00 - 15:30', date: 'Днес', status: 'confirmed' },
    { student: 'Мария Иванова', subject: 'Алгебра', time: '16:00 - 17:30', date: 'Утре', status: 'confirmed' },
    { student: 'Георги Димитров', subject: 'Геометрия', time: '10:00 - 11:30', date: '23 Март', status: 'pending' },
  ];

  const quickActions = [
    { icon: Video, label: 'Нов урок', action: () => navigate('/lessons/new') },
    { icon: FileText, label: 'Домашни', action: () => navigate('/homework') },
    { icon: Bookmark, label: 'Материали', action: () => navigate('/materials') },
    { icon: HelpCircle, label: 'Помощ', action: () => navigate('/support') },
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 5 && hour < 12) {
                      return `Добро утро, ${userData?.first_name || 'Потребителю'}!`;
                    } else if (hour >= 12 && hour < 18) {
                      return `Добър ден, ${userData?.first_name || 'Потребителю'}!`;
                    } else {
                      return `Добър вечер, ${userData?.first_name || 'Потребителю'}!`;
                    }
                  })()}
                </h1>
                <p className="mt-1 text-blue-100">
                  {new Date().toLocaleDateString('bg-BG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex space-x-3">
                <BalanceButton />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8 p-6 md:p-8">
          <div className="relative group">
          <img
            src={userData?.profile_picture_url ? 
              `http://localhost:8000${userData.profile_picture_url}` : 
              "https://via.placeholder.com/160/E0E7FF/808080?text=No+Image"
            }
            alt="Profile"
            className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover ring-4 ring-white shadow-lg"
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleProfilePictureUpload(file);
              }
            }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors group-hover:opacity-100 opacity-0"
          >
            <Camera className="w-5 h-5 text-gray-600" />
          </button>
        </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {`${userData?.first_name || ''} ${userData?.last_name || ''}`}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {userData?.profile_title || (userData?.user_type === 'tutor' ? 'Преподавател' : 'Ученик')}
                  </p>
                  {userData?.user_type === 'tutor' && userData.verification_status === 'verified' && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Star className="w-4 h-4 mr-1" />
                      Верифициран преподавател
                    </div>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                  <button className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-blue-600 transition-colors">
                    <Edit2 className="w-5 h-5" />
                    <span>Редактирай профил</span>
                  </button>
                </div>
              </div>

              {userData?.user_type === 'tutor' && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">За мен</h2>
                    {!isEditingBio && (
                      <button
                        onClick={() => {
                          setTempBio(bio);
                          setIsEditingBio(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {!isEditingBio ? (
                    <div className="space-y-2">
                      <p className="text-gray-600 whitespace-pre-line">
                        {bio || 'Няма добавена биография все още.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        placeholder="Добавете кратко описание за себе си..."
                        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-all"
                      />
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setTempBio(bio);
                            setIsEditingBio(false);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
                        >
                          Отказ
                        </button>
                        <button
                          onClick={handleSaveBio}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                        >
                          Запази промените
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="bg-white hover:bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-blue-50 rounded-lg mb-3">
                  <action.icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-800">{action.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Conditional rendering for Tutor specific sections */}
        {userData?.user_type === 'tutor' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all ${stat.color}`}>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.color.replace('text', 'bg').replace('bg-', 'bg-opacity-20 ')}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium bg-white bg-opacity-30 px-2 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Upcoming Lessons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Предстоящи часове</h2>
                <button 
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => navigate('/lessons/new')}
                >
                  <Plus className="w-4 h-4" />
                  <span>Добави час</span>
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingLessons.map((lesson, index) => (
                  <div 
                    key={index} 
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/lessons/${index}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          lesson.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lesson.student}</p>
                          <p className="text-sm text-gray-600">{lesson.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{lesson.time}</p>
                        <p className={`text-sm ${
                          lesson.date === 'Днес' ? 'text-blue-600 font-medium' : 'text-gray-600'
                        }`}>
                          {lesson.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 text-center">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center w-full">
                  Виж всички часове <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Student-specific content */}
        {userData?.user_type === 'student' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Вашите курсове и ресурси</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Course Card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Математика за 12 клас</h3>
                    <p className="text-gray-600 text-sm mb-4">Подготовка за държавен зрелостен изпит по математика</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-600">Активен</span>
                      <button className="text-sm font-medium text-gray-700 hover:text-blue-600">
                        Виж повече
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resource Card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-32"></div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Физика - задачи</h3>
                    <p className="text-gray-600 text-sm mb-4">Сборник със задачи по физика за 11 клас</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-600">Домашно</span>
                      <button className="text-sm font-medium text-gray-700 hover:text-purple-600">
                        Виж повече
                      </button>
                    </div>
                  </div>
                </div>

                {/* Find Tutor CTA */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors flex items-center justify-center">
                  <button 
                    onClick={() => navigate('/tutors')}
                    className="flex flex-col items-center p-6 text-center"
                  >
                    <div className="p-3 bg-blue-100 rounded-full mb-3">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Намери преподавател</h3>
                    <p className="text-gray-600 text-sm">Започни нов курс с нашия преподавател</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Dashboard;
export { AuthenticatedLayout };