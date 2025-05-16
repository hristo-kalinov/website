import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
const BookLesson = () => {
  const { id: tutorId } = useParams();
  const [availability, setAvailability] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [frequency, setFrequency] = useState('once');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);
  const navigate = useNavigate();


  const dayNames = {
    0: 'Понеделник',
    1: 'Вторник',
    2: 'Сряда',
    3: 'Четвъртък',
    4: 'Петък',
    5: 'Събота',
    6: 'Неделя'
  };

  const slotToTime = (slot) => {
    const totalMinutes = slot * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) acc[day] = [];

    const lastBlock = acc[day][acc[day].length - 1];
    if (lastBlock && slot.time_slot === lastBlock.endSlot + 1) {
      lastBlock.endSlot = slot.time_slot;
      lastBlock.endTime = slotToTime(slot.time_slot + 1);
    } else {
      acc[day].push({
        day,
        startSlot: slot.time_slot,
        endSlot: slot.time_slot,
        startTime: slotToTime(slot.time_slot),
        endTime: slotToTime(slot.time_slot + 1)
      });
    }

    return acc;
  }, {});

  const getAvailableDurations = (startSlot, day) => {
    const dayBlocks = groupedAvailability[day] || [];
    const block = dayBlocks.find(b =>
      b.startSlot <= startSlot && b.endSlot >= startSlot
    );

    if (!block) return [];

    const maxSlots = block.endSlot - startSlot + 1;
    return Array.from({ length: maxSlots }, (_, i) => i + 1);
  };

  const toggleDay = (day) => {
    setExpandedDay(expandedDay === day ? null : day);
    setSelectedStart(null);
    setSelectedDuration(1);
  };

  const handleStartSelect = (day, slot) => {
    setSelectedStart({ day, slot });
    setSelectedDuration(1);
  };

  

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8001/get-availability', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tutor_id: tutorId, with_booking: true }) // Ensure this matches your backend
        });  
        // 3. Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || 
            `HTTP Error: ${response.status} ${response.statusText}`
          );
        }
  
        // 4. Validate response format
        const data = await response.json();
        console.log('API Response:', data); // Debug raw response
  
        if (!data.availability || !Array.isArray(data.availability)) {
          throw new Error('Invalid availability data format');
        }
  
        // 5. Update state
        setAvailability(data.availability);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setAvailability([]); // Reset availability on error
      } finally {
        setLoading(false);
      }
    };
  
    fetchAvailability();
  }, [tutorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedStart) {
      setError('Моля изберете начален час');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 2. Proceed with booking
      const response = await fetch(`http://localhost:8001/book-lesson/${tutorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: 2,
          day_of_week: selectedStart.day,
          time_slot: selectedStart.slot,
          duration: selectedDuration,
          frequency
        })
      });

      if (!response.ok) throw new Error('Грешка при резервацията');

      setSelectedStart(null);
      setSelectedDuration(1);
      setError('');
      setSuccess('Урокът е резервиран успешно!');
      setTimeout(() => {
        navigate('/dashboard'); // or whatever your dashboard route is
      }, 1000); // Optional delay to briefly show success message
    } catch (err) {
      setError(err.message);
      console.error('Booking error:', err);
    }
  };

  


  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-700 px-6 py-6">
          <h1 className="text-2xl font-bold text-white">Резервиране на урок</h1>
          <p className="mt-1 text-indigo-100">Изберете предпочитаното време</p>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-start">
              <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Available days section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Налични дни</h2>

              {Object.entries(groupedAvailability).length === 0 && !loading && (
                <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                  Няма намерени налични часове за този учител.
                </div>
              )}

              {Object.entries(groupedAvailability).map(([day, blocks]) => (
                <div key={day} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleDay(parseInt(day))}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-base font-medium text-gray-800">{dayNames[day]}</h3>
                    <svg
                      className={`h-5 w-5 text-gray-500 transform transition-transform ${
                        expandedDay === parseInt(day) ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {expandedDay === parseInt(day) && (
                    <div className="p-4 bg-white">
                      {blocks.map((block, blockIndex) => (
                        <div key={blockIndex} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-800">
                              Налично: {block.startTime} - {block.endTime}
                            </span>
                          </div>

                          {/* Time slots */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                            {Array.from({ length: block.endSlot - block.startSlot + 1 }).map((_, i) => {
                              const slot = block.startSlot + i;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleStartSelect(parseInt(day), slot)}
                                  className={`py-2 px-2 text-sm rounded-md transition-all ${
                                    selectedStart?.day === parseInt(day) && selectedStart?.slot === slot
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  {slotToTime(slot)}
                                </button>
                              );
                            })}
                          </div>

                          {/* Duration selection */}
                          {selectedStart?.day === parseInt(day) && selectedStart?.slot >= block.startSlot && selectedStart?.slot <= block.endSlot && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Изберете продължителност
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {getAvailableDurations(selectedStart.slot, day).map(duration => (
                                  <button
                                    key={duration}
                                    type="button"
                                    onClick={() => setSelectedDuration(duration)}
                                    className={`py-2 px-2 text-sm rounded-md transition-all ${
                                      selectedDuration === duration
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    {duration * 30} мин
                                  </button>
                                ))}
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Избрано: {slotToTime(selectedStart.slot)} - {slotToTime(selectedStart.slot + selectedDuration)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Booking type */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Тип резервация</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  frequency === 'once' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="frequency"
                      value="once"
                      checked={frequency === 'once'}
                      onChange={() => setFrequency('once')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">Еднократен урок</span>
                      <span className="block text-xs text-gray-500 mt-1">Единична резервация</span>
                    </div>
                  </div>
                </label>
                <label className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  frequency === 'weekly' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={frequency === 'weekly'}
                      onChange={() => setFrequency('weekly')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">Седмични уроци</span>
                      <span className="block text-xs text-gray-500 mt-1">Редовна седмична резервация</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            
            {/* Submit button */}
            <button
              type="submit"
              disabled={!selectedStart}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md text-base"
            >
              {selectedStart ? (
                frequency === 'weekly' ? (
                  `Резервирай седмичен урок от ${slotToTime(selectedStart.slot)} за ${selectedDuration * 30} минути`
                ) : (
                  `Резервирай урок за ${slotToTime(selectedStart.slot)} - ${slotToTime(selectedStart.slot + selectedDuration)}`
                )
              ) : (
                'Изберете време за резервация'
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookLesson;