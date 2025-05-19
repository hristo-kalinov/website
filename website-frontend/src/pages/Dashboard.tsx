import React, { useState, useEffect } from 'react';
import {
  Camera, Edit2, MessageSquare, BookOpen, Hourglass, Clock, Calendar, Plus, Loader2, CreditCard
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

  const UpcomingLessons = ({ userData }: { userData: UserData | null }) => {

    const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [lessonError, setLessonError] = useState<string | null>(null); // Renamed to avoid conflict
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [lessonLink, setLessonLink] = useState<string | null>(null);

    useEffect(() => {
      const fetchNextLesson = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/students/next-lesson`, {
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
          if (data.time_left !== undefined && data.time_left !== null) {
            setTimeLeft(Math.floor(data.time_left));
          } else {
            setTimeLeft(null); // Explicitly set to null if not present
          }
        } catch (err: any) { // Explicitly type err
          setLessonError(err.message || "Failed to load lesson");
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
          if (prev === null || prev <= 0) {
            clearInterval(timer); // Clear interval when time reaches 0 or less
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
      if (timeLeft !== null && timeLeft <= 300 && timeLeft > 0) { // 300 seconds = 5 minutes, and lesson hasn't started
        const fetchLessonLink = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/get-lesson-link`, {
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
            setLessonLink(data.lesson_link);
          } catch (err: any) { // Explicitly type err
            console.error("Error fetching lesson link:", err.message);
            // Potentially set an error state here for the link
          }
        };

        if (!lessonLink) {
          fetchLessonLink();
        }
      } else if (timeLeft === 0 && !lessonLink) { // If lesson started and link not fetched
        const fetchLessonLink = async () => {
          // Same fetch logic as above
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/get-lesson-link`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (!res.ok) throw new Error("Failed to load lesson link post start");
            const data = await res.json();
            setLessonLink(data.lesson_link);
          } catch (err: any) {
            console.error("Error fetching lesson link post start:", err.message);
          }
        };
        fetchLessonLink();
      }
    }, [timeLeft, lessonLink]);

    const formatTime = (seconds: number) => {
      const days = Math.floor(seconds / (60 * 60 * 24));
      const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
      const mins = Math.floor((seconds % (60 * 60)) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        return `След: ${days} ${days === 1 ? 'ден' : 'дена'}`;
      } else if (hours > 0) {
        return `След: ${hours} ${hours === 1 ? 'час' : 'часа'}`;
      } else if (mins > 0) {
        return `След: ${mins + (secs > 0 ? 1 : 0)} ${mins + (secs > 0 ? 1 : 0) === 1 ? 'минута' : 'минути'}`;
      } else if (seconds <= 0) {
        return `Урокът Започна`;
      } else {
        return `${secs} ${secs === 1 ? 'секунда' : 'секунди'}`;
      }
    };


    if (loading) return <div className="p-6 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p>Зареждане на следващ урок...</p></div>;
    if (lessonError) return <p className="text-red-600 p-6">{lessonError}</p>;

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
              to={userData?.user_type === "tutor" ? "/availability" : "/tutors"}
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

    const profileImageSrc = userData?.user_type === 'tutor'
      ? nextLesson.student_profile_picture
      : nextLesson.tutor_profile_picture;
    const profileImageAlt = userData?.user_type === 'tutor'
      ? `${nextLesson.student_first_name} ${nextLesson.student_last_name}`
      : `${nextLesson.tutor_first_name} ${nextLesson.tutor_last_name}`;
    const nameDisplay = userData?.user_type === 'tutor'
      ? `${nextLesson.student_first_name} ${nextLesson.student_last_name}`
      : `${nextLesson.tutor_first_name} ${nextLesson.tutor_last_name}`;
    const roleOrSubjectDisplay = userData?.user_type === 'tutor'
      ? "Урок с вас"
      : nextLesson.tutor_subject;


    return (
      <div className="relative bg-gradient-to-br from-indigo-100 to-white rounded-b-2xl shadow-lg p-6 border border-indigo-200">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={profileImageSrc ? `${API_URL}${profileImageSrc}` : `${API_URL}/default-avatar.webp`}
            alt={profileImageAlt || 'Profile'}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {nameDisplay}
            </h3>
            <p className="text-sm text-gray-600">{roleOrSubjectDisplay}</p>
          </div>
        </div>

        <div className="space-y-4 text-base border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <div className="text-gray-800">
              <span className="capitalize">{daysBg[new Date(nextLesson.scheduled_at).getDay() === 0 ? 6 : new Date(nextLesson.scheduled_at).getDay() - 1]}</span>
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

          {lessonLink && (timeLeft === null || timeLeft <= 300) && ( // Show link if available and time is within 5 mins or started
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
  };

const API_URL = import.meta.env.VITE_API_URL;
function Dashboard() {

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [tempBio, setTempBio] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalLessons, setTotalLessons] = useState<number | string | null>(null); // Adjusted type for '—'
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [tempHourlyRate, setTempHourlyRate] = useState<number | undefined>(undefined);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [priceUpdateError, setPriceUpdateError] = useState<string | null>(null);


  const handleProfilePictureUpload = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token || !file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_URL}/upload-profile-picture/`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, }, body: formData, });
      if (!response.ok) throw new Error('Failed to upload profile picture');
      const data = await response.json();
      setUserData(prev => prev ? { ...prev, profile_picture_url: data.file_url } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      // Optionally set an error state to show to the user
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true); setError(null);
      const token = localStorage.getItem("token");
      if (!token) { setError("Authentication token not found."); setIsLoading(false); navigate("/login"); return; }
      try {
        const response = await fetch(`${API_URL}/users/me`, { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", }, });
        if (!response.ok) {
          if (response.status === 401) { setError("Authentication failed. Please log in again."); localStorage.removeItem("token"); navigate("/login"); return; }
          else { const errorData = await response.json(); throw new Error(errorData.detail || `HTTP error! status: ${response.status}`); }
        }
        const data: UserData = await response.json();
        setUserData(data); setBio(data.bio || ""); setTempBio(data.bio || ""); setHourlyRate(data.hourly_rate); setTempHourlyRate(data.hourly_rate);
      } catch (err: any) { setError(err.message || "Failed to fetch user data."); console.error("Fetch error:", err); } finally { setIsLoading(false); }
    };
    fetchUserData();
  }, [navigate]);

  const handleSaveBio = async () => {
    console.log("Saving bio:", tempBio);
    try {
      const response = await fetch(`${API_URL}/users/change_bio`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ bio: tempBio }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to save bio'); }
      console.log(tempBio); setIsEditingBio(false); setBio(tempBio);
      setUserData(prev => prev ? { ...prev, bio: tempBio } : null); // Update userData state
    } catch (error: any) { console.error("Bio save error:", error.message); }
  };

  const handleEditPrice = () => {
    setTempHourlyRate(hourlyRate);
    setIsEditingPrice(true);
  };

  const handleCancelEditPrice = () => {
    setIsEditingPrice(false);
    setTempHourlyRate(hourlyRate); // Revert to the original value
    setPriceUpdateError(null);
  };

  const handleSavePrice = async () => {
    if (tempHourlyRate === undefined || tempHourlyRate === null || isNaN(tempHourlyRate) || tempHourlyRate < 0) {
      setPriceUpdateError("Цената трябва да бъде положително число.");
      return;
    }

    setPriceUpdateLoading(true);
    setPriceUpdateError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/update-price?hourly_rate=${tempHourlyRate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update hourly rate');
      }

      setIsEditingPrice(false);
      setHourlyRate(tempHourlyRate);
      setUserData(prev => prev ? { ...prev, hourly_rate: tempHourlyRate } : null);
    } catch (error: any) {
      console.error('Error updating hourly rate:', error.message);
      setPriceUpdateError(error.message || 'Failed to update hourly rate');
    } finally {
      setPriceUpdateLoading(false);
    }
  };

  useEffect(() => {
    const fetchTotalLessons = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // Assuming if no token, user data also won't load, so no need to fetch lessons
          setTotalLessons('0'); // Or null, depending on how you want to handle
          return;
        }
        const response = await fetch(`${API_URL}/total-lessons`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTotalLessons(data.total_lessons);
      } catch (error) {
        console.error('Error fetching total lessons:', error);
        setTotalLessons('—'); // Fallback value
      }
    };

    if (userData) { // Fetch only if userData is loaded (implies token was present)
      fetchTotalLessons();
    }
  }, [userData]); // Depend on userData to refetch if user changes or logs in

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" /><span className="text-lg font-medium text-gray-600">Зареждане на вашите данни...</span><span className="text-sm text-gray-500 mt-2">Моля, изчакайте</span></div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="flex">
            <div className="flex-shrink-0"><svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">Грешка при зареждане</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (error.includes("Authentication failed")) {
                      navigate("/login");
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition ease-in-out duration-150"
                >
                  {error.includes("Authentication failed") ? "Вход" : "Опитайте отново"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define QuickStats Card JSX here to ensure it has access to totalLessons and userData
  const quickStatsCard = (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-medium text-gray-900 mb-4">Статистика</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-sm text-indigo-600">Общо уроци</p>
          <p className="text-2xl font-bold mt-1">{totalLessons !== null ? totalLessons : '...'}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600">Рейтинг</p> {/* Changed from "Next Lesson" for simplicity or actual data */}
          <p className="text-2xl font-bold mt-1">
            {userData?.user_type === 'tutor' ? (userData.rating ? `${userData.rating.toFixed(1)}/5` : 'Няма') : (userData?.rating ? `${userData.rating.toFixed(1)}/5` : 'Няма')}
          </p>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6">

        {/* Left Column - Profile Section & Quick Stats (Desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={userData?.profile_picture_url ? `${API_URL}${userData.profile_picture_url}` : `${API_URL}/default-avatar.webp`}
                  alt="Profile"
                  className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                  onError={(e) => (e.currentTarget.src = `${API_URL}/default-avatar.webp`)} // Fallback for broken image links
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                  aria-label="Change profile picture"
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

              {userData.user_type === "tutor" && (
                <div className="mt-4 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-gray-900">За мен</h3>
                    {!isEditingBio && (
                      <button
                        onClick={() => { setTempBio(bio); setIsEditingBio(true); }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                        aria-label="Edit bio"
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Редактирай
                      </button>
                    )}
                  </div>

                  {isEditingBio ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        rows={4}
                        placeholder="Разкажете малко за себе си..."
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
                      <p className="text-gray-600 whitespace-pre-line text-sm">
                        {bio || "Все още нямате описание. Кликнете на моливчето, за да добавите."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {userData?.user_type === 'tutor' && (
                <div className="mt-4 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-gray-900">Цена за час</h3>
                    {!isEditingPrice ? (
                      <button
                        onClick={handleEditPrice}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                        aria-label="Edit hourly rate"
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Редактирай
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          defaultValue={hourlyRate !== undefined ? hourlyRate : ''}
                          onChange={(e) => {
                            const newValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setTempHourlyRate(newValue); // Still update temp state for controlled input
                          }}
                          className="w-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-gray-700 text-sm">лв./час</span>
                        <button
                          onClick={handleSavePrice}
                          disabled={priceUpdateLoading}
                          className={`px-3 py-1.5 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 ${priceUpdateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {priceUpdateLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Запази'}
                        </button>
                        <button
                          onClick={handleCancelEditPrice}
                          className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Отказ
                        </button>
                      </div>
                    )}
                  </div>
                  {priceUpdateError && <p className="text-red-500 text-sm mt-1">{priceUpdateError}</p>}
                  {!isEditingPrice && (
                    <p className="text-gray-600 text-sm">
                      {hourlyRate !== undefined ? `${hourlyRate.toFixed(2)} лв./час` : "Не е зададена"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats (Desktop Version) - Placed within the left column flow */}
          <div className="hidden lg:block">
            {quickStatsCard}
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Banner - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Здравейте, {userData?.first_name}!</h2>
                <p className="opacity-90">
                  {userData?.user_type === 'tutor'
                    ? 'Готови ли сте за днешните уроци?'
                    : 'Какво ще учим днес?'}
                </p>
              </div>
              {/* Optional: Add an image or icon here for desktop banner */}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Следващ урок</h3>
              <Link to="/lessons" className="text-sm text-indigo-600 hover:text-indigo-800">
                Виж всички
              </Link>
            </div>
            <UpcomingLessons userData={userData} />
          </div>

          {/* Recent Activity */}
        </div>

        {/* Quick Stats (Mobile Version) - Appears at the end of the single column flow on mobile */}
        <div className="lg:hidden">
          {quickStatsCard}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;