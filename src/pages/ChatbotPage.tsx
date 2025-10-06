import React from 'react';
import { Chatbot } from '@/components/Chatbot';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/', { state: { showDashboard: true } });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 flex flex-col overflow-hidden pt-safe">
      <div className="flex-1 min-h-0 p-4 flex flex-col gap-2">
        <Button 
          variant="ghost" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 hover:bg-white/10 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="w-full h-full">
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;