import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Terminal, Sparkles } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Enverse AI Node v2.0 Online. Awaiting query...", isBot: true }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for mobile/desktop
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.answer, isBot: true }]);
    } catch {
      setMessages(prev => [...prev, { text: "Error: AI Engine Unreachable.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-[998]" onClick={() => setIsOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full z-[999] bg-white shadow-2xl transition-all duration-500 transform ${isOpen ? "translate-x-0 w-full sm:w-[500px]" : "translate-x-full w-0"} flex flex-col`}>
        <div className="bg-slate-900 p-8 sm:p-10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-xl text-white"><Bot size={28} /></div>
            <div>
              <h3 className="text-white font-black text-xl uppercase italic">Enverse Bot</h3>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Semantic Engine Active</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={28} /></button>
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