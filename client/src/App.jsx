import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // State for messages, input, and session ID
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  // Effect to generate a unique session ID on the first load
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Send the message to your backend server
      const response = await axios.post('http://localhost:5001/api/chat', {
        message: input,
        sessionId: sessionId,
      });

      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error communicating with the server', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I am having trouble connecting.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 text-xl font-bold shadow-md">
        Mechanic ChatBot
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition duration-200"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;