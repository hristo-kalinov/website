import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, ChevronLeft, Video } from 'lucide-react'; // Keep Menu icon just in case, though not used in this specific mobile view
import { useNavigate } from 'react-router-dom';

// Helper function for authenticated fetch requests
const API_URL = import.meta.env.VITE_API_URL;
const authenticatedFetch = async (url: string, options: RequestInit = {}, navigate: any) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn("No token found. Redirecting to login.");
    localStorage.removeItem('token');
    navigate('/login');
    throw new Error('Authentication token not found.');
  }

  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers, // Allow overriding headers
    },
  });

  if (response.status === 401) {
    console.warn("API responded with 401. Redirecting to login.");
    localStorage.removeItem('token');
    navigate('/login');
    throw new Error('Authentication failed.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response;
};


// Small component for a single conversation list item
const ConversationListItem = ({ conv, selectedConversationId, onSelect, isMobile, onMarkAsRead, currentUser }) => {
  const name = `${conv.first_name} ${conv.last_name}`;
  const lastMessage = conv.last_message_content;
  const lastMessageTime = conv.last_message_time;
  const unread = conv.unread_count || 0;

  const handleSelect = async () => {
    onSelect(conv);
    if (unread > 0 && onMarkAsRead) {
      // Optimistically update UI, server call happens in parent handler
      // Parent handler should update state after successful server call
    }
  };

  return (
    <button
      key={conv.id}
      className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${selectedConversationId === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
      onClick={handleSelect}
    >
      <div className="relative flex-shrink-0">
        <img src={conv.image ? `${API_URL}${conv.image}` : `${API_URL}/default_pfp.webp`} alt={name} className="w-10 h-10 rounded-full object-cover" />
        {unread > 0 && (<span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-xs font-medium text-white">{unread}</span>)}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{lastMessage || 'No messages yet'}</p>
      </div>
    </button>
  );
};

// Small component for a single message item
const MessageItem = ({ message, currentUser }) => {
  const isMe = message.sender_id === currentUser?.id;
  return (
    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-4 py-2 rounded-lg ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none shadow-sm'}`}>
        <p>{message.content}</p>
        <p className={`text-xs mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // Ref for scrolling to the bottom

  // Redirect helper (kept for clarity, though now wrapped by authenticatedFetch)
  const redirectToLogin = () => {
      console.warn("Auth issue detected. Redirecting to login.");
      localStorage.removeItem('token');
      navigate('/login');
  };

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true); // On larger screens, always show sidebar
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}/users/me`, { method: 'GET' }, navigate);
        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
        // authenticatedFetch already handles 401 redirect
      }
    };
    fetchCurrentUser();
  }, [navigate]); // navigate is stable

  // Fetch conversations after user is loaded
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await authenticatedFetch(`${API_URL}/conversations`, { method: 'GET' }, navigate);
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // authenticatedFetch already handles 401 redirect
      }
    };
    if (currentUser) fetchConversations();
  }, [currentUser, navigate]);

  // WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) { redirectToLogin(); return; }

    const wsUrl = `ws://localhost:8001/ws/${currentUser.id}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          const { conversation_id, message } = data;
          setSelectedConversation(prev => prev?.id === conversation_id ? { ...prev, messages: [...prev.messages, message], } : prev);
          setConversations(prevConvs => prevConvs.map(conv => conv.id === conversation_id ? { ...conv, last_message_content: message.content, last_message_time: message.sent_at, unread_count: selectedConversation?.id === conv.id ? 0 : (conv.unread_count || 0) + 1, } : conv));
        } else if (data.type === 'auth_error') {
            console.error("WebSocket Authentication Error:", data.message);
            ws.close();
            redirectToLogin();
        }
      } catch (err) { console.error("WebSocket message parse error:", err); }
    };

    ws.onerror = (event) => console.error("WebSocket Error:", event);
    ws.onclose = (event) => {
        console.warn("WebSocket connection closed", event.code, event.reason);
        if (event.code === 1008) console.warn("WebSocket closed due to policy violation (possible auth issue)");
        else if (event.code !== 1000) console.warn("WebSocket closed abnormally");
    };

    return () => { ws.close(); };
  }, [currentUser, navigate, selectedConversation?.id]); // Dependencies updated

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);


  const handleSelectConversation = async (conv) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/conversations/${conv.id}/messages`, { method: 'GET' }, navigate);
      const messages = await response.json();
      setSelectedConversation({ ...conv, messages });

      // Mark as read on the server
      try {
          await authenticatedFetch(`${API_URL}/conversations/${conv.id}/read`, { method: 'POST' }, navigate);
      } catch (readError) { console.error('Error marking conversation as read:', readError); }

      // Mark as read in the state immediately
      setConversations(prevConvs => prevConvs.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));

      if (isMobile) setShowSidebar(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const response = await authenticatedFetch(`${API_URL}/conversations/${selectedConversation.id}/messages`, { method: 'POST', body: JSON.stringify({ content: newMessage }), }, navigate);
      const sentMessage = await response.json();
      setSelectedConversation(prev => ({ ...prev, messages: [...prev.messages, sentMessage], }));
      setNewMessage('');
      // Optimistically update conversations list with last message if needed
      setConversations(prevConvs => prevConvs.map(c => c.id === selectedConversation.id ? { ...c, last_message_content: sentMessage.content, last_message_time: sentMessage.sent_at, } : c));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
  };

  const filteredConversations = conversations.filter(conv =>
    `${conv.first_name} ${conv.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render loading state or handle case where currentUser is null initially
  if (!currentUser) {
      return (<div className="flex items-center justify-center h-full">Loading...</div>);
  }

  return (
      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg overflow-hidden shadow-sm relative">
        {/* Conversation List Sidebar (Mobile or Desktop) */}
        {(showSidebar || !isMobile) && (
          <div className={`${isMobile ? 'w-full absolute inset-0 z-10' : 'w-full md:w-80'} border-r border-gray-200 flex flex-col bg-gray-50 ${isMobile && !showSidebar ? 'hidden' : ''}`}>
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations found</div>
              ) : (
                filteredConversations.map(conv => (
                  <ConversationListItem
                    key={conv.id}
                    conv={conv}
                    selectedConversationId={selectedConversation?.id}
                    onSelect={handleSelectConversation}
                    isMobile={isMobile}
                    currentUser={currentUser}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Window (Mobile or Desktop) */}
        {(selectedConversation || !isMobile) && (
          <div className={`flex-1 flex flex-col ${isMobile && !selectedConversation ? 'hidden' : ''}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                  <div className="flex items-center space-x-3">
                    {isMobile && (
                      <button onClick={handleBackToConversations} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                    )}
                    <img src={selectedConversation.image ? `${API_URL}${selectedConversation.image}` : `${API_URL}/default_pfp.webp`} alt={`${selectedConversation.first_name} ${selectedConversation.last_name}`} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <h3 className="font-medium text-gray-900">{`${selectedConversation.first_name} ${selectedConversation.last_name}`}</h3>
                      <p className="text-xs text-gray-500">Online</p> {/* Placeholder status */}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {currentUser.user_type === 'student' && (
                      <button
                        onClick={() => window.location.href = `/book_lesson/${selectedConversation.public_id}`}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                      >
                        Запази час
                      </button>
                    )}
                  </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {selectedConversation.messages && selectedConversation.messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Start a new conversation</div>
                  ) : (
                    selectedConversation.messages?.map(message => (
                      <MessageItem key={message.id} message={message} currentUser={currentUser} />
                    ))
                  )}
                  <div ref={messagesEndRef} /> {/* Scroll anchor */}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center space-x-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={!selectedConversation} />
                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newMessage.trim() || !selectedConversation}>
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // No Conversation Selected State
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                <div className="max-w-md text-center p-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No conversation selected</h3>
                  <p className="text-gray-500">{isMobile ? 'Select a conversation to start messaging' : 'Select a conversation from the sidebar to start messaging'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    
  );
}

export default Messages;