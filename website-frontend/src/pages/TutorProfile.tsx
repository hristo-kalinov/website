import React, { useState } from 'react';
import { AuthenticatedLayout } from './Dashboard';
import { Star, Clock, Calendar, MessageSquare, Video, Users, Award, BookOpen, Globe, CheckCircle, ThumbsUp, MapPin } from 'lucide-react';

function TutorProfile() {
  const [selectedTab, setSelectedTab] = useState('about');

  const tutor = {
    name: 'Мария Петрова',
    title: 'Старши преподавател по математика',
    rating: 4.9,
    totalReviews: 128,
    hourlyRate: 50,
    totalStudents: 234,
    totalHours: 1250,
    joinedDate: 'март 2022',
    languages: ['Български', 'Английски', 'Руски'],
    subjects: ['Математика', 'Алгебра', 'Геометрия'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80',
    availability: [
      { day: 'Понеделник', slots: ['09:00 - 12:00', '15:00 - 18:00'] },
      { day: 'Вторник', slots: ['10:00 - 14:00', '16:00 - 19:00'] },
      { day: 'Сряда', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Четвъртък', slots: ['11:00 - 15:00', '16:00 - 19:00'] },
      { day: 'Петък', slots: ['09:00 - 13:00', '15:00 - 18:00'] },
    ],
    education: [
      {
        degree: 'Магистър по Математика',
        school: 'Софийски Университет',
        year: '2018',
      },
      {
        degree: 'Бакалавър по Приложна Математика',
        school: 'Технически Университет - София',
        year: '2016',
      },
    ],
    certifications: [
      {
        name: 'Сертифициран учител по математика',
        issuer: 'Министерство на образованието',
        year: '2019',
      },
      {
        name: 'Advanced Teaching Methods Certificate',
        issuer: 'Cambridge Teaching Academy',
        year: '2020',
      },
    ],
    reviews: [
      {
        id: 1,
        student: 'Георги Димитров',
        rating: 5,
        date: '15.03.2024',
        comment: 'Мария е невероятен преподавател! Благодарение на нейните уроци успях да повиша значително оценките си по математика. Обясненията ѝ са ясни и разбираеми.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
      },
      {
        id: 2,
        student: 'Елена Иванова',
        rating: 5,
        date: '10.03.2024',
        comment: 'Изключително търпелив и отдаден преподавател. Винаги намира начин да обясни и най-сложните концепции по разбираем начин.',
        avatar: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
      },
    ],
    about: `С над 8 години опит в преподаването на математика, моята мисия е да направя математиката разбираема и интересна за всеки ученик. Специализирам се в подготовката за матури и кандидатстудентски изпити, както и в работата с ученици от всички класове.

Моят подход към преподаването е индивидуален - съобразявам се с темпото и стила на учене на всеки ученик. Използвам разнообразни методи и материали, за да направя уроците интересни и ефективни.

Вярвам, че всеки може да научи математика, стига да му бъде представена по правилния начин. Моята цел е не само да помогна на учениците да подобрят оценките си, но и да развият логическо мислене и увереност в способностите си.`,
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
              <img
                src={`http://localhost:8001${tuto}`}
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
                  <p className="text-lg text-gray-600 mt-1">{tutor.title}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{tutor.rating}</span>
                      <span className="text-gray-500 ml-1">({tutor.totalReviews} отзива)</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="w-5 h-5 mr-1" />
                      <span>{tutor.totalStudents} ученици</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>{tutor.totalHours}+ часа</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{tutor.hourlyRate} лв.</p>
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
                  { id: 'schedule', label: 'График' },
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
                <div>
                  <h3 className="text-xl font-semibold mb-4">За мен</h3>
                  <p className="text-gray-600 whitespace-pre-line">{tutor.about}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Образование</h3>
                  <div className="space-y-4">
                    {tutor.education.map((edu, index) => (
                      <div key={index} className="flex items-start">
                        <Award className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                        <div>
                          <h4 className="font-medium">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.school}</p>
                          <p className="text-sm text-gray-500">{edu.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Сертификати</h3>
                  <div className="space-y-4">
                    {tutor.certifications.map((cert, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3" />
                        <div>
                          <h4 className="font-medium">{cert.name}</h4>
                          <p className="text-gray-600">{cert.issuer}</p>
                          <p className="text-sm text-gray-500">{cert.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                {tutor.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.avatar}
                        alt={review.student}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{review.student}</h4>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="mt-2 text-gray-600">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">График на свободните часове</h3>
                <div className="grid gap-4">
                  {tutor.availability.map((day, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{day.day}</h4>
                        <div className="flex gap-2">
                          {day.slots.map((slot, slotIndex) => (
                            <button
                              key={slotIndex}
                              className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Предмети</h3>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Езици на преподаване</h3>
              <div className="space-y-3">
                {tutor.languages.map((language, index) => (
                  <div key={index} className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{language}</span>
                  </div>
                ))}
              </div>
            </div>

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <span>Член от</span>
                  </div>
                  <span className="font-medium">{tutor.joinedDate}</span>
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