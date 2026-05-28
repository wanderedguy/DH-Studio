import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, MessageSquare, ArrowRight, CornerDownLeft, RefreshCcw } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onResetChat: () => void;
  darkMode: boolean;
}

export default function AIChatbot({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onResetChat,
  darkMode
}: AIChatbotProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom on updates
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) {
    // Render a small floating trigger button at bottom right of viewport
    return (
      <button
        id="chatbot-floating-trigger"
        onClick={() => {
          // Open trigger
          setInputText("");
          onSendMessage(""); // This can double trigger or handle initialization if needed
        }}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-linear-to-r from-amber-500 via-orange-500 to-blue-500 text-white shadow-xl hover:scale-108 active:scale-95 transition-all shrink-0 animate-bounce cursor-pointer hover:rotate-3"
        title="Ask DH² Spark AI Bot"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSubmit = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      await onSendMessage(textToSubmit);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const submitQuickSuggestion = async (text: string) => {
    setIsTyping(true);
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "🔥 Show hot promo coupons active!",
    "👔 Show Men's linen shirts outfits",
    "👗 Reveal ladies floral dress design",
    "🚚 How to track shipped orders?",
    "🧥 Tell me about fabric refund guide"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-full h-[520px] rounded-3xl overflow-hidden shadow-2xl border flex flex-col font-sans transition-all animate-fade-in-up">
      
      {/* Header banner brand */}
      <div className="p-4 bg-linear-to-r from-amber-500 via-orange-500 to-blue-500 text-slate-950 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center text-white border border-amber-500">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-sm block tracking-tight">DH² Spark Assistant</span>
            <p className="text-[10px] text-slate-100 font-medium">Wear Your Identity Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onResetChat}
            className="p-1 rounded-full hover:bg-slate-900/10 text-slate-950"
            title="Clear Chat Thread"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-900/10 text-slate-950"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Chat messages stream log */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col ${
        darkMode ? "bg-slate-900/95" : "bg-slate-50/95"
      }`}>
        
        {/* Welcome message */}
        <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] font-sans ${
          darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-650"
        }`}>
          <span className="font-bold text-amber-500 text-[10px] uppercase block mb-1">📢 SYSTEM Spark Agent</span>
          Hello there! Welcome to the premium boutique DH² Studio. I can search our active live catalog, explain cotton/linen specs, estimate coupon code discounts or lead you to our Bluedart tracker instantly. Go ahead and type.
        </div>

        {/* List of user questions */}
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`p-3 rounded-2xl text-xs max-w-[85%] font-sans relative ${
              m.sender === 'user'
                ? "bg-amber-500 text-slate-950 font-medium ml-auto rounded-tr-none"
                : darkMode 
                  ? "bg-slate-800 text-slate-300 mr-auto rounded-tl-none border border-slate-750" 
                  : "bg-white text-slate-700 mr-auto rounded-tl-none border border-slate-150 shadow-xs"
            }`}
          >
            {m.sender === 'assistant' && (
              <span className="font-bold text-amber-500 text-[9px] uppercase tracking-wider block mb-1">
                DH² Spark
              </span>
            )}
            <div className="prose prose-sm dark:prose-invert text-[11px] leading-relaxed break-words font-sans">
              {m.text}
            </div>
            <span className="text-[8px] opacity-60 absolute bottom-1.5 right-2 font-mono">
              {m.timestamp}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className={`p-3 rounded-2xl text-[11px] text-slate-450 mr-auto font-sans leading-relaxed flex items-center gap-1 ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick buttons */}
      <div className={`px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t ${
        darkMode ? "bg-slate-900 border-slate-850" : "bg-slate-100 border-slate-150"
      }`}>
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => submitQuickSuggestion(p.substring(2))}
            className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap transition-all border ${
              darkMode 
                ? "bg-slate-850 border-slate-705 text-slate-400 hover:bg-slate-800 hover:text-white" 
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-850"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input query form box */}
      <form onSubmit={handleFormSubmit} className={`p-4 border-t shrink-0 flex gap-2 items-center ${
        darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-150"
      }`}>
        <input
          id="chat-input-box"
          type="text"
          placeholder="Ask Spark about linen shirts, active codes..."
          className={`flex-1 p-2.5 rounded-xl text-xs focus:outline-hidden transition-all border ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          id="send-chat-button"
          type="submit"
          className="p-2.5 bg-amber-550 hover:bg-amber-500 text-slate-950 rounded-xl transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
