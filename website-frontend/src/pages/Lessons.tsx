import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Hourglass, Trash2, Video } from 'lucide-react'; // Removed Clock, Added Trash2

interface Lesson {
  id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_profile_picture: string;
  tutor_subject: string;
  student_first_name: string;
  student_last_name: string;
  student_profile_picture: string;
  scheduled_at: string;
  duration: number;
  frequency: 'once' | 'weekly';
}

interface UserData {
  user_type: 'tutor' | 'student';
  // Add other user data properties as needed
}

// daysBg is not needed with the updated formatDayOfWeek function
// const daysBg: Record<string, string> = {
//   monday: 'понеделник',
//   tuesday: 'вторник',
//   wednesday: 'сряда',
//   thursday: 'четвъртък',
//   friday: 'петък',
//   saturday: 'събота',
//   sunday: 'неделя',
// };

const LessonsPage = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/users/me`, {
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
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const data: UserData = await response.json();
        setUserData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data.");
        console.error("Fetch user data error:", err);
      } finally {
        // setLoading(false); // Loading will be set to false after lessons are fetched or if user data fails
      }
    };
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (!userData) {
      if (!localStorage.getItem("token")) { // If no token, no need to try fetching lessons
          setLoading(false);
      }
      return; // Don't fetch lessons until we have user data
    }

    const fetchLessons = async () => {
      setLoading(true); // Ensure loading is true when starting to fetch lessons
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/lessons`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to load lessons');
        }
        const data: Lesson[] = await res.json();
        setLessons(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Fetch lessons error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [userData]);

  const formatDayOfWeek = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('bg-BG', { weekday: 'long' });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този урок? Това действие е необратимо.")) {
      return;
    }
    setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/delete-lesson/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to parse error message from backend
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
        } catch (parseError) {
            // If parsing JSON fails, use the generic error
            console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId));
      // Optionally: show a success notification
      // alert("Урокът е изтрит успешно.");
    } catch (err: any) {
      setError(`Грешка при изтриване на урок: ${err.message}`);
      console.error("Delete lesson error:", err);
    }
  };


  if (loading) return <p className="p-6 text-center">Зареждане на уроци...</p>;
  // Error display is now part of the main return or handled by handleDeleteLesson's setError
  // if (error && !lessons.length) return <p className="p-6 text-center text-red-600">Грешка: {error}</p>;
  if (!userData && !loading) return <p className="p-6 text-center text-gray-500">Моля, влезте за да видите вашите уроци.</p>;


  if (!lessons.length && !loading) return (
    <div className="p-6 text-center text-gray-500">
      Няма налични уроци.
      {userData && ( // Ensure userData is available before showing link
         <div className="mt-4">
            <Link to={userData.user_type === 'tutor' ? '/availability' : '/tutors'}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
              {userData.user_type === 'tutor' ? 'Добави свободни часове' : 'Намери учител'}
            </Link>
         </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded-md">Грешка: {error}</p>}
      {lessons.map(lesson => (
        <div
          key={lesson.id}
          className="relative bg-gradient-to-br from-indigo-100 to-white rounded-2xl shadow-lg p-6 border border-indigo-200"
        >
          <button
            onClick={() => handleDeleteLesson(lesson.id)}
            className="absolute top-3 right-3 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors z-10"
            aria-label="Изтрий урока"
          >
            <Trash2 size={20} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <img
              src={`${API_URL}${userData?.user_type === 'tutor' ? lesson.student_profile_picture : lesson.tutor_profile_picture}`}
              alt={userData?.user_type === 'tutor'
                ? `${lesson.student_first_name} ${lesson.student_last_name}`
                : `${lesson.tutor_first_name} ${lesson.tutor_last_name}`}
              className="h-12 w-12 rounded-full object-cover border border-indigo-200"
              onError={(e) => (e.currentTarget.src = '/default-profile.png')}
            />
            <div>
              <h3 className="font-medium text-gray-900">
                {userData?.user_type === 'tutor'
                  ? `${lesson.student_first_name} ${lesson.student_last_name}`
                  : `${lesson.tutor_first_name} ${lesson.tutor_last_name}`}
              </h3>
              <p className="text-sm text-gray-600">
                {userData?.user_type === 'tutor' ? 'Урок с вас' : lesson.tutor_subject}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-100 to-white rounded-b-2xl shadow-inner p-6 border border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <div className="text-gray-800">
                <span className="capitalize">{formatDayOfWeek(lesson.scheduled_at)}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span>{formatTime(lesson.scheduled_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <div className="text-gray-800">
                <span>{lesson.duration} минути</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="capitalize">
                  {lesson.frequency === 'once' ? 'Еднократно' : 'Всяка седмица'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default LessonsPage;