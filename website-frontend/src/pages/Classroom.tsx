import React, { useState } from 'react';
import { AuthenticatedLayout } from './Dashboard';

function Classroom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const joinMeeting = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch('http://localhost:8001/generate-jitsi-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Jitsi token.');
      }

      const data = await response.json();
      const { jitsi_token, room } = data;

      const domain = 'localhost:8443';
      const roomName = room;

      const url = `https://${domain}/${roomName}?jwt=${jitsi_token}`;
      window.open(url, '_blank', 'noopener,noreferrer');

    } catch (err) {
      console.error('Error joining meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Virtual Classroom</h1>

        <button
          onClick={joinMeeting}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining...
            </>
          ) : (
            'Start/Join Classroom'
          )}
        </button>

        {error && (
          <div className="mt-4 text-red-600">{error}</div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Classroom;