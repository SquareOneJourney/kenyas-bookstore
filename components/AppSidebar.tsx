import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from './ui/sidebar';
import Button from './ui/Button';

type Difficulty = 'easy' | 'medium' | 'hard';
interface ChatMessage {
  sender: 'Kenya' | 'System';
  text: string;
}

interface AppSidebarProps {
  difficulty: Difficulty;
  onDifficultySelect: (difficulty: Difficulty) => void;
  gameStatus: string;
  isLoadingAI: boolean;
  onReset: () => void;
  chatHistory: ChatMessage[];
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  difficulty,
  onDifficultySelect,
  gameStatus,
  isLoadingAI,
  onReset,
  chatHistory
}) => {
  const { isOpen, setIsOpen } = useSidebar();
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <>
      <aside className={`fixed top-0 left-0 z-40 w-72 h-screen bg-deep-blue text-cream transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-cream/20">
            <Link to="/" className="text-2xl font-serif font-bold text-center block">Kenya's Bookstore</Link>
            <p className="text-center text-sm text-cream/70">Mindful Chess</p>
          </div>
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
              <div className="bg-forest/50 p-4 rounded-lg shadow-md w-full text-center">
                  <p className="text-lg font-semibold h-6">
                      {isLoadingAI ? 'Kenya is thinking...' : gameStatus}
                  </p>
              </div>

              <div className="bg-forest/50 p-4 rounded-lg shadow-md w-full">
                  <h3 className="text-lg font-semibold text-center mb-3">Difficulty</h3>
                  <div className="flex justify-center flex-wrap gap-2">
                      <Button onClick={() => onDifficultySelect('easy')} variant={difficulty === 'easy' ? 'secondary' : 'outline'} size="sm">Let Me Win</Button>
                      <Button onClick={() => onDifficultySelect('medium')} variant={difficulty === 'medium' ? 'secondary' : 'outline'} size="sm">Friendly Match</Button>
                      <Button onClick={() => onDifficultySelect('hard')} variant={difficulty === 'hard' ? 'secondary' : 'outline'} size="sm">Challenge</Button>
                  </div>
              </div>
              
              <div className="bg-forest/50 p-4 rounded-lg shadow-md w-full flex-grow flex flex-col min-h-[200px]">
                  <h3 className="text-lg font-semibold mb-3 border-b border-cream/20 pb-2">Kenya Says...</h3>
                  <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                      {chatHistory.map((msg, index) => (
                          <div key={index} className={`flex flex-col ${msg.sender === 'Kenya' ? 'items-start' : 'items-center'}`}>
                              {msg.sender === 'Kenya' ? (
                                  <div className="bg-accent/80 rounded-lg rounded-bl-none px-3 py-2 max-w-[90%]">
                                      <p className="text-sm text-deep-blue">{msg.text}</p>
                                  </div>
                              ) : (
                                  <p className="text-xs text-cream/60 italic px-3">{msg.text}</p>
                              )}
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
              </div>
          </div>
          <div className="p-4 border-t border-cream/20">
            <Button onClick={onReset} disabled={isLoadingAI} className="w-full">
                Reset Game
            </Button>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-4 right-4 text-cream/70 hover:text-cream">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </aside>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default AppSidebar;
