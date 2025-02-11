import React, { useState, useEffect, useRef } from 'react';

type AIModelAvailability = 'readily' | 'after-download' | 'no';
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

declare global {
  interface Window {
    ai: AI;
  }
  interface AI {
    languageModel: {
      create(): Promise<AITextSession>;
      capabilities(): Promise<{
        available: AIModelAvailability;
        defaultTemperature?: number;
        defaultTopK?: number;
        maxTemperature?: number;
        maxTopK?: number;
      }>;
    };
  }
  interface AITextSession {
    prompt(input: string): Promise<string>;
    promptStreaming(input: string): AsyncGenerator<string>;
  }
}

const ChromeAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState('');
  const [session, setSession] = useState<AITextSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const capabilities = await window.ai.languageModel.capabilities();
        switch (capabilities.available) {
          case 'readily':
            setModelStatus('Model is ready');
            const newSession = await window.ai.languageModel.create();
            setSession(newSession);
            break;
          case 'after-download':
            setModelStatus('Model is downloading...');
            break;
          case 'no':
            setModelStatus('Model not available');
            break;
        }
      } catch (error) {
        setModelStatus('Error checking model status');
        console.error('Error:', error);
      }
    };

    checkAvailability();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const stream = session.promptStreaming(userMessage);
      let accumulatedResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        accumulatedResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedResponse;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="text-sm text-gray-500 mb-2">{modelStatus}</div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || !session}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !session}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChromeAIChat;