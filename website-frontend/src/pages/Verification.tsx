// src/pages/Verification.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Verification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Потвърждаване на имейл...');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage('Липсва токен или имейл за потвърждение');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8001/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Имейлът беше успешно потвърден. Пренасочваме ви...');
          
          // Redirect after 5 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 5000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.detail || 'Грешка при потвърждение на имейл');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Възникна грешка при свързване със сървъра');
        console.error('Грешка при потвърждение:', error);
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return {
          textColor: 'text-green-600',
          bgColor: 'bg-green-100',
          progressColor: 'bg-green-600',
        };
      case 'error':
        return {
          textColor: 'text-red-600',
          bgColor: 'bg-red-100',
          progressColor: 'bg-red-600',
        };
      default:
        return {
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          progressColor: 'bg-blue-600',
        };
    }
  };

  const { textColor, bgColor, progressColor } = getStatusStyles();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className={`w-full max-w-md p-8 rounded-lg shadow-md text-center ${bgColor}`}>
        <div className={`text-xl font-medium mb-6 ${textColor}`}>
          {message}
        </div>
        
        {status === 'pending' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {status === 'success' && (
          <>
            <p className="mb-6">Благодарим ви, че потвърдихте вашия имейл адрес.</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${progressColor} h-1.5 rounded-full animate-[progress_5s_linear_forwards]`}
                style={{ width: '0%' }}
              ></div>
            </div>
          </>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Обратно към началната страница
          </button>
        )}
      </div>
    </div>
  );
}