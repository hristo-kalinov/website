import React, { useEffect } from 'react'; // Import useEffect
import { Link } from 'react-router-dom';
import { Video, MessageCircle, Calendar, Users, Award, DollarSign } from 'lucide-react'; // Added new icons

const features = [
  {
    icon: <Video className="h-6 w-6" />,
    title: 'Гъвкави онлайн срещи',
    description: 'Преподавай удобно от вкъщи или от университета, без излишни разходи и пътувания. Всичко е онлайн!',
  },
  {
    icon: <DollarSign className="h-6 w-6" />, // Changed icon for emphasis on free
    title: '100% Без такси',
    description: 'Всичко, което изкараш, остава за теб – 100% без скрити такси. Защото образованието трябва да е достъпно!',
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Ти избираш графика си',
    description: 'Настрой си часовете според твоето разписание – идеално за заети студенти от ФМИ и други университети.',
  },
  {
    icon: <Users className="h-6 w-6" />, // New feature
    title: 'Част от общност',
    description: 'Свържи се с други студенти и преподаватели в България. Споделяйте знания и растете заедно.',
  },
  {
    icon: <Award className="h-6 w-6" />, // New feature
    title: 'Помогни на България',
    description: 'Допринеси за подобряване на българското образование, като помагаш на ученици и студенти.',
  },
];

function Home() {
  // Use useEffect to send a page view event when the component mounts
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2071&q=80"
            alt="Студент учи пред лаптоп"
          />
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Студент ли си? Преподавай и помагай на бъдещите таланти на България.
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl mx-auto">
            Ние сме студенти от ФМИ, точно като теб. Създадохме тази платформа, за да ти е лесно да споделяш знания, без такси и с пълна свобода на графика. Помогни на другите да успеят!
          </p>
          <div className="mt-10">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Започни да преподаваш безплатно днес!
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Защо да избереш нашата платформа?</h2>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex flex-col items-start p-6 rounded-lg shadow-md bg-gray-50 hover:shadow-xl transition duration-300 ease-in-out">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-500 text-white shadow-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-base text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-12 mt-12 lg:grid-cols-2">
          {features.slice(3).map((feature, index) => (
            <div key={index} className="flex flex-col items-start p-6 rounded-lg shadow-md bg-gray-50 hover:shadow-xl transition duration-300 ease-in-out">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-500 text-white shadow-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-base text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-12">Как работи? Лесно е!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-blue-600 text-5xl font-extrabold mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Регистрирай се</h3>
              <p className="text-gray-700">Създай своя профил на преподавател за няколко минути. Покажи своите умения и опит.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-blue-600 text-5xl font-extrabold mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Потвърди имейла си</h3>
              <p className="text-gray-700">Целта ни е да осигурим качество!</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-blue-600 text-5xl font-extrabold mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Започни да преподаваш</h3>
              <p className="text-gray-700">Свържи се с ученици и студенти от цяла България. Помагни им да си усвоят материала и изкарвай пари от вкъщи!</p>
            </div>
          </div>
          <div className="mt-12">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-blue-600 hover:bg-green-700 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Създай своя профил сега
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Us - Detailed Benefits */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Предимства да преподаваш с нас</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Не взимаме никакви такси! Взимаш 100% от това, което изкарваш</h3>
            <p className="text-gray-700">Няма такси за нашата платформа. Ние вярваме в безплатния достъп до знание за всички в България. Всичко, което преподаваш, е чисто за теб. Развивай се без финансови бариери.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Преподавай навсякъде, по всяко време</h3>
            <p className="text-gray-700">Реши кога и колко часа искаш да преподаваш. Без изисквания за време или фиксиран график. Бъди свой собствен шеф докато учиш или работиш.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Професионално израстване</h3>
            <p className="text-gray-700">Усъвършенствай преподавателските си умения, докато помагаш на другите. Ние подкрепяме развитието на общността от преподаватели.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Свържи се с много ученици и студенти</h3>
            <p className="text-gray-700">Нашата платформа е създадена, за да свързва студенти и ученици от цяла България. Ще имаш постоянен поток от желаещи да учат.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Удобен календар и класна стая</h3>
            <p className="text-gray-700">Интуитивен календар за управление на срещите ти и интерактивна онлайн класна стая, която прави преподаването лесно и приятно.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Подкрепяща общност</h3>
            <p className="text-gray-700">Присъедини се към общност от мотивирани студенти и преподаватели. Винаги ще намериш подкрепа и съвети от съмишленици.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Често задавани въпроси</h2>
        <div className="space-y-6">
          <details className="group border border-gray-200 rounded-lg p-6">
            <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-gray-900">
              Какви преподаватели търсите?
              <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-gray-700">Търсим мотивирани студенти, които имат знания по различни предмети (математика, програмиране, езици, химия и др.) и желание да помагат на другите. Опит в преподаването е предимство, но не е задължителен – важно е желанието!</p>
          </details>
          <details className="group border border-gray-200 rounded-lg p-6">
            <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-gray-900">
              По какви предмети мога да преподавам?
              <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-gray-700">Можеш да преподаваш по всеки предмет, по който се чувстваш уверен. От училищни предмети до университетски дисциплини, включително подготовка за матури, кандидатстудентски изпити, и т.н. Просто го добави в профила си!</p>
          </details>
          <details className="group border border-gray-200 rounded-lg p-6">
            <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-gray-900">
              Как да стана онлайн преподавател във вашата платформа?
              <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-gray-700">Процесът е прост: 1. Регистрирай се на нашия сайт. 2. Попълни профила си с информация за себе си, предметите, по които искаш да преподаваш и свободните ти часове. 3. Потвърди имейла си. 4. Започни да провеждаш онлайн уроци!</p>
          </details>
          <details className="group border border-gray-200 rounded-lg p-6">
            <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-gray-900">
              Какви компютърни изисквания имам за преподаване?
              <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-gray-700">Ще ти е необходим компютър с надеждна интернет връзка, уебкамера и микрофон. Препоръчително е да използваш слушалки за по-добро качество на звука. Нашата платформа е уеб-базирана, така че не се налага инсталиране на специален софтуер.</p>
          </details>
          <details className="group border border-gray-200 rounded-lg p-6">
            <summary className="flex justify-between items-center cursor-pointer text-lg font-semibold text-gray-900">
              Безплатно ли е да създам профил на преподавател?
              <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-gray-700">Да, създаването на профил и използването на платформата е абсолютно безплатно за преподаватели и ученици! Ние сме създали тази платформа с идеята за достъпно образование за всички в България.</p>
          </details>
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-700">Имаш още въпроси? Свържи се с нас на infizity.com@gmail.com.</p>
        </div>
      </div>

      {/* Call to Action at the bottom */}
      <div className="bg-blue-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Преподавай онлайн и допринеси за бъдещето на образованието в България!
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Свържи се с хиляди ученици и студенти и преподавай от уюта на дома си.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-10 py-5 border border-transparent text-xl font-medium rounded-full text-blue-600 bg-white hover:bg-gray-100 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Създай профил още сега
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;