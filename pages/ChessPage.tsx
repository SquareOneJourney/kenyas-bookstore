
import React, { useState, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { GoogleGenAI, Type } from '@google/genai';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { Separator } from '../components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import AppSidebar from '../components/AppSidebar';


type Difficulty = 'easy' | 'medium' | 'hard';
interface ChatMessage {
  sender: 'Kenya' | 'System';
  text: string;
}

const ChessPage: React.FC = () => {
  const game = useMemo(() => new Chess(), []);
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'System', text: "Welcome! Choose your difficulty and let's play." }
  ]);
  
  const updateStatus = () => {
    let status = '';
    const moveColor = game.turn() === 'b' ? 'Black (Kenya)' : 'White (You)';

    if (game.isCheckmate()) {
      status = `Checkmate! ${moveColor === 'White (You)' ? 'Kenya' : 'You'} win${moveColor === 'White (You)' ? 's' : ''}!`;
    } else if (game.isDraw()) {
      status = 'It\'s a draw!';
    } else {
      status = `${moveColor} to move.`;
      if (game.isCheck()) {
        status += ` In check.`;
      }
    }
    setGameStatus(status);
  };
  
  useEffect(() => {
    updateStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChatMessage = (sender: 'Kenya' | 'System', text: string) => {
    setChatHistory(prev => [...prev, { sender, text }]);
  };

  const getDifficultyPrompt = () => {
    switch (difficulty) {
      case 'easy':
        return "You are playing a 'Let Me Win' game. Make some obvious blunders and prioritize fun over winning. Compliment the user's moves, even if they aren't perfect.";
      case 'hard':
        return "You are playing a challenging match. Play strategically and thoughtfully. Your commentary should be respectful of a skilled opponent.";
      case 'medium':
      default:
        return "You are playing a friendly, casual game. Play a balanced game and keep the commentary lighthearted and fun.";
    }
  };

  const getAiReactionToUserMove = async (userMoveSan: string) => {
    if (game.isGameOver()) return;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const pgn = game.pgn();
        const prompt = `You are Kenya, a friendly and encouraging chess partner. Your opponent (White) just made the move: ${userMoveSan}. The game history is in PGN format.
${getDifficultyPrompt()}

Your task is to provide a reaction to your opponent's move.

Your response must be a valid JSON object with one key:
1. "commentary": A short, sweet, genuine, and funny comment reacting to your opponent's move. Keep it under 25 words.

PGN:
${pgn}`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                commentary: { type: Type.STRING },
              },
            },
          },
        });
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const aiResponse = JSON.parse(jsonText);
        addChatMessage('Kenya', aiResponse.commentary);
        return;
      } catch (error: any) {
        console.error(`Error getting AI reaction (attempt ${attempt + 1}/${maxRetries}):`, error);
        if (attempt === maxRetries - 1) {
          console.log("AI reaction failed after all retries. Using fallback reply.");
          const fallbackReplies = ["Nice move!", "An interesting choice.", "Okay, I see what you did there.", "You're keeping me on my toes!"];
          const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
          addChatMessage('Kenya', randomReply);
          break;
        }
        const isRateLimitError = error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'));
        const delay = isRateLimitError ? Math.pow(2, attempt) * 200 + Math.random() * 200 : 500;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };


  const makeAiMove = async () => {
    if (game.isGameOver() || game.turn() !== 'b') return;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const pgn = game.pgn();
        const prompt = `You are Kenya, a friendly and encouraging chess partner. It is your turn to play. Your color is black. The game history is in PGN format.
${getDifficultyPrompt()}

Your response must be a valid JSON object with two keys:
1. "move": The best move in Standard Algebraic Notation (SAN) based on the difficulty. Do not include check (+) or checkmate (#) symbols.
2. "commentary": A short, sweet, genuine, and funny comment about your move or the game state. Keep it under 25 words.

PGN:
${pgn}`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                move: { type: Type.STRING },
                commentary: { type: Type.STRING },
              },
            },
          },
        });
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const aiResponse = JSON.parse(jsonText);
        const aiMove = aiResponse.move.trim().replace(/[+#]/g, '');
        const moveResult = game.move(aiMove);
        if (moveResult) {
          setGamePosition(game.fen());
          updateStatus();
          addChatMessage('Kenya', aiResponse.commentary);
          return;
        } else {
          console.warn("AI provided invalid move:", aiMove);
          throw new Error(`Invalid move: ${aiMove}`);
        }
      } catch (error: any) {
        console.error(`Error making AI move (attempt ${attempt + 1}/${maxRetries}):`, error);
        if (attempt === maxRetries - 1) {
          console.log("AI move failed after all retries. Making a random move as a fallback.");
          addChatMessage('Kenya', 'Oh dear, my thoughts are a bit scrambled! Let\'s try this move instead.');
          const moves = game.moves();
          if (moves.length > 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            game.move(move);
            setGamePosition(game.fen());
            updateStatus();
          }
          break;
        }
        const isRateLimitError = error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'));
        const delay = isRateLimitError ? Math.pow(2, attempt) * 200 + Math.random() * 200 : 500;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleUserMoveSequence = async (userMoveSan: string) => {
    setIsLoadingAI(true);
    
    try {
        // Short delay for the user to see their move
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await getAiReactionToUserMove(userMoveSan);
        
        // A small delay before Kenya makes her move, for a more natural pace
        if (!game.isGameOver()) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await makeAiMove();
        }
    } catch (error) {
        console.error("Error in move sequence:", error);
        addChatMessage('System', 'A glitch in the matrix occurred. Please try moving again or reset the game.');
    } finally {
        setIsLoadingAI(false);
    }
  }


  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (isLoadingAI || game.turn() !== 'w') return false;
    let move = null;
    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    } catch (e) { /* ignore invalid move */ }

    if (move === null) return false;

    setGamePosition(game.fen());
    updateStatus();
    
    handleUserMoveSequence(move.san);

    return true;
  }

  function resetGame() {
    game.reset();
    setGamePosition(game.fen());
    updateStatus();
    setIsLoadingAI(false); // Force unlock the board on reset
    setChatHistory([{ sender: 'System', text: "A new game has begun. Good luck!" }]);
  }

  return (
    <SidebarProvider>
      <AppSidebar
        difficulty={difficulty}
        onDifficultySelect={setDifficulty}
        gameStatus={gameStatus}
        isLoadingAI={isLoadingAI}
        onReset={resetGame}
        chatHistory={chatHistory}
      />
      <SidebarInset className="bg-muted">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-cream px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Kenya's Bookstore</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Chess w/ Kenya</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 items-center justify-center p-4 h-[calc(100vh-4rem)]">
          <div className="w-full max-w-[600px] aspect-square">
            <div className="shadow-lg rounded-lg overflow-hidden">
              <Chessboard
                position={gamePosition}
                onPieceDrop={onDrop}
                boardOrientation="white"
                arePiecesDraggable={!isLoadingAI && !game.isGameOver()}
              />
            </div>
          </div>
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
};

export default ChessPage;
