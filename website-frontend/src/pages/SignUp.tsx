import React, { useState, useMemo, useEffect } from 'react'; // Import useEffect
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Mail,
  Lock,
  User,
  LogIn,
  Book,
  Search,
  Plus,
} from 'lucide-react';

const subjects = [
  'Математика',
  'Български език',
  'Английски език',
  'История',
  'География',
  'Биология',
  'Химия',
  'Физика',
  'Информатика',
  'Литература',
  'Философия',
  'Музика',
  'Изобразително изкуство',
  'Програмиране',
  'Web дизайн',
];

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to send GA4 events
const sendGAEvent = (eventName, params = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  } else {
    console.warn('Google Analytics gtag not loaded.');
  }
};

function SignUp() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [passwordError, setPasswordError] = useState('');

  // Teacher-specific fields
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [showSubjects, setShowSubjects] = useState(false);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjectSearch]);

  // Track initial page view for signup
  useEffect(() => {
    sendGAEvent('page_view', {
      page_title: 'Signup Page',
      page_location: window.location.href,
      page_path: window.location.pathname,
      signup_step: step, // Also send the current step
    });
    sendGAEvent('signup_start'); // Track when signup process is initiated
  }, []); // Only run once on component mount

  // Track when role is changed
  useEffect(() => {
    // Only send if the role has truly changed from its initial 'student' state
    // or if the component re-renders with a different role.
    // Avoids sending 'student_role_selected' immediately on page load.
    if (role === 'student') {
        sendGAEvent('role_selected', { user_role: 'student' });
    } else if (role === 'teacher') {
        sendGAEvent('role_selected', { user_role: 'teacher' });
    }
  }, [role]); // Runs when 'role' state changes

  // Common function to perform the actual registration fetch
  const doRegister = async () => {
    const first_name = name.split(' ')[0] || '';
    const last_name = name.split(' ').slice(1).join(' ') || '';

    // Build up the data object.
    // If it's a teacher, include teacher-related fields too.
    const userData: any = {
      email,
      password,
      first_name,
      last_name,
      user_type: role === 'teacher' ? 'tutor' : 'student',
    };

    if (role === 'teacher') {
      userData.subject = selectedSubject;
      userData.title = title;
      userData.description = description;
      userData.price = price;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const result = await response.json();
      console.log('Success:', result);
      sendGAEvent('signup_success', { user_role: role }); // Track successful registration

      // On success, go to login
      navigate('/login');
    } catch (error: any) {
      console.error('Error:', error);
      sendGAEvent('signup_failure', {
        user_role: role,
        error_message: error.message,
      }); // Track failed registration
      alert(error.message);
    }
  };

  // Called by the form submission button
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError('Паролите не съвпадат');
      sendGAEvent('signup_error', { error_type: 'password_mismatch' });
      return;
    }
    setPasswordError('');

    if (step === 1) {
      // If we are a teacher, go to step 2
      if (role === 'teacher') {
        setStep(2);
        sendGAEvent('signup_step_completed', {
          step_number: 1,
          user_role: role,
        }); // Track completion of step 1 for teachers
      } else {
        // If we are a student, register immediately
        sendGAEvent('signup_step_completed', {
          step_number: 1,
          user_role: role,
        }); // Track completion of step 1 for students (before final register)
        await doRegister();
      }
    } else if (step === 2) {
      // Final teacher registration
      sendGAEvent('signup_step_completed', {
        step_number: 2,
        user_role: role,
      }); // Track completion of step 2 for teachers
      await doRegister();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
            Създайте нов акаунт
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Вече имате акаунт?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-purple-600 transition-colors duration-300"
              onClick={() => sendGAEvent('login_link_clicked_from_signup')} // Track click on login link
            >
              Влезте
            </Link>
          </p>
        </div>

        {step === 1 && (
          <div className="flex justify-center space-x-4 mt-8">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                // Role selection is tracked via useEffect
              }}
              className={`flex items-center px-6 py-3 rounded-xl border-2 transition-all duration-500 transform hover:scale-105 ${
                role === 'student'
                  ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 scale-110 shadow-lg'
                  : 'border-gray-300 hover:border-purple-400 text-gray-700'
              }`}
            >
              <Users
                className={`transition-all duration-300 ${
                  role === 'student' ? 'w-6 h-6 text-blue-600' : 'w-5 h-5'
                }`}
              />
              <span className="ml-2">Ученик</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                // Role selection is tracked via useEffect
              }}
              className={`flex items-center px-6 py-3 rounded-xl border-2 transition-all duration-500 transform hover:scale-105 ${
                role === 'teacher'
                  ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 scale-110 shadow-lg'
                  : 'border-gray-300 hover:border-blue-400 text-gray-700'
              }`}
            >
              <GraduationCap
                className={`transition-all duration-300 ${
                  role === 'teacher' ? 'w-6 h-6 text-purple-600' : 'w-5 h-5'
                }`}
              />
              <span className="ml-2">Учител</span>
            </button>
          </div>
        )}

        <form
          className="mt-8 space-y-6 bg-white shadow-xl rounded-2xl p-8 backdrop-blur-lg bg-opacity-80"
          onSubmit={handleSubmit}
        >
          {step === 1 ? (
            <div className="space-y-5">
              <div className="transform transition-all duration-300 hover:scale-102">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Име
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-102">
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Имейл адрес
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-102">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Парола
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-102">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Потвърди парола
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            // STEP 2: Teacher-specific fields
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Търсене на предмет
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => {
                      setSubjectSearch(e.target.value);
                      setShowSubjects(true);
                    }}
                    onFocus={() => setShowSubjects(true)}
                    placeholder="Въведете предмет..."
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                {showSubjects && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredSubjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setSubjectSearch(subject);
                          setShowSubjects(false);
                          sendGAEvent('subject_selected', { subject_name: subject }); // Track subject selection
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors duration-200"
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="transform transition-all duration-300 hover:scale-102">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заглавие на вашата обява
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Напр: Уроци по математика за ученици от 5-12 клас"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div className="transform transition-all duration-300 hover:scale-102">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена на урок (лв/час)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="60"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                  min="0"
                />
              </div>
            </div>
          )}

          {passwordError && (
            <p className="text-red-500 text-sm text-center mt-2 animate-shake">
              {passwordError}
            </p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-102"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
              </span>
              {step === 1 ? (
                role === 'student' ? 'Регистрация като ученик' : 'Продължи'
              ) : (
                'Завърши регистрация'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;