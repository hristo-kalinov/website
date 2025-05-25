import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Classroom from './pages/Classroom';
import Settings from './pages/Settings';
import TutorSearch from './pages/TutorSearch';
import TutorProfile from './pages/TutorProfile';
import AuthenticatedLayout from './pages/AuthenticatedLayout';
import SetAvailability from './pages/SetAvailability.tsx';
import BookLesson from './pages/BookLesson.tsx';
import Lessons from './pages/Lessons.tsx';
import Verification from './pages/Verification.tsx';
import UniStudentTutorOnboarding from './pages/UniStudentTutorOnboarding.tsx';
function PublicNavBar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img 
                src="/favicon.png" 
                alt="Logo" 
                className="h-8 w-8 md:h-12 md:w-12" 
              />
            <span className="text-xl font-bold text-gray-900">Infizity</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Вход
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LayoutWrapper() {
  return <AuthenticatedLayout><Outlet /></AuthenticatedLayout>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <>
              <PublicNavBar />
              <Home />
            </>
          } />
          <Route path="/login" element={
            <>
              <PublicNavBar />
              <Login />
            </>
          } />
          <Route path="/signup" element={
            <>
              <PublicNavBar />
              <SignUp />
            </>
          } />
          <Route path="/verification" element={<Verification/>}/>
          <Route path="/tutor_onboarding1" element={
            <>
              <PublicNavBar />
              <UniStudentTutorOnboarding />
            </>
          } />
          {/* Authenticated routes */}
          <Route element={<LayoutWrapper />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tutors" element={<TutorSearch />} />
            <Route path="/tutors/:id" element={<TutorProfile />} />
            <Route path="/availability" element={<SetAvailability/>}/>
            <Route path="/book_lesson/:id" element={<BookLesson/>}/>
            <Route path="/lessons" element={<Lessons/>}/>
          </Route>


          {/* 404 page */}
          <Route path="*" element={
            <>
              <PublicNavBar />
              <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-bold text-gray-900">404 - Page Not Found</h1>
                <p className="mt-4 text-gray-600">The page you're looking for doesn't exist.</p>
                <Link 
                  to="/" 
                  className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;