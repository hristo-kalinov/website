import { useState, useRef, useEffect } from 'react';

const AvailabilityGrid = () => {
  const [availability, setAvailability] = useState(() =>
    Array(7).fill().map(() => Array(48).fill(false)) // 48 slots for 30-minute intervals
  );
  const [isLoading, setIsLoading] = useState(true);
  const isDragging = useRef(false);
  const currentAction = useRef<'available' | 'unavailable' | null>(null);
  const days = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem('token');

        // First, get the user's public_id
        const userResponse = await fetch('http://localhost:8001/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        const tutorId = userData.public_id;

        // Then, fetch availability using the public_id as tutor_id
        const availabilityResponse = await fetch('http://localhost:8001/get-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tutor_id: tutorId }),
        });

        if (!availabilityResponse.ok) {
          throw new Error('Failed to fetch availability');
        }

        const data = await availabilityResponse.json();

        // Initialize a new availability grid
        const newAvailability = Array(7).fill().map(() => Array(48).fill(false));

        // Mark the fetched slots as available
        data.availability.forEach((slot: { day_of_week: number, time_slot: number }) => {
          newAvailability[slot.day_of_week][slot.time_slot] = true;
        });

        setAvailability(newAvailability);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const formatTime = (slotIndex: number) => {
    const hours = Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleMouseAction = (day: number, slotIndex: number, makeAvailable: boolean) => {
    setAvailability(prev => {
      const newAv = prev.map(row => [...row]);
      newAv[day][slotIndex] = makeAvailable;
      return newAv;
    });
  };

  const handleMouseDown = (day: number, slotIndex: number, isLeftClick: boolean) => {
    isDragging.current = true;
    currentAction.current = isLeftClick ? 'available' : 'unavailable';
    handleMouseAction(day, slotIndex, isLeftClick);
  };

  const handleMouseEnter = (day: number, slotIndex: number) => {
    if (isDragging.current && currentAction.current !== null) {
      handleMouseAction(day, slotIndex, currentAction.current === 'available');
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    currentAction.current = null;
  };

  const handleSave = async () => {
    const formattedAvailability = availability.map((daySlots, dayIndex) => ({
      day: dayIndex,
      slots: daySlots
        .map((available, slotIndex) => available ? slotIndex : -1)
        .filter(slotIndex => slotIndex !== -1)
    }));

    try {
      const token = localStorage.getItem('token');

      // First, get the user's public_id again (you might want to store this to avoid repeated calls)
      const userResponse = await fetch('http://localhost:8001/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data for saving');
      }

      const userData = await userResponse.json();
      const tutorId = userData.public_id;

      const response = await fetch('http://localhost:8001/save-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tutor_id: tutorId, availability: formattedAvailability }),
      });

      if (!response.ok) throw new Error('Save failed');
      alert('Настройките са запазени успешно!');
    } catch (error) {
      console.error('Грешка при запазване:', error);
      alert('Възникна грешка при запазване!');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex">
        {/* Time Labels Column - Adjusted height */}
        <div className="pr-2">
          <div className="h-[40px]"></div>
          {Array.from({ length: 48 }).map((_, slotIndex) => (
            <div
              key={slotIndex}
              className="h-8 flex items-center justify-end text-xs text-gray-500 mb-[1px]"
            >
              {slotIndex % 2 === 0 && (
                <span className="mr-2">{formatTime(slotIndex)}</span>
              )}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {days.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-50 rounded-t"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Availability Cells - Adjusted height */}
          <div
            className="grid grid-cols-7 gap-px relative"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {Array.from({ length: 48 }).map((_, slotIndex) => (
              <div key={slotIndex} className="contents">
                {days.map((_, day) => (
                  <div
                    key={`${day}-${slotIndex}`}
                    className={`h-8 cursor-pointer transition-colors ${
                      availability[day][slotIndex]
                        ? 'bg-blue-400 hover:bg-blue-500'
                        : 'bg-white hover:bg-gray-50'
                    } border-b border-r border-gray-100 group`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(day, slotIndex, e.button === 0);
                    }}
                    onMouseEnter={() => handleMouseEnter(day, slotIndex)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div className={`w-full h-full ${
                      availability[day][slotIndex]
                        ? 'hover:bg-blue-600/10'
                        : 'hover:bg-blue-400/10'
                    }`} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button and Footer */}
      <div className="mt-4 flex justify-between items-center pl-[72px]">
        <div className="text-sm text-gray-500">
          Ляв бутон: маркиране като свободен • Десен бутон: маркиране като зает
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Запазване на разписанието
        </button>
      </div>
    </div>
  );
};

export default AvailabilityGrid;