import React, { useState, useEffect } from 'react';
import {
  Camera, Edit2, HomeIcon, MessageSquare, BookOpen, Settings, User, Hourglass,
  GraduationCap, Search, Bell, LogOut, Clock, Calendar,
  TrendingUp, Users, Plus, Menu, X, Loader2, ChevronRight,
  Star, CreditCard, Bookmark, Video, FileText, HelpCircle, ArrowRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
interface UserData {
  id: number; email: string; first_name: string; last_name: string; subject?: string; profile_title?: string; bio?: string | null; hourly_rate?: number; profile_picture_url?: string | null; video_intro_url?: string | null; verification_status?: 'unverified' | 'pending' | 'verified'; rating?: number; total_reviews?: number; created_at: string; updated_at: string; last_login_at?: string | null; is_active: boolean; user_type: 'tutor' | 'student';
}

interface Lesson {
  tutor_first_name?: string;
  tutor_last_name?: string;
  tutor_profile_picture?: string;
  tutor_subject?: string;
  tutor_public_id?: string;
  tutor_hourly_rate?: number;
  student_first_name?: string;
  student_last_name?: string;
  student_profile_picture?: string;
  student_public_id?: string;
  day_of_week: string;
  duration: number;
  frequency: string;
  scheduled_at: string;
  time_left?: number;
}
const daysBg = [
  "понеделник",
  "вторник",
  "сряда",
  "четвъртък",
  "петък",
  "събота",
  "неделя"
];

export function BalanceButton() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:8001/balance', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setBalance(data.balance);
      } catch (error: any) {
        console.error('Error fetching balance:', error);
        setError(error.message);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, []);

  if (isLoading) return (<button className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all"><Loader2 className="w-5 h-5 animate-spin" /><span>Зареждане...</span></button>);
  if (error) return (<button className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all" title={error}><CreditCard className="w-5 h-5" /><span>Грешка при зареждане</span></button>);

  return (<button className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white transition-all"><CreditCard className="w-5 h-5" /><span>Баланс: {(balance || 0).toFixed(2)} лв.</span></button>);
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

  const UpcomingLessons = ({ userData }: { userData: UserData | null }) => {
    const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [lessonLink, setLessonLink] = useState<string | null>(null);

    useEffect(() => {
      const fetchNextLesson = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:8001/students/next-lesson`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to load lesson");
          }
          
          const data = await res.json();
          setNextLesson(data);
          // Convert milliseconds to seconds and round down
          setTimeLeft(Math.floor(data.time_left));
        } catch (err) {
          setError(err.message || "Failed to load lesson");
        } finally {
          setLoading(false);
        }
      };
    
      fetchNextLesson();
    }, [userData]);

    useEffect(() => {
      if (timeLeft === null) return;

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
      if (timeLeft !== null && timeLeft <= 300) { // 300 seconds = 5 minutes
        const fetchLessonLink = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8001/get-lesson-link`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!res.ok) {
              throw new Error("Failed to load lesson link");
            }
            
            const data = await res.json();
            setLessonLink(data.lesson_link); // Use the lesson_link from response
          } catch (err) {
            console.error("Error fetching lesson link:", err);
          }
        };
        
        // Only fetch if we haven't already
        if (!lessonLink) {
          fetchLessonLink();
        }
      }
    }, [timeLeft, lessonLink]);

    const formatTime = (seconds: number) => {
      const days = Math.floor(seconds / (60 * 60 * 24));
      const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
      const mins = Math.floor((seconds % (60 * 60)) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        return `Остава: ${days} ${days === 1 ? 'ден' : 'дена'}`;
      } else if (hours > 0) {
        return `Остава: ${hours} ${hours === 1 ? 'час' : 'часа'}`;
      } else if (mins > 0) {
        return `Остава: ${mins+1} ${mins === 1 ? 'минута' : 'минути'}`;
      } else if(secs == 0) {
          return `Урокът Започна`;
      } else {
        return `${secs} ${secs === 1 ? 'секунда' : 'секунди'}`;
      }
    };


    if (loading) return <p>Зареждане...</p>;
    if (error) return <p className="text-red-600">Грешка при взимане на уроци.</p>;

    if (!nextLesson?.scheduled_at) return (
      <div className="p-6">
        <div className="text-center py-10 rounded-xl border border-gray-200 shadow-sm bg-white">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Няма предстоящи уроци</h3>
          <p className="mt-2 text-gray-500">
            {userData?.user_type === "tutor"
              ? "Когато имате записани уроци, те ще се появят тук."
              : "Запишете се за урок с преподавател."}
          </p>
          <div className="mt-6">
            <Link
              to={userData?.user_type === "tutor" ? "/availability" : "/find-tutor"}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {userData?.user_type === "tutor"
                ? "Добави свободни часове"
                : "Намери преподавател"}
            </Link>
          </div>
        </div>
      </div>
    );

    // For tutor view
    if (userData?.user_type === 'tutor') {
      return (
        <div className="relative bg-gradient-to-br from-indigo-100 to-white rounded-b-2xl shadow-lg p-6 border border-indigo-200">          <div className="flex items-start gap-4 mb-4">
            <img
              src={`http://localhost:8001${nextLesson.student_profile_picture}`}
              alt={`${nextLesson.student_first_name} ${nextLesson.student_last_name}`}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900">
                {nextLesson.student_first_name} {nextLesson.student_last_name}
              </h3>
              <p className="text-sm text-gray-600">Урок с вас</p>
            </div>
          </div>
          
          <div className="space-y-4 text-base border-t pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <div className="text-gray-800">
                <span className="capitalize">{daysBg[nextLesson.day_of_week]}</span>
                <span className="mx-2">•</span>
                <span>
                  {new Date(nextLesson.scheduled_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-indigo-500" />
              <span className="text-gray-800">{nextLesson.duration} минути</span>
              <span className="mx-2">•</span>
              <span className="text-gray-800 capitalize">
                {nextLesson.frequency === 'once' ? 'Веднъж' : 'Всяка седмица'}
              </span>
            </div>
            {timeLeft !== null && (
              <div className="absolute top-4 right-4 bg-white border border-indigo-300 text-indigo-700 px-4 py-2 rounded-xl shadow flex items-center gap-2 z-10">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}



            {lessonLink && (
              <a 
                href={lessonLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition mt-4"
              >
                Влезте в часа
              </a>
            )}
          </div>
        </div>
      );
    }

    // For student view
    return (
      <div className="bg-gradient-to-br from-indigo-100 to-white rounded-b-2xl shadow-lg p-6 border border-indigo-200">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={`http://localhost:8001${nextLesson.tutor_profile_picture}`}
            alt={`${nextLesson.tutor_first_name} ${nextLesson.tutor_last_name}`}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {nextLesson.tutor_first_name} {nextLesson.tutor_last_name}
            </h3>
            <p className="text-sm text-gray-600">{nextLesson.tutor_subject}</p>
            <p className="text-sm font-medium text-indigo-600">
              {nextLesson.tutor_hourly_rate} лв./час
            </p>
          </div>
        </div>
        
        <div className="space-y-4 text-base border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <div className="text-gray-800">
              <span className="capitalize">{daysBg[nextLesson.day_of_week]}</span>
              <span className="mx-2">•</span>
              <span>
                {new Date(nextLesson.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-indigo-500" />
            <span className="text-gray-800">{nextLesson.duration} минути</span>
            <span className="mx-2">•</span>
            <span className="text-gray-800 capitalize">
              {nextLesson.frequency === 'once' ? 'Веднъж' : 'Всяка седмица'}
            </span>
          </div>

          {timeLeft !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <span className="text-gray-800">
                Оставащо време: {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {lessonLink && (
            <a 
              href={lessonLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition mt-4"
            >
              Влезте в часа
            </a>
          )}
          
          <div className="pt-2">
            <Link 
              to={`/tutors/${nextLesson.tutor_public_id}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              Виж профила на преподавателя
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const handleProfilePictureUpload = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token || !file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:8001/upload-profile-picture/', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, }, body: formData, });
      if (!response.ok) throw new Error('Failed to upload profile picture');
      const data = await response.json();
      setUserData(prev => prev ? { ...prev, profile_picture_url: data.file_url } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true); setError(null);
      const token = localStorage.getItem("token");
      if (!token) { setError("Authentication token not found."); setIsLoading(false); navigate("/login"); return; }
      try {
        const response = await fetch("http://localhost:8001/users/me", { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", }, });
        if (!response.ok) {
          if (response.status === 401) { setError("Authentication failed. Please log in again."); localStorage.removeItem("token"); navigate("/login"); return; }
          else { const errorData = await response.json(); throw new Error(errorData.detail || `HTTP error! status: ${response.status}`); }
        }
        const data: UserData = await response.json();
        setUserData(data); setBio(data.bio || ""); setTempBio(data.bio || "");
      } catch (err: any) { setError(err.message || "Failed to fetch user data."); console.error("Fetch error:", err); } finally { setIsLoading(false); }
    };
    fetchUserData();
  }, [navigate]);

  const handleSaveBio = async () => {
    console.log("Saving bio:", tempBio);
    try {
      const response = await fetch('http://localhost:8001/users/change_bio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ bio: tempBio }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save bio'); }
      console.log(tempBio); setIsEditingBio(false); setBio(tempBio);
    } catch (error: any) { console.error("Bio save error:", error.message); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" /><span className="text-lg font-medium text-gray-600">Зареждане на вашите данни...</span><span className="text-sm text-gray-500 mt-2">Моля, изчакайте</span></div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0"><svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div>
            <div className="ml-3"><h3 className="text-sm font-medium text-red-800">Грешка при зареждане</h3><div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4"><button onClick={() => window.location.reload()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none">Опитайте отново</button></div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <img 
                  src={`http://localhost:8001${userData?.profile_picture_url}` || '/default-avatar.png'} 
                  alt="Profile" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleProfilePictureUpload(e.target.files[0])}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">
                {userData?.first_name} {userData?.last_name}
              </h2>
              
              {userData?.profile_title && (
                <p className="text-gray-600 mt-1">{userData.profile_title}</p>
              )}
              
              
              
              <div className="mt-4 w-full">
                <h3 className="font-medium text-gray-900 mb-2">За мен</h3>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Отказ
                      </button>
                      <button
                        onClick={handleSaveBio}
                        className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        Запази
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <p className="text-gray-600 whitespace-pre-line">
                      {bio || "Няма въведена биография."}
                    </p>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {userData?.user_type === 'tutor' && (
                <div className="mt-4 w-full">
                  <h3 className="font-medium text-gray-900 mb-2">Цена за час</h3>
                  <p className="text-gray-600">
                    {userData.hourly_rate ? `${userData.hourly_rate.toFixed(2)} лв./час` : "Не е зададена"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Статистика</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm text-indigo-600">Общо уроци</p>
                <p className="text-2xl font-bold mt-1">24</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">Следващ урок</p>
                <p className="text-2xl font-bold mt-1">{userData?.user_type === 'tutor' ? '3' : 'Петък'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Здравейте, {userData?.first_name}!</h2>
                <p className="opacity-90">
                  {userData?.user_type === 'tutor' 
                    ? 'Готови ли сте за днешните уроци?' 
                    : 'Какво ще учим днес?'}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Предстоящи уроци</h3>
              <Link to="/lessons" className="text-sm text-indigo-600 hover:text-indigo-800">
                Виж всички
              </Link>
            </div>
            <UpcomingLessons userData={userData} />
          </div>


    
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Скорошна активност</h3>
              <Link to="/activity" className="text-sm text-indigo-600 hover:text-indigo-800">
                Виж всички
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Ново съобщение</p>
                    <p className="text-sm text-gray-500">От Иван Петров</p>
                    <p className="text-xs text-gray-400 mt-1">Преди 2 часа</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Записан урок</p>
                    <p className="text-sm text-gray-500">Математика - 15 май</p>
                    <p className="text-xs text-gray-400 mt-1">Преди 1 ден</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;