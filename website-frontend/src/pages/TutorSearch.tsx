import React, { useState, useEffect } from 'react';
import { Search, Sliders, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

function TutorSearch() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate(); // Get the navigate function
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [priceRange, setPriceRange] = useState(100);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = () => {
      fetch(`${API_URL}/tutors/subjects`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch subjects');
          }
          return response.json();
        })
        .then((data) => {
          setSubjects(data);
        })
        .catch((err) => {
          // Handle errors, but no redirect needed for subjects fetch usually
          console.error("Error fetching subjects:", err);
          // setError(err.message); // Optional: display subject fetch error
        });
    };
    fetchSubjects();
  }, []);

  // Fetch tutors whenever filters change
  useEffect(() => {
    const fetchTutors = () => {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search_term', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);
      params.append('max_price', priceRange);

      const token = localStorage.getItem('token');
      console.log("Token:", token); // Debugging line to check token value
      // If token is missing, redirect immediately
      if (!token) {
        setIsLoading(false);
        // Use navigate for redirection within React Router
        navigate('/login'); 
        return; // Stop the fetch call
      }

      fetch(`${API_URL}/tutors/search?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }, // Always send token if available
      })
        .then((response) => {
          // Check for unauthorized or forbidden status codes
          if (response.status === 401 || response.status === 403) {
            // Token is invalid or expired
            localStorage.removeItem('token'); // Clear invalid token
            // Use navigate for redirection within React Router
            navigate('/login'); 
            // Throw an error or return to stop further processing
            throw new Error('Authentication failed. Please login again.');
          }
          if (!response.ok) {
            throw new Error('Failed to fetch tutors');
          }
          return response.json();
        })
        .then((data) => {
          setTutors(data);
        })
        .catch((err) => {
          // If the error was the auth error, navigate already handled it
          if (err.message !== 'Authentication failed. Please login again.') {
            setError(err.message);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // Add a small debounce to prevent too many requests while typing
    const timer = setTimeout(() => {
      fetchTutors();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSubject, priceRange, navigate]); // Add navigate to dependency array

  return (
      <div className="space-y-6">
        {/* Search Header */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Търсете по име или предмет..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`p-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 ${isFiltersOpen ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {isFiltersOpen && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
              {/* Subjects */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Предмет
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  <button
                    onClick={() => setSelectedSubject('')}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm rounded-lg border min-h-[2.75rem] ${
                      selectedSubject === ''
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="line-clamp-2">Всички</span>
                    {selectedSubject === '' && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
                  </button>
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm rounded-lg border min-h-[2.75rem] ${
                        selectedSubject === subject
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="line-clamp-2">{subject}</span>
                      {selectedSubject === subject && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Максимална цена
                </label>
                <div className="px-2">
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="mt-1 flex justify-between text-sm text-gray-500">
                    <span>20 лв.</span>
                    <span className="text-blue-600 font-medium">{priceRange} лв.</span>
                    <span>200 лв.</span>
                  </div>
                </div>
                </div>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutors.length > 0 ? (
              tutors.map((tutor) => (
                <Link
                  to={`${tutor.public_id}`}
                  key={tutor.public_id}
                  className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={`${API_URL}${tutor.image}`}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{tutor.name}</h3>
                          <p className="text-sm text-gray-600">{tutor.subject}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{tutor.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">{tutor.price} лв./час</span>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Свържи се
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500">Няма намерени учители с избраните филтри</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}

export default TutorSearch;