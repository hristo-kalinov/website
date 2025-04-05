import React from 'react';
import { AuthenticatedLayout } from './Dashboard';

function Classroom() {
  return (
    <AuthenticatedLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Класна стая</h1>
        <div className="bg-white rounded-lg">
          <p className="text-gray-600">Нямате активни уроци в момента.</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Classroom;