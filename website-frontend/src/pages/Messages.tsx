import React, { useState, useEffect, useRef, useCallback } from 'react';
// Assuming AuthenticatedLayout is in './Dashboard' or similar relative path
import { AuthenticatedLayout } from './Dashboard'; 
import { Send, Search, MoreVertical, Phone, Video, ChevronLeft, Loader2 } from 'lucide-react';

// --- API Helper Functions (Integrated into this file) ---

const API_BASE_URL = 'http://localhost:8001'; // Your backend URL

const getAuthToken = () => {
  // Ensure localStorage is available (it isn't during server-side rendering)
  if (typeof window !== 'undefined') {
      return localStorage.getItem('token'); // Or sessionStorage
  }
  return null;
};

const request = async (endpoint, options = {}) => {
    // Ensure fetch is available
    if (typeof fetch === 'undefined') {
        console.error("Fetch API is not available in this environment.");
        throw new Error("Fetch API not available.");
    }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construct the full URL
  // Prepend base URL if endpoint is relative
  const url = endpoint.startsWith('http') || endpoint.startsWith('/') 
            ? `${API_BASE_URL}${endpoint}` 
            : `${API_BASE_URL}/${endpoint}`;


  // Adjust Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Browser sets it with boundary
  } else if (options.body && typeof options.body !== 'string') {
     // Automatically stringify JSON body if not FormData or string
     options.body = JSON.stringify(options.body);
  }


  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) { /* Ignore if response is not JSON */ }
      const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
      console.error("API Error:", errorMessage, "on", url, "with options", options);
      throw new Error(errorMessage);
    }

     const contentType = response.headers.get("content-type");
     if (response.status === 204) { // Handle No Content specifically
        return null;
     } else if (contentType && contentType.indexOf("application/json") !== -1) {
         return await response.json();
     } else {
         // Attempt to return text for non-JSON to see what we got
         return await response.text(); 
     }

  } catch (error) {
    console.error('API request failed:', url, error);
    // Don't re-throw generic fetch errors if it's an AbortError
    if (error.name === 'AbortError') {
        console.log('Fetch aborted.');
        // Decide how to handle AbortError, maybe return null or a specific indicator
        return { aborted: true };
    }
    throw error; // Re-throw other errors to be caught by calling component
  }
};

// API object using the request function
const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options = {}) => request(endpoint, { ...options, method: 'POST', body: formData }),
};

// Export base URL if needed elsewhere (though less likely if all in one file)
const API_URL = API_BASE_URL; 

// --- Helper Function ---
const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    // Ensure the input is a valid date string before parsing
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) {
        // Handle cases where parseISO results in an invalid date
        console.warn("Invalid date string received:", isoString);
        // Fallback or return original string/indicator
        const simpleDate = new Date(isoString);
        if(!isNaN(simpleDate.getTime())) {
             return formatDistanceToNow(simpleDate, { addSuffix: true, locale: bg });
        }
        return 'невалидна дата'; 
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: bg });
  } catch (e) {
    console.error("Error parsing date:", isoString, e);
    return 'някога'; // Fallback time string
  }
};


// --- React Component ---

