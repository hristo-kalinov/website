import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from './Dashboard';
import { Send, Search, MoreVertical, Phone, Video, ChevronLeft, Menu } from 'lucide-react';

function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On larger screens, always show sidebar
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:8001/users/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:8001/conversations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    if (currentUser) fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const ws = new WebSocket(`ws://localhost:8001/ws/${currentUser.id}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          const { conversation_id, message } = data;

          setSelectedConversation((prev) => {
            if (!prev || prev.id !== conversation_id) return prev;
            return {
              ...prev,
              messages: [...prev.messages, message],
            };
          });

          setConversations((prevConvs) =>
            prevConvs.map((conv) =>
              conv.id === conversation_id
                ? {
                    ...conv,
                    last_message_content: message.content,
                    last_message_time: message.sent_at,
                    unread_count: (conv.unread_count || 0) + 1,
                  }
                : conv
            )
          );
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onclose = () => {
      console.warn("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, [currentUser]);

  const handleSelectConversation = async (conv) => {
    try {
      const response = await fetch(`http://localhost:8001/conversations/${conv.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      setSelectedConversation({ ...conv, messages });

      // Mark as read
      setConversations(prevConvs =>
        prevConvs.map(c =>
          c.id === conv.id ? { ...c, unread_count: 0 } : c
        )
      );

      if (isMobile) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`http://localhost:8001/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setSelectedConversation(prev => ({
          ...prev,
          messages: [...prev.messages, sentMessage],
        }));
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
  };

  const filteredConversations = conversations.filter(conv =>
    `${conv.tutor_first_name || conv.student_first_name} ${conv.tutor_last_name || conv.student_last_name}`
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <AuthenticatedLayout>
      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg overflow-hidden shadow-sm relative">
        {isMobile && !showSidebar && (
          <button
            onClick={handleBackToConversations}
            className="fixed left-4 top-24 z-20 p-2 bg-white rounded-full shadow-md"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {isMobile ? (
          // Mobile View
          selectedConversation ? (
            // Show Chat Window
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToConversations}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <img
                    src={selectedConversation.tutor_image || selectedConversation.student_image || '/default-avatar.png'}
                    alt={selectedConversation.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {currentUser.user_type === 'tutor'
                        ? `${selectedConversation.student_first_name} ${selectedConversation.student_last_name}`
                        : `${selectedConversation.tutor_first_name} ${selectedConversation.tutor_last_name}`}
                    </h3>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded-full">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded-full">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Start a new conversation
                  </div>
                ) : (
                  selectedConversation.messages.map((message) => {
                    const isMe = message.sender_id === currentUser.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 text-right ${
                            isMe ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.sent_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
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
            // Show Conversations List
            <div className="w-full border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations found</div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isTutor = currentUser.user_type === 'tutor';
                    const name = isTutor
                      ? `${conv.student_first_name} ${conv.student_last_name}`
                      : `${conv.tutor_first_name} ${conv.tutor_last_name}`;
                    const avatar = isTutor ? conv.student_image : conv.tutor_image;
                    const lastMessage = conv.last_message_content;
                    const lastMessageTime = conv.last_message_time;
                    const unread = conv.unread_count || 0;

                    return (
                      <button
                        key={conv.id}
                        className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleSelectConversation(conv)}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={avatar || '/default-avatar.png'}
                            alt={name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-xs font-medium text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {name}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{lastMessage || 'No messages yet'}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )
        ) : (
          // Desktop View
          <>
            <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-gray-200 flex flex-col bg-gray-50`}>
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations found</div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isTutor = currentUser.user_type === 'tutor';
                    const name = isTutor
                      ? `${conv.student_first_name} ${conv.student_last_name}`
                      : `${conv.tutor_first_name} ${conv.tutor_last_name}`;
                    const avatar = isTutor ? conv.student_image : conv.tutor_image;
                    const lastMessage = conv.last_message_content;
                    const lastMessageTime = conv.last_message_time;
                    const unread = conv.unread_count || 0;

                    return (
                      <button
                        key={conv.id}
                        className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleSelectConversation(conv)}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={avatar || '/default-avatar.png'}
                            alt={name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-xs font-medium text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {name}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{lastMessage || 'No messages yet'}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${!selectedConversation && isMobile ? 'hidden' : ''}`}>
              {selectedConversation ? (
                <>
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center space-x-3">
                      {isMobile && (
                        <button
                          onClick={handleBackToConversations}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                      <img
                        src={selectedConversation.tutor_image || selectedConversation.student_image || '/default-avatar.png'}
                        alt={selectedConversation.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {currentUser.user_type === 'tutor'
                            ? `${selectedConversation.student_first_name} ${selectedConversation.student_last_name}`
                            : `${selectedConversation.tutor_first_name} ${selectedConversation.tutor_last_name}`}
                        </h3>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded-full">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded-full">
                        <Video className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Start a new conversation
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => {
                        const isMe = message.sender_id === currentUser.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                                isMe
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 text-right ${
                                isMe ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.sent_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
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
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                  <div className="max-w-md text-center p-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No conversation selected</h3>
                    <p className="text-gray-500">
                      {isMobile ? 'Select a conversation to start messaging' : 'Select a conversation from the sidebar to start messaging'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Messages;