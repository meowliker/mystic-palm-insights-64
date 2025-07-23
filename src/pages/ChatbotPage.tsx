import React from 'react';
import { Chatbot } from '@/components/Chatbot';

const ChatbotPage: React.FC = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 flex flex-col overflow-hidden">
      <div className="container mx-auto h-full flex flex-col p-2">
        <div className="text-center mb-2 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-blue bg-clip-text text-transparent">
            Astrobot
          </h1>
        </div>
        
        <div className="flex-1 min-h-0">
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;