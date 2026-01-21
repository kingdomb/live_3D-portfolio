import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm Bernard's AI agent. Ask me anything about his experience, skills, or why he'd be a great fit!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })), // Send history for context
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble connecting to my brain right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. THE FLOATING BUBBLE BUTTON */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all ${
          isOpen ? 'hidden' : 'bg-teal-500 text-black'
        }`}
      >
        <span className='text-2xl'>🤖</span>
        <span className='font-bold hidden md:inline'>Ask AI About Bernard</span>
      </motion.button>

      {/* 2. THE CHAT WINDOW OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className='fixed bottom-6 right-6 z-50 w-full max-w-[380px] h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden'
          >
            {/* Header */}
            <div className='bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
                <h3 className='text-white font-bold'>Bernard's Agent</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-white transition-colors'
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-black/50'>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                    }`}
                  >
                    {/* The styling below fixes the spacing and lists */}
                    <div className='prose prose-invert prose-sm max-w-none leading-relaxed'>
                      <ReactMarkdown
                        components={{
                          // Style bold text to stand out
                          strong: ({ node, ...props }) => (
                            <span
                              className='text-teal-400 font-bold'
                              {...props}
                            />
                          ),
                          // Ensure lists have proper bullets and padding
                          ul: ({ node, ...props }) => (
                            <ul
                              className='list-disc pl-4 space-y-1 my-2'
                              {...props}
                            />
                          ),
                          // Add spacing between paragraphs
                          p: ({ node, ...props }) => (
                            <p className='mb-2 last:mb-0' {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className='flex justify-start'>
                  <div className='bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700'>
                    <div className='flex gap-1'>
                      <span className='w-2 h-2 bg-gray-500 rounded-full animate-bounce'></span>
                      <span className='w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100'></span>
                      <span className='w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200'></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSend}
              className='p-3 bg-gray-800 border-t border-gray-700'
            >
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Ask a question...'
                  className='flex-1 bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500'
                />
                <button
                  type='submit'
                  disabled={loading || !input.trim()}
                  className='bg-teal-500 text-black p-2 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  ➤
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
