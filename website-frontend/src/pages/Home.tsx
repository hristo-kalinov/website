import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Globe2, Clock } from 'lucide-react';

const features = [
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Квалифицирани преподаватели',
    description: 'Учете от сертифицирани преподаватели с богат опит',
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    title: 'Онлайн обучение',
    description: 'Учете от всяка точка на света в удобно за вас време',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Гъвкав график',
    description: 'Изберете време, което пасва на вашия график',
  },
];

function Home() {
  return (
    <div className="bg-white">
      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2071&q=80"
            alt="Students learning"
          />
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50" />
        </div>
        
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Намерете перфектния учител онлайн
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            Открийте най-добрите преподаватели за индивидуални онлайн уроци. 
            Учете езици, математика, музика и много други предмети от комфорта на вашия дом.
          </p>
          <div className="mt-10">
            <Link
              to="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Започнете сега
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-base text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;