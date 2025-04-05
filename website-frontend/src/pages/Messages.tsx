import React, { useState } from 'react';
import { AuthenticatedLayout } from './Dashboard';
import { Send, Search, MoreVertical, Phone, Video, ChevronLeft } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Мария Иванова',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'Добре, ще се видим утре в 15:00',
    time: '10:30',
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: 'Здравейте! Бих искала да запиша час за утре.', sender: 'them', time: '10:15' },
      { id: 2, text: 'Разбира се! В колко часа предпочитате?', sender: 'me', time: '10:20' },
      { id: 3, text: 'Може ли в 15:00?', sender: 'them', time: '10:25' },
      { id: 4, text: 'Добре, ще се видим утре в 15:00', sender: 'them', time: '10:30' },
    ]
  },
  {
    id: 2,
    name: 'Георги Димитров',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'Благодаря за урока днес!',
    time: '09:15',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Здравейте! Имам въпрос за домашното.', sender: 'them', time: '09:00' },
      { id: 2, text: 'Кажете, с какво мога да помогна?', sender: 'me', time: '09:05' },
      { id: 3, text: 'Вече разбрах, извинете за безпокойството.', sender: 'them', time: '09:10' },
      { id: 4, text: 'Благодаря за урока днес!', sender: 'them', time: '09:15' },
    ]
  },
];

function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg overflow-hidden">
        {/* Conversations List */}
        <div className={`w-80 border-r border-gray-200 flex flex-col ${
          isMobileView && selectedConversation ? 'hidden' : 'block'
        }`}>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Търсене на съобщения..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conv);
                  setIsMobileView(true);
                }}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-xs font-medium text-white">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col ${
            isMobileView && !selectedConversation ? 'hidden' : 'block'
          }`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isMobileView && (
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      setIsMobileView(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.online ? 'Онлайн' : 'Офлайн'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      message.sender === 'me'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Напишете съобщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Изберете разговор, за да започнете
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Messages;