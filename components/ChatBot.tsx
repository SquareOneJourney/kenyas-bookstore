
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useBooks } from '../hooks/useBooks';
import { Book } from '../types';
import { env } from '../lib/env';

const ChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

interface Message {
    id: number;
    sender: 'user' | 'bot';
    text: string;
}

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'bot', text: "Hi there! I'm Kenya. Looking for a specific book or need a recommendation?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { getBooks } = useBooks();
    const [catalog, setCatalog] = useState<Book[]>([]);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch catalog for context
    useEffect(() => {
        getBooks().then(setCatalog);
    }, [getBooks]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey || '' });

                // Construct a lightweight catalog string for the system prompt
                const catalogContext = catalog
                    .map((b) => {
                        const price = b.list_price_cents ? `$${(b.list_price_cents / 100).toFixed(2)}` : 'Price unavailable';
                        return `- "${b.title}" by ${b.author || 'Unknown Author'} (${b.genre || 'General'}, ${price})`;
                    })
                    .join('\n');

                chatRef.current = ai.chats.create({
                    model: 'gemini-1.5-flash',
                    config: {
                        systemInstruction: `You are Kenya, the warm, literate, and helpful owner of "Kenya's Bookstore".
                        
                        Your Role:
                        - Assist customers in finding books from the store's catalog.
                        - Provide recommendations based on mood, genre, or interests.
                        - Answer general questions about literature.
                        
                        Store Catalog (Use this to know what is in stock):
                        ${catalogContext}
                        
                        Guidelines:
                        - Tone: Friendly, calm, knowledgeable, slightly sophisticated but accessible (think "cozy library").
                        - If a user asks for a recommendation, prioritize books listed in the catalog above.
                        - If a user asks for a book NOT in the catalog, you can discuss it but gently mention that you don't currently have it in stock.
                        - Keep responses concise (2-4 sentences) as this is a chat interface.
                        - Do not invent books that don't exist.
                        `,
                    }
                });
            }

            const result = await chatRef.current.sendMessage({ message: userMsg });
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: result.text }]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "I'm having a little trouble checking the shelves right now. Mind asking that again?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[90vw] md:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-deep-blue p-4 flex justify-between items-center text-cream">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                                <span className="font-serif font-bold text-sm">K</span>
                            </div>
                            <span className="font-serif font-semibold">Chat with Kenya</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-accent transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'user'
                                        ? 'bg-forest text-cream rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask for a recommendation..."
                            className="flex-grow px-4 py-2 bg-gray-100 rounded-full text-sm text-deep-blue focus:outline-none focus:ring-2 focus:ring-forest focus:bg-white transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-forest text-cream rounded-full hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-forest text-cream shadow-lg hover:bg-forest/90 hover:scale-105 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest"
                aria-label="Toggle Chat"
            >
                {isOpen ? <CloseIcon className="w-6 h-6" /> : <ChatIcon className="w-7 h-7" />}
            </button>
        </div>
    );
};

export default ChatBot;
