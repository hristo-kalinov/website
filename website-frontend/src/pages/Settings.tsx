import React, { useState } from 'react';
import { Bell, Lock, User, Mail } from 'lucide-react';

function SettingsSection({ title, description, children }) {
  return (
    <div className="py-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {children}
      </div>
    </div>
  );
}

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  return (
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <SettingsSection
            title="Профил"
            description="Управлявайте информацията за вашия профил"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700">
                  Имейл адрес
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value="ivan.ivanov@example.com"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Промени
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700">
                  Парола
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value="********"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Промени
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Известия"
            description="Изберете как искате да получавате известия"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Имейл известия
                  </p>
                  <p className="text-sm text-gray-500">
                    Получавайте известия за нови съобщения
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    SMS известия
                  </p>
                  <p className="text-sm text-gray-500">
                    Получавайте SMS известия за важни промени
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmsNotifications(!smsNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    smsNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Сигурност"
            description="Управлявайте настройките за сигурност на вашия акаунт"
          >
            <div className="p-4">
              <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <span>Двуфакторна автентикация</span>
                <span className="text-sm text-gray-500">Неактивна</span>
              </button>
            </div>
          </SettingsSection>
        </div>
        <div className="flex justify-end max-w-3xl mx-auto">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Запази промените
          </button>
        </div>
      </div>
  );
}

export default Settings;