function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileView, setIsMobileView] = useState(
      typeof window !== 'undefined' ? window.innerWidth < 768 : false // Check window existence
  ); 
  const webSocket = useRef(null);
  const messagesEndRef = useRef(null); // To scroll to bottom
  const fetchAbortController = useRef(null); // To abort fetches on unmount

  // --- Effects ---
   useEffect(() => {
     // Initialize AbortController
    fetchAbortController.current = new AbortController();
    const signal = fetchAbortController.current.signal;

    const fetchUser = async () => {
        setError(null); // Clear previous errors
      try {
        // Pass the signal to the api call
        const user = await api.get('/users/me', { signal });
        if (user?.aborted) return; // Check if fetch was aborted
        setCurrentUser(user);
      } catch (err) {
         if (err.name !== 'AbortError') {
             console.error("Failed to fetch current user:", err);
             setError('Неуспешно зареждане на потребителски данни.');
            // Consider redirecting to login on 401 Unauthorized
             if (err.message.includes("401")) {
                 // Handle unauthorized - maybe clear token and redirect
                if (typeof window !== 'undefined') {
                     localStorage.removeItem('token');
                    // window.location.href = '/login'; // Or use react-router history
                }
             }
         }
      }
    };

    fetchUser();

     // Cleanup function to abort fetch on unmount
    return () => {
        console.log("Aborting user fetch on unmount");
        fetchAbortController.current?.abort();
    };
  }, []);

  // Fetch conversations when currentUser is available
  useEffect(() => {
    if (!currentUser) return;

    fetchAbortController.current = new AbortController();
    const signal = fetchAbortController.current.signal;

    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      setError(null);
      try {
        const fetchedConversations = await api.get('/conversations', { signal });
        if (fetchedConversations?.aborted) return; 

        const mappedConversations = fetchedConversations.map(conv => {
          const isTutor = currentUser.user_type === 'tutor';
          const otherParty = isTutor
            ? { id: conv.student_id, name: `${conv.student_first_name || ''} ${conv.student_last_name || ''}`.trim(), avatar: conv.student_image, subject: null }
            : { id: conv.tutor_id, name: `${conv.tutor_first_name || ''} ${conv.tutor_last_name || ''}`.trim(), avatar: conv.tutor_image, subject: conv.tutor_subject };

          // Construct avatar URL correctly
          let avatarUrl = 'http://localhost:8001/uploads/default_pfp.webp'; // Default
          if (otherParty.avatar) {
              avatarUrl = otherParty.avatar.startsWith('http') || otherParty.avatar.startsWith('/') 
                          ? `${API_URL}${otherParty.avatar}` 
                          : `${API_URL}/${otherParty.avatar}`; // Assuming relative path needs API_URL prepended
                 // Handle potential double slashes if avatar path already starts with /
                 avatarUrl = avatarUrl.replace(/([^:]\/)\/+/g, "$1"); 
          }


          return {
            id: conv.id,
            otherPartyId: otherParty.id,
            name: otherParty.name || 'Неизвестен потребител',
            avatar: avatarUrl,
            lastMessage: conv.last_message_content || 'Няма съобщения',
            time: formatTime(conv.last_message_time || conv.updated_at),
            unread: conv.unread_count || 0,
            subject: otherParty.subject,
            originalData: conv, // Keep original for sorting/updates
          };
        }).sort((a, b) => { // Initial sort by last activity time
            const timeA = a.originalData?.last_message_time || a.originalData?.updated_at;
            const timeB = b.originalData?.last_message_time || b.originalData?.updated_at;
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;
            try {
                return parseISO(timeB) - parseISO(timeA);
            } catch (e) {
                return 0; // Avoid crash on invalid dates
            }
        });
        setConversations(mappedConversations);
      } catch (err) {
         if (err.name !== 'AbortError') {
            console.error("Failed to fetch conversations:", err);
            setError('Неуспешно зареждане на разговори.');
         }
      } finally {
          // Check if the fetch was aborted before setting loading to false
        if (!signal.aborted) {
             setIsLoadingConversations(false);
         }
      }
    };

    fetchConversations();

    return () => {
        console.log("Aborting conversations fetch");
        fetchAbortController.current?.abort();
    };
  }, [currentUser]); // Depend only on currentUser

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation || !currentUser) {
        setCurrentMessages([]);
        return;
    };

    fetchAbortController.current = new AbortController();
    const signal = fetchAbortController.current.signal;


    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setError(null); // Clear message-specific errors
      try {
        const fetchedMessages = await api.get(`/conversations/${selectedConversation.id}/messages`, { signal });
        if (fetchedMessages?.aborted) return;

        const mappedMessages = fetchedMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_id === currentUser.id ? 'me' : 'them',
          time: formatTime(msg.sent_at),
          originalData: msg,
        }));
        setCurrentMessages(mappedMessages);
         // Mark conversation as read locally (visual update only)
         // Backend marks as read on GET request
        setConversations(prev => prev.map(c =>
            c.id === selectedConversation.id ? { ...c, unread: 0 } : c
        ));
      } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Failed to fetch messages:", err);
            setError('Неуспешно зареждане на съобщения.');
        }
      } finally {
         if (!signal.aborted) {
             setIsLoadingMessages(false);
         }
      }
    };

    fetchMessages();

    return () => {
        console.log("Aborting messages fetch");
        fetchAbortController.current?.abort();
    };
  }, [selectedConversation, currentUser]); // Re-fetch if selection or user changes

   // Scroll to bottom when messages load or new message arrives
   useEffect(() => {
    // Use setTimeout to allow the DOM to update before scrolling
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // Adjust delay if needed
   }, [currentMessages]);

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser?.id || typeof WebSocket === 'undefined') return; 

    // Ensure previous connection is closed before opening a new one
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
         console.log("Closing existing WebSocket connection before reconnecting.");
         webSocket.current.close();
    }

    const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws/${currentUser.id}`;
    console.log("Attempting to connect WebSocket:", wsUrl);

    webSocket.current = new WebSocket(wsUrl);

    webSocket.current.onopen = () => {
      console.log('WebSocket Connected');
      setError(null); // Clear connection errors on successful connection
    };

    webSocket.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const messageData = JSON.parse(event.data);

        if (messageData.type === 'new_message') {
          const receivedConversationId = messageData.conversation_id;
          const senderId = messageData.sender_id;
          const messageContent = messageData.content;
          const messageTime = messageData.sent_at || new Date().toISOString(); // Use server time if available

          // Check if the message belongs to the currently selected conversation
          if (selectedConversation && receivedConversationId === selectedConversation.id) {
            const newMessageFormatted = {
              id: messageData.id || `ws-${Date.now()}`,
              text: messageContent,
              sender: senderId === currentUser.id ? 'me' : 'them',
              time: formatTime(messageTime),
              originalData: messageData, // Store original for potential use
            };
            // Avoid adding duplicate messages if backend also sends confirmation
             setCurrentMessages(prev => {
                 if (prev.some(msg => msg.id === newMessageFormatted.id)) {
                     return prev; // Already exists, do nothing
                 }
                 return [...prev, newMessageFormatted];
             });

            // Note: Backend marks read on GET, so no explicit marking needed here typically

          } 
          
          // Update the conversation list regardless of whether it's selected
            setConversations(prevConvos =>
                prevConvos.map(conv => {
                    if (conv.id === receivedConversationId) {
                    return {
                        ...conv,
                        lastMessage: messageContent,
                        time: formatTime(messageTime),
                        // Increment unread only if the sender is not the current user
                        unread: senderId !== currentUser.id ? (conv.unread || 0) + 1 : conv.unread,
                        // Update originalData timestamp for sorting
                        originalData: { ...conv.originalData, updated_at: messageTime, last_message_time: messageTime },
                    };
                    }
                    return conv;
                }).sort((a, b) => { // Re-sort after any update
                    const timeA = a.originalData?.last_message_time || a.originalData?.updated_at;
                    const timeB = b.originalData?.last_message_time || b.originalData?.updated_at;
                    if (!timeA && !timeB) return 0;
                    if (!timeA) return 1;
                    if (!timeB) return -1;
                     try {
                         return parseISO(timeB) - parseISO(timeA);
                     } catch (e) { return 0; }
                })
             );

        } else {
            console.log("Received unhandled WebSocket message type:", messageData.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message or update state:', error, event.data);
      }
    };

    webSocket.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Грешка при връзката в реално време.');
    };

    webSocket.current.onclose = (event) => {
      console.log('WebSocket Disconnected:', event.reason, event.code);
      // Optional: Implement reconnection logic with backoff strategy
      // Be cautious not to create infinite loops on persistent errors
    };

    // Cleanup function
    return () => {
      if (webSocket.current) {
        console.log("Closing WebSocket connection");
        webSocket.current.onclose = null; // Prevent onclose handler during manual close
        webSocket.current.onerror = null;
        webSocket.current.onmessage = null;
        webSocket.current.onopen = null;
        if (webSocket.current.readyState === WebSocket.OPEN || webSocket.current.readyState === WebSocket.CONNECTING) {
             webSocket.current.close();
        }
        webSocket.current = null; // Ensure it's nullified
      }
    };
  // Rerun only if currentUser changes (ID is needed for connection)
  // selectedConversation changes are handled *inside* onmessage
  }, [currentUser]); 

  // Handle Window Resize for Mobile View
  useEffect(() => {
      if (typeof window === 'undefined') return; // Guard for SSR
      
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    // Call once initially
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---

  const handleSelectConversation = (conversation) => {
      if (selectedConversation?.id !== conversation.id) {
         setSelectedConversation(conversation);
         setError(null); // Clear errors when switching conversations
         // Mobile view logic handled by className toggling
      }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately
    setError(null); // Clear previous send errors

    // Optimistic update
    const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: messageContent,
        sender: 'me',
        time: 'сега',
        isOptimistic: true, // Flag for potential revert
    };
    setCurrentMessages(prev => [...prev, optimisticMessage]);

    try {
      const sentMessage = await api.post(`/conversations/${selectedConversation.id}/messages`, {
        content: messageContent,
      });
      
      // Replace optimistic update with real data if backend confirms successfully
       if (sentMessage && sentMessage.id) { // Check if response is valid
           setCurrentMessages(prev =>
            prev.map(msg =>
              msg.id === optimisticMessage.id
                ? { // Map the response from the backend
                    id: sentMessage.id,
                    text: sentMessage.content,
                    sender: sentMessage.sender_id === currentUser.id ? 'me' : 'them',
                    time: formatTime(sentMessage.sent_at),
                    originalData: sentMessage,
                    isOptimistic: false, // Mark as confirmed
                } : msg
            )
          );

          // Update conversation list with new last message info and re-sort
          setConversations(prevConvos =>
            prevConvos.map(conv => {
                if (conv.id === selectedConversation.id) {
                return {
                    ...conv,
                    lastMessage: sentMessage.content,
                    time: formatTime(sentMessage.sent_at),
                    originalData: { ...conv.originalData, updated_at: sentMessage.sent_at, last_message_time: sentMessage.sent_at },
                };
                }
                return conv;
            }).sort((a, b) => { // Re-sort after sending
                const timeA = a.originalData?.last_message_time || a.originalData?.updated_at;
                const timeB = b.originalData?.last_message_time || b.originalData?.updated_at;
                if (!timeA && !timeB) return 0;
                if (!timeA) return 1;
                if (!timeB) return -1;
                try {
                     return parseISO(timeB) - parseISO(timeA);
                } catch(e) { return 0; }
            })
          );
        } else {
            // Handle case where backend didn't return expected message (maybe just 200 OK?)
            // Remove optimistic message or update its state if needed
            console.warn("Send message API returned success but no message data:", sentMessage);
             setCurrentMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
             setError('Грешка при потвърждение на съобщението.');
             setNewMessage(messageContent); // Restore input
        }


    } catch (err) {
      console.error("Failed to send message:", err);
      setError(`Неуспешно изпращане: ${err.message}`);
      // Revert optimistic update on error
      setCurrentMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore input field content
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // --- Filtering ---
  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.subject && conv.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Rendering ---

  return (
    // Ensure AuthenticatedLayout provides necessary context or structure
    <AuthenticatedLayout> 
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
        {/* Conversations List */}
         <div className={`w-full md:w-80 border-r border-gray-200 flex-col ${
          isMobileView && selectedConversation ? 'hidden' : 'flex'
        } ${!isMobileView ? 'flex' : ''} `}>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Търсене..."
                aria-label="Търсене на разговори"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {isLoadingConversations && conversations.length === 0 ? ( // Show loader only if list is empty initially
              <div className="flex justify-center items-center h-full p-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-500">Зареждане...</span>
              </div>
            ) : !isLoadingConversations && error && conversations.length === 0 ? ( // Show error only if list is empty
                 <div className="p-4 text-center text-red-600">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Няма намерени разговори.' : 'Нямате активни разговори.'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0} // Make it focusable
                  aria-label={`Разговор с ${conv.name}`}
                  className={`flex items-center p-3 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 cursor-pointer border-b border-gray-100 ${
                    selectedConversation?.id === conv.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectConversation(conv); }} // Keyboard accessibility
                >
                  <div className="relative flex-shrink-0 mr-3">
                    <img 
                        className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                        src={conv.avatar} 
                        alt={`Аватар на ${conv.name}`} 
                        onError={(e) => { e.target.onerror = null; e.target.src='http://localhost:8001/uploads/default_pfp.webp'; }} // Fallback for broken images
                    />
                    {/* Online indicator (requires backend data) */}
                    {/* {conv.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>} */}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={conv.name}>{conv.name}</p>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2" title={conv.originalData?.last_message_time || conv.originalData?.updated_at}>{conv.time}</span>
                    </div>
                     <div className="flex justify-between items-start mt-1">
                        <p className="text-xs text-gray-600 truncate pr-2" title={conv.lastMessage}>{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                        <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none" aria-label={`${conv.unread} непрочетени`}>
                            {conv.unread}
                        </span>
                        )}
                    </div>
                    {conv.subject && <p className="text-xs text-indigo-600 truncate mt-1" title={conv.subject}>{conv.subject}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
         <div className={`flex-1 flex-col ${
          isMobileView && !selectedConversation ? 'hidden' : 'flex'
        } ${!isMobileView ? 'flex' : ''} `}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                 {isMobileView && (
                  <button 
                    onClick={handleBackToList} 
                    className="mr-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Назад към списъка с разговори"
                    >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                )}
                <div className="flex items-center min-w-0">
                  <img 
                    className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0 border border-gray-200" 
                    src={selectedConversation.avatar} 
                    alt={`Аватар на ${selectedConversation.name}`} 
                    onError={(e) => { e.target.onerror = null; e.target.src='http://localhost:8001/uploads/default_pfp.webp'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate" title={selectedConversation.name}>{selectedConversation.name}</p>
                     {selectedConversation.subject && <p className="text-xs text-indigo-600 truncate" title={selectedConversation.subject}>{selectedConversation.subject}</p>}
                    {/* Online status (requires backend data) */}
                    {/* <p className="text-xs text-green-500">Online</p> */}
                  </div>
                </div>
                <div className="flex items-center space-x-1 md:space-x-3 flex-shrink-0">
                   {/* Placeholder buttons */}
                   {/* <button className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Телефонно обаждане">
                    <Phone className="w-5 h-5 text-gray-600" />
                   </button>
                   <button className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Видео разговор">
                    <Video className="w-5 h-5 text-gray-600" />
                   </button>
                    */}
                  <button className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Още опции">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-4" aria-live="polite">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                     <span className="ml-2 text-gray-500">Зареждане на съобщения...</span>
                  </div>
                ) : !isLoadingMessages && error && currentMessages.length === 0 ? ( // Show error only if messages are empty
                    <div className="p-4 text-center text-red-600">{error}</div>
                ): (
                  currentMessages.map((msg, index) => (
                    <div key={msg.id || `msg-${index}`} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                        msg.sender === 'me' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800 border border-gray-200'
                      } ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                        {/* Basic url detection - enhance if needed */}
                        <p className="text-sm whitespace-pre-wrap break-words"> 
                          {msg.text?.split(/(\s+)/).map((part, i) => 
                              /^(https?:\/\/|www\.)\S+$/i.test(part) ? 
                              <a key={i} href={part.startsWith('www.') ? `http://${part}` : part} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-300">{part}</a> : 
                              part
                          )}
                        </p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-gray-400'} text-right`}>{msg.time}</p>
                      </div>
                    </div>
                  ))
                )}
                 {/* Error display specifically for sending issues */}
                {!isLoadingMessages && error && currentMessages.length > 0 && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                {/* Empty div to scroll to */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Напишете съобщение..."
                    aria-label="Поле за въвеждане на съобщение"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isLoadingMessages || !currentUser} // Disable while loading or if no user
                  />
                  <button
                    type="submit"
                    aria-label="Изпращане на съобщение"
                    className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newMessage.trim() || isLoadingMessages || !currentUser}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
             // Placeholder when no conversation is selected (visible on larger screens)
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-lg">Изберете разговор от списъка</p>
              <p className="text-sm text-gray-400 mt-1">Вашите съобщения ще се появят тук.</p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Messages; // Make sure to export the component