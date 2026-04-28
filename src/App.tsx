/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Languages, 
  Users, 
  Menu, 
  X, 
  Sparkles,
  MessageCircle,
  Loader2,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  Image as ImageIcon,
  PlayCircle,
  Film,
  Palette,
  Flag,
  RefreshCw,
  Square,
  Volume2
} from 'lucide-react';
import { Language, Message, Persona, PERSONAS, Gender } from './types';
import { sendMessage } from './services/gemini';

const STARTERS = [
  "How's your day been, my love?",
  "Tell me something beautiful you saw lately.",
  "What are you looking for in our journey together?",
  "I'm feeling a bit lonely... talk to me?",
  "Let's talk about our favorite romantic movies.",
  "Can you teach me a phrase in your language?"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [customName, setCustomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
  const [selectedReactionGoal, setSelectedReactionGoal] = useState<string>('Compliment me');
  const [theme, setTheme] = useState<'classic' | 'midnight' | 'rose' | 'forest' | 'sunset' | 'passion' | 'winter'>('classic');
  const [vibe, setVibe] = useState<'Friendly' | 'Romantic' | 'Spicy' | 'Deep'>('Romantic');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeStyles = {
    classic: {
      bg: 'bg-brand-soft',
      sidebar: 'bg-white',
      accent: 'bg-brand-accent',
      accentText: 'text-brand-accent',
      shadow: 'shadow-brand-accent/20',
      text: 'text-gray-800',
      chatBg: 'bg-white',
      userBubble: 'bg-brand-accent text-white',
      modelBubble: 'bg-white text-gray-800 border-gray-100',
      stickers: ['✨', '💫', '🌸']
    },
    midnight: {
      bg: 'bg-slate-950',
      sidebar: 'bg-slate-900',
      accent: 'bg-indigo-600',
      accentText: 'text-indigo-400',
      shadow: 'shadow-indigo-500/20',
      text: 'text-slate-200',
      chatBg: 'bg-slate-900',
      userBubble: 'bg-indigo-600 text-white',
      modelBubble: 'bg-slate-800 text-slate-200 border-slate-700',
      stickers: ['🌙', '⭐', '🌌']
    },
    rose: {
      bg: 'bg-rose-50',
      sidebar: 'bg-white',
      accent: 'bg-rose-500',
      accentText: 'text-rose-500',
      shadow: 'shadow-rose-500/20',
      text: 'text-rose-900',
      chatBg: 'bg-white',
      userBubble: 'bg-rose-500 text-white',
      modelBubble: 'bg-rose-100/50 text-rose-900 border-rose-200',
      stickers: ['🌷', '🍭', '🎀']
    },
    forest: {
      bg: 'bg-[#F1F3EE]',
      sidebar: 'bg-white',
      accent: 'bg-[#4A5D23]',
      accentText: 'text-[#4A5D23]',
      shadow: 'shadow-[#4A5D23]/20',
      text: 'text-[#2D361E]',
      chatBg: 'bg-white',
      userBubble: 'bg-[#4A5D23] text-white',
      modelBubble: 'bg-[#F8F9F6] text-[#2D361E] border-[#E2E6D9]',
      stickers: ['🌿', '🍃', '🌳']
    },
    sunset: {
      bg: 'bg-orange-50',
      sidebar: 'bg-white',
      accent: 'bg-orange-500',
      accentText: 'text-orange-600',
      shadow: 'shadow-orange-500/20',
      text: 'text-orange-900',
      chatBg: 'bg-white',
      userBubble: 'bg-orange-500 text-white',
      modelBubble: 'bg-orange-100/50 text-orange-900 border-orange-200',
      stickers: ['☀️', '🍊', '🌅']
    },
    passion: {
      bg: 'bg-zinc-950',
      sidebar: 'bg-zinc-900',
      accent: 'bg-red-600',
      accentText: 'text-red-500',
      shadow: 'shadow-red-600/20',
      text: 'text-zinc-100',
      chatBg: 'bg-zinc-900',
      userBubble: 'bg-red-600 text-white',
      modelBubble: 'bg-zinc-800 text-zinc-100 border-zinc-700',
      stickers: ['❤️', '🔥', '🌹']
    },
    winter: {
      bg: 'bg-blue-50',
      sidebar: 'bg-white',
      accent: 'bg-blue-700',
      accentText: 'text-blue-700',
      shadow: 'shadow-blue-500/20',
      text: 'text-blue-950',
      chatBg: 'bg-white',
      userBubble: 'bg-blue-700 text-white',
      modelBubble: 'bg-blue-100/30 text-blue-900 border-blue-200',
      stickers: ['❄️', '🌨️', '⛄']
    },
    lavender: {
      bg: 'bg-purple-50',
      sidebar: 'bg-white',
      accent: 'bg-purple-600',
      accentText: 'text-purple-600',
      shadow: 'shadow-purple-500/20',
      text: 'text-purple-950',
      chatBg: 'bg-white',
      userBubble: 'bg-purple-600 text-white',
      modelBubble: 'bg-purple-100/50 text-purple-900 border-purple-200',
      stickers: ['🔮', '✨', '💜']
    },
    ocean: {
      bg: 'bg-cyan-50',
      sidebar: 'bg-white',
      accent: 'bg-cyan-600',
      accentText: 'text-cyan-700',
      shadow: 'shadow-cyan-500/20',
      text: 'text-cyan-950',
      chatBg: 'bg-white',
      userBubble: 'bg-cyan-600 text-white',
      modelBubble: 'bg-cyan-100/50 text-cyan-900 border-cyan-200',
      stickers: ['🌊', '🐚', '🐬']
    }
  };

  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          handleSend("🎤 [User sent a voice note. Listen to my emotions in my tone.]", url, { data: base64, mimeType: 'audio/webm' });
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const speakMessage = (text: string, messageId: string, emotion?: string, voiceUrl?: string) => {
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // If it's a voice note (audio file)
    if (voiceUrl) {
      if (isSpeaking === messageId) {
        setIsSpeaking(null);
        return;
      }
      
      const audio = new Audio(voiceUrl);
      audio.onplay = () => setIsSpeaking(messageId);
      audio.onended = () => setIsSpeaking(null);
      audio.onerror = () => {
        setIsSpeaking(null);
        console.error("Audio playback failed");
      };
      
      // If we are already playing something, this Audio object is separate from speechSynthesis
      // but we use the same isSpeaking state to manage UI.
      audio.play().catch(e => console.error("Audio play blocked", e));
      return;
    }

    // If it's TTS
    if (isSpeaking === messageId) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Prioritize high-quality Indian voices for personas
    let preferredVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      const isIndian = name.includes('india') || lang.includes('en-in') || lang.includes('hi-in') || name.includes('hindi');
      
      if (selectedPersona.gender === Gender.FEMALE) {
        return isIndian && (
          name.includes('female') || 
          name.includes('heera') || 
          name.includes('neerja') || 
          name.includes('aditi') || 
          name.includes('ishita') || 
          name.includes('puja') ||
          name.includes('shanti') ||
          name.includes('vocalizer') ||
          name.includes('google')
        );
      } else {
        return isIndian && (name.includes('male') || name.includes('rishi') || name.includes('vocalizer'));
      }
    });

    if (!preferredVoice) {
      preferredVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        if (selectedPersona.gender === Gender.FEMALE) {
          return name.includes('female') || name.includes('samantha') || name.includes('google uk english female') || name.includes('microsoft zira');
        } else {
          return name.includes('male') || name.includes('daniel') || name.includes('google uk english male');
        }
      });
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    let baseRate = 0.92;
    let basePitch = 1.0;

    if (emotion) {
      switch (emotion) {
        case 'angry': baseRate = 1.1; basePitch = 0.8; break;
        case 'sad': baseRate = 0.7; basePitch = 0.85; break;
        case 'romantic': baseRate = 0.8; basePitch = 1.1; break;
        case 'spicy': baseRate = 0.65; basePitch = 0.9; break;
        case 'happy': baseRate = 1.1; basePitch = 1.15; break;
        case 'surprised': baseRate = 1.3; basePitch = 1.25; break;
      }
    } else {
      switch (vibe) {
        case 'Spicy': baseRate = 0.7; basePitch = 0.9; break;
        case 'Romantic': baseRate = 0.85; basePitch = 1.05; break;
        case 'Deep': baseRate = 0.88; basePitch = 0.85; break;
        default: baseRate = 0.95; basePitch = 1.0;
      }
    }

    utterance.rate = baseRate;
    utterance.pitch = basePitch;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(messageId);
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    // Some browsers require a small interaction or delay
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const currentTheme = themeStyles[theme];

  const toggleTranslation = (id: string) => {
    setShowTranslations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello there, my dear. I'm ${customName || selectedPersona.name}. I'm here to chat, listen, and keep you company. How are you feeling today?`,
          timestamp: Date.now(),
        }
      ]);
    }
  }, [selectedPersona, customName]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async (textOverride?: string, voiceUrl?: string, voiceData?: { data: string; mimeType: string }) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !selectedMedia && !voiceUrl) || isLoading) return;

    let mediaDataForGemini: { data: string; mimeType: string } | undefined;
    let mediaUrlForHistory: string | undefined;
    let mediaTypeForHistory: 'image' | 'video' | undefined;

    if (selectedMedia) {
      mediaUrlForHistory = selectedMedia.preview;
      mediaTypeForHistory = selectedMedia.type;
      const base64 = await fileToBase64(selectedMedia.file);
      mediaDataForGemini = {
        data: base64,
        mimeType: selectedMedia.file.type
      };
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      mediaUrl: mediaUrlForHistory,
      mediaType: mediaTypeForHistory,
      voiceUrl: voiceUrl,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedMedia(null);
    setIsLoading(true);

    try {
      const result = await sendMessage(
        messages,
        textToSend,
        selectedPersona,
        vibe,
        selectedMedia ? selectedReactionGoal : undefined,
        customName || selectedPersona.name,
        mediaDataForGemini,
        voiceData
      );

      let finalSelfieUrl = result.selfieUrl;
      if (result.selfieUrl === 'SELFIE_SPICY') {
        finalSelfieUrl = selectedPersona.spicyAvatar || selectedPersona.avatar;
      } else if (result.selfieUrl === 'SELFIE_NORMAL') {
        finalSelfieUrl = selectedPersona.avatar;
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: result.text,
        translation: result.translation,
        selfieUrl: finalSelfieUrl,
        emotion: result.emotion,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      
      // Auto-retry once for network/timeout issues
      if (textOverride && !voiceData) {
        // Simple one-time auto-retry could be risky, let's just make the error UX better
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having a little trouble connecting to you right now, my love. My connection feels a bit weak... could you try sending that again for me? 🥺",
        isError: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.filter(m => m.id !== messages[messages.length - 1].id)); // Remove the error message
      handleSend(lastUserMessage.text);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const preview = URL.createObjectURL(file);
      setSelectedMedia({ file, preview, type });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear your conversation?")) {
      setMessages([]);
    }
  };

  return (
    <div className={`flex h-screen ${currentTheme.bg} overflow-hidden transition-colors duration-500`}>
      {/* Splash Screen */}
      <AnimatePresence>
        {isSplashVisible && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="w-32 h-32 bg-brand-accent/10 rounded-[32px] flex items-center justify-center relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles size={64} className="text-brand-accent" />
                </motion.div>
                <div className="absolute -inset-4 bg-brand-accent/5 rounded-[40px] animate-pulse" />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl font-display font-bold tracking-tight text-gray-900">DilConnect</h1>
              <p className="text-gray-400 mt-2 font-medium tracking-wide uppercase text-xs">Connecting Souls with AI</p>
            </motion.div>
            <div className="absolute bottom-12">
              <Loader2 className="animate-spin text-brand-accent" size={24} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Toggle */}
      <button 
        id="toggle-sidebar"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 ${currentTheme.sidebar} rounded-full shadow-md border border-gray-100 hover:bg-gray-50 transition-colors ${currentTheme.text}`}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-80 ${currentTheme.sidebar} border-r border-gray-100 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pb-4 h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 ${currentTheme.accent} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              <Sparkles size={24} />
            </div>
            <h1 className={`font-display text-2xl font-bold tracking-tight ${currentTheme.text}`}>DilConnect</h1>
          </div>

          <div className="space-y-10">
            {/* 1. Selection Section */}
            <section>
              <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest font-black mb-4 px-1">
                <Users size={12} className={currentTheme.accentText} />
                <span>Partner Selection</span>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {PERSONAS.map((p) => (
                  <button
                    id={`persona-${p.id}`}
                    key={p.id}
                    onClick={() => {
                      setSelectedPersona(p);
                      setCustomName('');
                      setMessages([]); // Reset for new persona
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${
                      selectedPersona.id === p.id 
                        ? `${currentTheme.accent} text-white shadow-xl ${currentTheme.shadow} scale-[1.02] border-transparent` 
                        : `hover:bg-gray-50/80 ${currentTheme.text} border-transparent`
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 shadow-sm" referrerPolicy="no-referrer" />
                      {selectedPersona.id === p.id && (
                        <motion.div 
                          layoutId="active-dot"
                          className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md" 
                        />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                      </div>
                      <p className={`text-[10px] font-medium ${selectedPersona.id === p.id ? 'text-white/80' : 'text-gray-400'} truncate`}>
                        {p.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Customization Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest font-black mb-4 px-1">
                <Palette size={12} className={currentTheme.accentText} />
                <span>Personalization</span>
              </div>

              {/* Vibe Selection */}
              <div className="grid grid-cols-2 gap-2">
                {['Friendly', 'Romantic', 'Spicy', 'Deep'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVibe(v as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all duration-300 relative overflow-hidden group ${
                      vibe === v 
                        ? `${currentTheme.accent} text-white border-transparent shadow-lg` 
                        : `bg-white/50 ${currentTheme.text} border-gray-100 hover:border-brand-accent/30 hover:bg-white`
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1.5 text-xs">
                      {v === 'Friendly' && '🤝'}
                      {v === 'Romantic' && '💝'}
                      {v === 'Spicy' && '🔥'}
                      {v === 'Deep' && '🧠'}
                      {v}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Call them</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedPersona.name}
                    className={`w-full p-2.5 ${currentTheme.chatBg} ${currentTheme.text} border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-accent/20 font-bold`}
                  />
                </div>
              </div>
            </section>

            {/* 3. Appearance Section */}
            <section>
              <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest font-black mb-4 px-1">
                <Palette size={12} className={currentTheme.accentText} />
                <span>Visual Themes</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'classic', label: 'Classic', color: 'bg-[#7A8A62]' },
                  { id: 'midnight', label: 'Midnight', color: 'bg-indigo-600' },
                  { id: 'rose', label: 'Rose', color: 'bg-rose-500' },
                  { id: 'forest', label: 'Forest', color: 'bg-[#4A5D23]' },
                  { id: 'sunset', label: 'Sunset', color: 'bg-orange-500' },
                  { id: 'passion', label: 'Passion', color: 'bg-red-600' },
                  { id: 'winter', label: 'Winter', color: 'bg-blue-700' },
                  { id: 'lavender', label: 'Lavndr', color: 'bg-purple-600' },
                  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-600' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all border-2 ${
                      theme === t.id ? 'border-brand-accent bg-brand-accent/5' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${t.color} shadow-sm`} />
                    <span className="text-[8px] font-black text-gray-400 uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-gray-50">
          <button 
            id="clear-chat"
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
          >
            <Trash2 size={16} />
            <span>Clear History</span>
          </button>

          {/* App Installation */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Install App</h3>
            <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">Tap <strong>'Share'</strong> in your browser and select <strong>'Add to Home Screen'</strong> to save DilConnect.</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-accent">
              <PlayCircle size={12} />
              <span>Available for iOS & Android</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Animated Background Stickers */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
          {currentTheme.stickers.map((s, i) => (
            <motion.span
              key={`bg-sticker-${i}`}
              className="absolute text-8xl"
              style={{
                top: `${(i * 30 + 10) % 100}%`,
                left: `${(i * 25 + 15) % 100}%`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {s}
            </motion.span>
          ))}
        </div>

        {/* Header */}
        <header className={`flex items-center justify-between p-4 lg:p-6 ${currentTheme.sidebar}/50 backdrop-blur-md border-b border-gray-100/10 z-10 relative overflow-hidden`}>
          {/* Animated Theme Stickers */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-around items-center">
            {currentTheme.stickers.map((s, i) => (
              <motion.span 
                key={i}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4 + i, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-2xl lg:text-4xl"
              >
                {s}
              </motion.span>
            ))}
          </div>
          <div className="flex items-center gap-3 lg:gap-4 ml-10 lg:ml-0 relative z-10">
            <div className="relative">
              <img src={selectedPersona.avatar} alt={selectedPersona.name} className="w-10 h-10 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className={`font-display font-bold text-lg ${currentTheme.text}`}>{customName || selectedPersona.name}</h2>
              <p className="text-[10px] text-green-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                Thinking of you
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 ${currentTheme.chatBg} rounded-xl text-xs font-bold ${currentTheme.accentText} border border-gray-100/10`}>
            <Sparkles size={14} className="animate-pulse" />
            <span>AI Powered</span>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 min-h-full flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex group items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`
                    max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-md relative
                    ${m.role === 'user' 
                      ? `${currentTheme.userBubble} rounded-br-none ${currentTheme.shadow}` 
                      : `${currentTheme.modelBubble} rounded-bl-none border`}
                  `}>
                    {m.mediaUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-black/5">
                        {m.mediaType === 'image' ? (
                          <img src={m.mediaUrl} alt="Media" className="w-full h-auto object-cover max-h-64" referrerPolicy="no-referrer" />
                        ) : (
                          <video src={m.mediaUrl} controls className="w-full h-auto max-h-64" />
                        )}
                      </div>
                    )}
                    {m.selfieUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border-4 border-white shadow-lg rotate-1">
                        <img src={m.selfieUrl} alt="Selfie from me" className="w-full h-auto object-cover max-h-96" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    
                    {m.voiceUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <button 
                          onClick={() => speakMessage(m.text, m.id, undefined, m.voiceUrl)}
                          className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
                            isSpeaking === m.id 
                              ? 'bg-white/20 border-white/30 text-white animate-pulse' 
                              : m.role === 'user' 
                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                : 'bg-brand-accent/5 border-brand-accent/10 text-brand-accent hover:bg-brand-accent/10'
                          }`}
                        >
                          <PlayCircle size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Play Voice Note</span>
                        </button>
                      </div>
                    )}

                    {m.role === 'model' && (
                      <button 
                        onClick={() => speakMessage(m.text, m.id, m.emotion)}
                        className={`mt-2 p-1.5 rounded-full transition-all ${
                          isSpeaking === m.id ? 'bg-brand-accent text-white animate-pulse' : 'hover:bg-black/10'
                        }`}
                        title="Hear my voice"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                    
                    {m.isError && (
                      <button 
                        onClick={retryLastMessage}
                        className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white/20 hover:bg-white/30 text-white`}
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Try Again
                      </button>
                    )}

                    {m.translation && (
                      <div className="mt-3 pt-3 border-t border-gray-100/20">
                        <button 
                          onClick={() => toggleTranslation(m.id)}
                          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${
                            m.role === 'user' ? 'text-white/60 hover:text-white' : 'text-brand-accent/60 hover:text-brand-accent'
                          }`}
                        >
                          <Languages size={12} />
                          {showTranslations.has(m.id) ? 'Hide translation' : 'See translation'}
                        </button>
                        <AnimatePresence>
                          {showTranslations.has(m.id) && (
                            <motion.p 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className={`text-sm italic overflow-hidden ${m.role === 'user' ? 'text-white/80' : 'text-gray-500'}`}
                            >
                              {m.translation}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <div className={`mt-2 flex items-center justify-between gap-4 text-[10px] ${m.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      <div className="flex items-center gap-2">
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(m.text, m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 bg-brand-accent rounded-full" 
                    />
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-brand-accent rounded-full" 
                    />
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-brand-accent rounded-full" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Conversation Starters (Floating if no user messages) */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 lg:p-8 bg-transparent">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Media Preview & Reaction Styles */}
            <AnimatePresence>
              {selectedMedia && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white group shrink-0">
                      {selectedMedia.type === 'image' ? (
                        <img src={selectedMedia.preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Film className="text-white" size={24} />
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedMedia(null)}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-2">
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${currentTheme.accentText}`}>How should I react?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Compliment me', 
                          'Be extra sweet', 
                          'Loving roast', 
                          'Express longing', 
                          'Tell me a memory'
                        ].map(goal => (
                          <button
                            key={goal}
                            onClick={() => setSelectedReactionGoal(goal)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                              selectedReactionGoal === goal 
                                ? `${currentTheme.accent} text-white border-transparent shadow-sm` 
                                : `bg-white/50 ${currentTheme.text} border-gray-100 hover:border-brand-accent/30`
                            }`}
                          >
                            {goal}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  id="message-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${customName || selectedPersona.name}...`}
                  className={`w-full p-4 pr-32 ${currentTheme.chatBg} ${currentTheme.text} border-2 border-transparent rounded-2xl shadow-xl focus:outline-none focus:ring-2 ${currentTheme.accent}/20 transition-all text-sm lg:text-base placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    id="media-button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-brand-accent hover:bg-gray-50 rounded-xl transition-all"
                    title="Upload photo or video"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    id="voice-button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 hover:bg-gray-50 rounded-xl transition-all ${
                      isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-brand-accent'
                    }`}
                    title={isRecording ? "Stop recording" : "Send voice note"}
                  >
                    {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                  </button>
                  {isRecording && (
                    <span className="text-[10px] font-bold text-red-500 animate-pulse px-1">
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <button
                    id="send-button"
                    onClick={() => handleSend()}
                    disabled={isLoading || (!input.trim() && !selectedMedia)}
                    className={`
                      p-2.5 rounded-xl transition-all
                      ${isLoading || (!input.trim() && !selectedMedia) 
                        ? 'bg-gray-100 text-gray-300' 
                        : 'bg-brand-accent text-white hover:scale-105 active:scale-95 shadow-md shadow-brand-accent/20'}
                    `}
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-3 text-xs text-gray-400 font-medium tracking-wide">
            Powered by Gemini AI • Your dedicated companion
          </p>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}


