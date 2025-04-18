import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from './Dashboard';
import { Star, Clock, Calendar, MessageSquare, Video, Users, Award, BookOpen, Globe, CheckCircle, ThumbsUp, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';

function TutorProfile() {
  const [selectedTab, setSelectedTab] = useState('about');
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch(`http://localhost:8001/tutors/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to match your frontend expectations
        const transformedTutor = {
          ...data,
          name: data.name,
          subject: data.subject,
          rating: data.rating,
          price: data.price,
          image: data.image,
          description: data.description,
          profile_title: data.profile_title || `${data.name}'s Profile`,
          total_reviews: data.total_reviews || 0
        };
        
        setTutor(transformedTutor);

      } catch (err) {
        setError(err.message || 'Failed to fetch tutor data');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!tutor) return <div>Tutor not found</div>;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
              <img
                src={tutor.image ? `http://localhost:8001${tutor.image}` : 'http://localhost:8001/uploads/default_pfp.webp'}
                alt={tutor.name}
                className="w-40 h-40 rounded-2xl object-cover shadow-lg"
              />
              <div className="absolute -bottom-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                Онлайн
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tutor.name}</h1>
                  <p className="text-lg text-gray-600 mt-1">{tutor.profile_title}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>1250+ часа</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{tutor.price} лв.</p>
                  <p className="text-gray-500">на час</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Изпрати съобщение
                </button>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Запази час
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="col-span-2 space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'about', label: 'За мен' },
                  { id: 'reviews', label: 'Отзиви' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`py-4 px-1 relative ${
                      selectedTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {selectedTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {selectedTab === 'about' && (
              <div className="space-y-8">
                {tutor.description && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">За мен</h3>
                    <p className="text-gray-600 whitespace-pre-line">{tutor.description}</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  {tutor.total_reviews > 0 ? (
                    <p className="text-gray-600">Отзиви ще бъдат показани тук</p>
                  ) : (
                    <p className="text-gray-600">Няма налични отзиви все още.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {tutor.subject && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Предмети</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                    {tutor.subject}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Статистика</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ThumbsUp className="w-5 h-5 text-gray-400 mr-2" />
                    <span>Процент на отговаряне</span>
                  </div>
                  <span className="font-medium">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-2" />
                    <span>Средно време за отговор</span>
                  </div>
                  <span className="font-medium">2 часа</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default TutorProfile;