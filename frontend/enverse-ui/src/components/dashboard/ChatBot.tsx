import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Mic, Volume2 } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hello! I'm Enverse Assistant. I can help you track your bill, find power-hungry devices, or analyze savings.", isBot: true }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Generate unique session ID for this user session
  const sessionId = useRef(Math.random().toString(36).substring(7)).current;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    // Initialize Speech Recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    } else {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
    
    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (event.results[event.results.length - 1].isFinal) {
        setInput(transcript);
      }
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.CHAT), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userMsg,
            session_id: sessionId 
        })
      });
      
      if (!res.ok) throw new Error("Server Error");
      
      const data = await res.json();
      const botResponse = data.answer || "Error: Invalid response.";
      
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: "Error: AI Engine Unreachable.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-[998]" onClick={() => setIsOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full z-[999] bg-white shadow-2xl transition-all duration-500 transform ${isOpen ? "translate-x-0 w-full sm:w-[500px]" : "translate-x-full w-0"} flex flex-col`}>
        
        {/* Header - Clean & Consumer Friendly */}
        <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg text-white shadow-sm">
                <Bot size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight leading-none">Enverse</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Assistant Online</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-[#fdfcfb]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'} items-end gap-3`}>
              {m.isBot && <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-amber-500 mb-1"><Bot size={14} /></div>}
              <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-base font-bold ${m.isBot ? 'bg-white text-slate-800 border border-slate-100' : 'bg-slate-900 text-white shadow-xl'}`}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="text-xs font-black text-slate-400 animate-pulse uppercase">Thinking...</div>}
        </div>
        <div className="p-6 sm:p-10 bg-white border-t border-slate-50">
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
            <input className="flex-1 bg-transparent px-5 py-3 text-base font-bold outline-none" placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} />
            {voiceSupported && (
              <button 
                onClick={isListening ? stopListening : startListening}
                className={`p-4 rounded-full transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50' 
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <Volume2 size={20} /> : <Mic size={20} />}
              </button>
            )}
            <button onClick={handleSend} className="p-4 bg-slate-900 text-white rounded-full hover:bg-amber-600 transition-all"><Send size={20} /></button>
          </div>
        </div>
      </div>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 p-6 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-[997]">
          <MessageSquare size={32} />
        </button>
      )}
    </>
  );
};

export default ChatBot;