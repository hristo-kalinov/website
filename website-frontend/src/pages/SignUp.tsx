import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { GraduationCap, Users } from 'lucide-react';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Паролите не съвпадат');
      return;
    }
  
    setPasswordError('');
  
    const userData = {
      email,
      password,
      first_name: name.split(' ')[0], // Assumes the first word is the first name
      last_name: name.split(' ').slice(1).join(' ') || '', // The rest is the last name
      user_type: role === 'teacher' ? 'tutor' : 'student',
    };
  
    try {
      const response = await fetch('http://localhost:8000/register', {
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
      // Removed the alert and added redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };
  

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Създайте нов акаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Или{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              влезте във вашия акаунт
            </Link>
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex items-center px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
              role === 'student'
                ? 'border-blue-600 bg-blue-50 text-blue-700 scale-110 shadow-md'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            <Users className={`mr-2 transition-all duration-200 ${
              role === 'student' ? 'w-6 h-6' : 'w-5 h-5'
            }`} />
            Ученик
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`flex items-center px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
              role === 'teacher'
                ? 'border-blue-600 bg-blue-50 text-blue-700 scale-110 shadow-md'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            <GraduationCap className={`mr-2 transition-all duration-200 ${
              role === 'teacher' ? 'w-6 h-6' : 'w-5 h-5'
            }`} />
            Учител
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Име
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Име"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Имейл адрес
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Имейл адрес"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Парола
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Парола"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Потвърди парола
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Потвърди парола"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-red-500 text-sm text-center">{passwordError}</p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Регистрация като {role === 'student' ? 'ученик' : 'учител'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;