import React, { useState, useEffect, useRef } from 'react';
import { AuthenticatedLayout } from './Dashboard';
import Peer from 'peerjs';

function Classroom() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false); // Toggle call UI
  const peerInstance = useRef(null);

  // Initialize PeerJS connection
  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setIsCallActive(true);
          });
        })
        .catch(console.error);
    });

    peerInstance.current = peer;

    return () => {
      if (peerInstance.current) peerInstance.current.destroy();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        const call = peerInstance.current.call(remotePeerId, stream);
        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          setIsCallActive(true);
        });
      })
      .catch(console.error);
  };

  const endCall = () => {
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (remoteStream) remoteStream.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
  };

  return (
    <AuthenticatedLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Класна стая</h1>
        
        {!isCallActive ? (
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-gray-600 mb-4">Нямате активни уроци в момента.</p>
            
            {/* Call Initiation UI */}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Вашият ID: {peerId}</label>
              </div>
              <div>
                <input
                  type="text"
                  value={remotePeerId}
                  onChange={(e) => setRemotePeerId(e.target.value)}
                  placeholder="Въведете ID на ученика"
                  className="p-2 border rounded w-full"
                />
              </div>
              <button
                onClick={startCall}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Започни видеоурок
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold mb-4">Активен видеоурок</h2>
            
            {/* Video Call UI */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm text-gray-500">Вашето изображение:</h3>
                {localStream && (
                  <video
                    autoPlay
                    muted
                    className="w-full h-auto rounded border border-gray-200"
                    ref={(ref) => ref && (ref.srcObject = localStream)}
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm text-gray-500">Ученик:</h3>
                {remoteStream && (
                  <video
                    autoPlay
                    className="w-full h-auto rounded border border-gray-200"
                    ref={(ref) => ref && (ref.srcObject = remoteStream)}
                  />
                )}
              </div>
            </div>
            
            <button
              onClick={endCall}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Приключи видеоурок
            </button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Classroom;