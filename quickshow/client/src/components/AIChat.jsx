import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader, MessageCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m QuickShow AI, your movie booking assistant. I can help you find movies, check showtimes, see prices, and guide you through booking. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { apiClient } = useApp();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      // Send message to AI backend
      const response = await apiClient.post('/api/ai/chat', {
        message: input,
        conversationHistory: messages,
      });

      if (response.data.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.data.message,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMsg = response.data.message || 'Failed to get response';
        setError(errorMsg);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
          },
        ]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection error. Please try again.';
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        },
      ]);
      console.error('AI Chat Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 md:bottom-4 md:right-4 w-full md:w-96 h-screen md:h-[600px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col z-50 md:border md:border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 rounded-t-2xl md:rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h2 className="font-bold text-lg">QuickShow AI</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-sm px-4 py-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-900 px-4 py-3 rounded-lg border border-slate-200 rounded-bl-none flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">QuickShow AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs flex items-center gap-1.5">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-slate-200 bg-white p-4 rounded-b-2xl md:rounded-b-2xl flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about movies..."
          disabled={loading}
          className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 rounded-lg px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
