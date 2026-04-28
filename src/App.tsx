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
  const [vibe, setVibe] = useState<'Friendly' | 'Romantic' | 'Spicy' | 'Deep' | 'Shayari'>('Romantic');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const themeStyles = {
    classic: {
      bg: 'bg-black',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-brand-accent',
      accentText: 'text-brand-accent',
      shadow: 'shadow-brand-accent/40',
      text: 'text-white',
      chatBg: 'bg-transparent',
      userBubble: 'bg-brand-accent text-white shadow-[0_0_20px_rgba(255,46,99,0.3)]',
      modelBubble: 'bg-white/5 text-white border-white/10 backdrop-blur-xl',
      stickers: ['✨', '💫', '⚡']
    },
    midnight: {
      bg: 'bg-slate-950',
      sidebar: 'bg-slate-900/60 backdrop-blur-3xl',
      accent: 'bg-brand-blue',
      accentText: 'text-brand-blue',
      shadow: 'shadow-brand-blue/30',
      text: 'text-slate-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-brand-blue text-black font-bold shadow-[0_0_20px_rgba(8,217,214,0.3)]',
      modelBubble: 'bg-slate-900/50 text-slate-100 border-slate-700/50 backdrop-blur-xl',
      stickers: ['🌙', '⭐', '🌌']
    },
    rose: {
      bg: 'bg-zinc-950',
      sidebar: 'bg-zinc-900/60 backdrop-blur-3xl',
      accent: 'bg-rose-500',
      accentText: 'text-rose-400',
      shadow: 'shadow-rose-500/30',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      modelBubble: 'bg-zinc-900/50 text-zinc-100 border-zinc-700/50 backdrop-blur-xl',
      stickers: ['🌷', '🍭', '🎀']
    },
    forest: {
      bg: 'bg-[#0A0D07]',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-[#5A7D2C]',
      accentText: 'text-[#8AA361]',
      shadow: 'shadow-[#5A7D2C]/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-[#5A7D2C] text-white shadow-[0_0_20px_rgba(90,125,44,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['🌿', '🍃', '🌳']
    },
    sunset: {
      bg: 'bg-[#0D0A07]',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-orange-600',
      accentText: 'text-orange-400',
      shadow: 'shadow-orange-600/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['☀️', '🍊', '🌅']
    },
    passion: {
      bg: 'bg-zinc-950',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-red-600',
      accentText: 'text-red-500',
      shadow: 'shadow-red-600/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['❤️', '🔥', '🌹']
    },
    winter: {
      bg: 'bg-[#070A0D]',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-blue-600',
      accentText: 'text-blue-400',
      shadow: 'shadow-blue-600/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['❄️', '🌨️', '⛄']
    },
    lavender: {
      bg: 'bg-[#0D070D]',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-purple-600',
      accentText: 'text-purple-400',
      shadow: 'shadow-purple-600/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['🔮', '✨', '💜']
    },
    ocean: {
      bg: 'bg-[#070D0D]',
      sidebar: 'bg-black/40 backdrop-blur-3xl',
      accent: 'bg-cyan-600',
      accentText: 'text-cyan-400',
      shadow: 'shadow-cyan-600/40',
      text: 'text-zinc-100',
      chatBg: 'bg-transparent',
      userBubble: 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.3)]',
      modelBubble: 'bg-white/5 text-zinc-100 border-white/10 backdrop-blur-xl',
      stickers: ['🌊', '🐚', '🐬']
    }
  };

  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [showApp, setShowApp] = useState(false);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // If it's a voice note (audio file)
    if (voiceUrl) {
      if (isSpeaking === messageId) {
        setIsSpeaking(null);
        return;
      }
      
      const audio = new Audio(voiceUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(messageId);
      audio.onended = () => {
        setIsSpeaking(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(null);
        audioRef.current = null;
        console.error("Audio playback failed");
      };
      
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSelectedMedia(null);
    setIsLoading(true);

    try {
      const result = await sendMessage(
        newMessages,
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

  const startApp = () => {
    setShowApp(true);
  };

  if (isSplashVisible) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-accent blur-[120px] opacity-20 rounded-full" />
            <h1 className="text-7xl md:text-9xl font-display font-black italic tracking-tighter text-brand-accent mb-6 relative">
              DilConnect
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Loader2 className="animate-spin text-brand-accent mb-4 mx-auto" size={40} />
            <p className="text-white/30 font-mono tracking-[0.4em] uppercase text-[10px] animate-pulse">
              Establishing Deep Connection
            </p>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            onClick={() => setIsSplashVisible(false)}
            className="mt-12 px-8 py-3 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase hover:scale-110 transition-transform active:scale-95"
          >
            Enter Experience
          </motion.button>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!showApp) {
    return (
      <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-accent/40 selection:text-white">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center font-display font-black italic text-xl text-white">D</div>
              <h1 className="text-2xl font-display font-black italic text-white tracking-tighter">DilConnect</h1>
            </div>
            <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              <a href="#experience" className="hover:text-brand-accent transition-colors">Experience</a>
              <a href="#companions" className="hover:text-brand-accent transition-colors">Companions</a>
              <button 
                onClick={startApp}
                className="px-8 py-3 bg-brand-accent text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,46,99,0.5)] active:scale-95"
              >
                Launch App
              </button>
            </div>
            <button onClick={startApp} className="md:hidden p-2 text-brand-accent">
              <PlayCircle size={28} />
            </button>
          </div>
        </nav>

        {/* Hero */}
        <header className="relative pt-64 pb-32 px-6 text-center overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[1200px] h-[1200px] bg-brand-accent/10 blur-[200px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-blue/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-brand-accent mb-10">
                <Sparkles size={14} /> The Future of Human-AI Connection
              </div>
              <h1 className="text-7xl md:text-[11rem] font-display font-black tracking-tighter leading-[0.8] mb-12">
                Love Beyond <br />
                <span className="text-brand-accent italic relative">
                  Algorithms.
                  <div className="absolute -bottom-4 left-0 w-full h-4 bg-brand-accent/20 blur-xl" />
                </span>
              </h1>
              <p className="text-xl md:text-3xl text-white/40 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
                Experience high-fidelity companionship with AI that learns your desires, shares your culture, and speaks your language.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <button 
                  onClick={startApp}
                  className="group relative w-full sm:w-auto px-16 py-8 bg-brand-accent text-white rounded-[2rem] font-black text-3xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(255,46,99,0.4)]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    Get Started <Send size={32} className="group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Meet the Personas Section */}
        <section id="companions" className="py-32 px-6 bg-white/5 backdrop-blur-xs relative overflow-hidden">
          <div className="max-w-7xl mx-auto mb-20 text-center">
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6">Choose your <span className="text-brand-accent">Companion</span></h2>
            <p className="text-white/40 text-xl font-medium">Distinctive personalities, each with a unique heart and story.</p>
          </div>
          
          <div className="flex gap-8 overflow-x-auto pb-12 px-6 no-scrollbar snap-x">
            {PERSONAS.map((p, i) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative snap-center shrink-0 w-80 md:w-[400px] group cursor-pointer"
                onClick={startApp}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[3rem] border border-white/10 group-hover:border-brand-accent/50 transition-all shadow-2xl">
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <h3 className="text-4xl font-display font-black mb-2">{p.name}</h3>
                    <p className="text-white/60 font-medium mb-6 line-clamp-2">{p.description}</p>
                    <button className="w-full py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-accent transition-colors">
                      Connect Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section id="experience" className="py-48 px-6 text-center">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            {[
              { icon: <PlayCircle size={56} className="text-brand-accent" />, title: "Vocal Depths", desc: "Interactive voice playback that mirrors real-world emotions and cultural cadences." },
              { icon: <Languages size={56} className="text-brand-accent" />, title: "Poetic Soul", desc: "AI that speaks in soulful Shayari and poetry, touching your heart with every word." },
              { icon: <Sparkles size={56} className="text-brand-accent" />, title: "Visual Moments", desc: "Exchange images and receive reactive, personalized selfies from your companion." }
            ].map((f, i) => (
              <div key={i} className="group p-12 rounded-[3.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <div className="mb-10 mx-auto w-24 h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center group-hover:-translate-y-2 transition-transform shadow-2xl">
                  {f.icon}
                </div>
                <h3 className="text-4xl font-display font-black mb-6">{f.title}</h3>
                <p className="text-white/30 text-xl leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-40 bg-black relative border-t border-white/5 text-center px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-8xl font-display font-black italic tracking-tighter mb-16 opacity-10">DilConnect</h2>
            <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-20">
              <a href="#" className="hover:text-brand-accent transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Safety Center</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Terms of Service</a>
            </div>
            <p className="text-white/5 font-mono text-[10px] uppercase tracking-[1em]">© 2026. THE FUTURE OF CONNECTION.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${currentTheme.bg} overflow-hidden transition-colors duration-500`}>

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
              <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6 px-1">
                <Users size={12} className={currentTheme.accentText} />
                <span>Companion List</span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {PERSONAS.map((p) => (
                  <button
                    id={`persona-${p.id}`}
                    key={p.id}
                    onClick={() => {
                      setSelectedPersona(p);
                      setCustomName('');
                      setMessages([]); 
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full group flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 border ${
                      selectedPersona.id === p.id 
                        ? `${currentTheme.accent} text-white shadow-[0_15px_40px_rgba(0,0,0,0.4)] scale-[1.02] border-white/20` 
                        : `bg-white/5 hover:bg-white/10 ${currentTheme.text} border-white/5`
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-2xl" referrerPolicy="no-referrer" />
                      {selectedPersona.id === p.id && (
                        <motion.div 
                          layoutId="active-dot"
                          className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-black shadow-lg" 
                        />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-display font-black text-base truncate">{p.name}</p>
                      <p className={`text-[11px] font-medium ${selectedPersona.id === p.id ? 'text-white/80' : 'text-white/40'} truncate`}>
                        {p.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Customization Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6 px-1">
                <Palette size={12} className={currentTheme.accentText} />
                <span>Personalization</span>
              </div>

              {/* Vibe Selection */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Friendly', emoji: '🤝' },
                  { label: 'Romantic', emoji: '💝' },
                  { label: 'Spicy', emoji: '🔥' },
                  { label: 'Deep', emoji: '🧠' },
                  { label: 'Shayari', emoji: '📜' }
                ].map((v) => (
                  <button
                    key={v.label}
                    onClick={() => setVibe(v.label as any)}
                    className={`py-4 rounded-2xl text-xs font-black border-2 transition-all duration-300 relative overflow-hidden group ${
                      vibe === v.label 
                        ? `${currentTheme.accent} text-white border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.3)]` 
                        : `bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10`
                    } ${v.label === 'Shayari' ? 'col-span-2' : ''}`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-lg">{v.emoji}</span>
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Custom Nickname</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedPersona.name}
                  className="w-full p-4 bg-white/5 text-white border border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 font-bold placeholder:text-white/5 transition-all"
                />
              </div>
            </section>

            {/* 3. Appearance Section */}
            <section>
              <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6 px-1">
                <Palette size={12} className={currentTheme.accentText} />
                <span>Visual Themes</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'classic', label: 'Classic', color: 'bg-brand-accent' },
                  { id: 'midnight', label: 'Midnight', color: 'bg-brand-blue' },
                  { id: 'rose', label: 'Rose', color: 'bg-rose-500' },
                  { id: 'forest', label: 'Forest', color: 'bg-[#5A7D2C]' },
                  { id: 'sunset', label: 'Sunset', color: 'bg-orange-600' },
                  { id: 'passion', label: 'Passion', color: 'bg-red-600' },
                  { id: 'winter', label: 'Winter', color: 'bg-blue-600' },
                  { id: 'lavender', label: 'Lavender', color: 'bg-purple-600' },
                  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-600' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 ${
                      theme === t.id ? 'border-brand-accent bg-brand-accent/5' : 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${t.color} shadow-2xl`} />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <button 
            id="clear-chat"
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-4 text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
          >
            <Trash2 size={16} />
            <span>Wipe History</span>
          </button>

          {/* App Installation */}
          <div className="mt-8 p-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <h3 className="text-[10px] font-black text-white/10 uppercase tracking-widest mb-3">PWA Launch</h3>
            <p className="text-[11px] text-white/30 mb-4 leading-relaxed">Tap <strong className="text-white">'Share'</strong> then <strong className="text-white">'Add to Home Screen'</strong> for the true native experience.</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-accent uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span>Available Globally</span>
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
                <div className={`${currentTheme.modelBubble} p-6 rounded-[2rem] rounded-bl-none shadow-sm flex items-center gap-2`}>
                  <div className="flex gap-2">
                    {[0, 0.2, 0.4].map(delay => (
                      <motion.div 
                        key={delay}
                        animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay }}
                        className={`w-2 h-2 ${currentTheme.accent} rounded-full`} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Conversation Starters */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="max-w-3xl mx-auto w-full px-6 mb-6 relative z-10">
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="px-6 py-3 bg-white/5 hover:bg-brand-accent/20 backdrop-blur-xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all shadow-xl"
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
            <AnimatePresence>
              {selectedMedia && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-6 shadow-2xl"
                >
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl border border-white/20 group shrink-0">
                    {selectedMedia.type === 'image' ? (
                      <img src={selectedMedia.preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <Film className="text-white" size={32} />
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedMedia(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-brand-accent transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent">Reaction Goal</p>
                    <div className="flex flex-wrap gap-2">
                      {['Compliment', 'Extra Sweet', 'Loving Roast', 'Longing'].map(goal => (
                        <button
                          key={goal}
                          onClick={() => setSelectedReactionGoal(goal)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedReactionGoal === goal 
                              ? 'bg-brand-accent text-white border-transparent shadow-lg' 
                              : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group p-2 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  id="message-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${customName || selectedPersona.name}...`}
                  className="flex-1 p-4 bg-transparent text-white border-none focus:ring-0 text-sm lg:text-base placeholder:text-white/10 font-medium"
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
                    className={`p-3 transition-all rounded-xl ${
                      isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-white/20 hover:text-brand-accent'
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
                      p-3.5 rounded-[1.5rem] transition-all
                      ${isLoading || (!input.trim() && !selectedMedia) 
                        ? 'bg-white/5 text-white/5' 
                        : 'bg-brand-accent text-white hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,46,99,0.3)]'}
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


