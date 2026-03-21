import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { 
  Flame, Play, Users, Trophy, ChevronRight, CheckCircle2, 
  XCircle, Clock, Copy, Plus, X, BrainCircuit, ArrowLeft, Activity, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE } from '../utils/api';

export default function QuizArena() {
  const navigate = useNavigate();
  const { user } = useUser();
  const playerName = user?.firstName || 'Student';
  const clientId = useRef(crypto.randomUUID()).current;

  // --- STATE MACHINE ---
  // modes: 'home' -> 'lobby' -> 'playing' -> 'results'
  const [mode, setMode] = useState('home');
  
  // --- LOBBY/MULTIPLAYER STATE ---
  const [roomCode, setRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomState, setRoomState] = useState(null); // { players: {}, host_id, ... }
  const [ws, setWs] = useState(null);

  // --- GAME STATE ---
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  
  // --- PLAYING STATE ---
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [revealedCorrectOption, setRevealedCorrectOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  // --- HOST SETTINGS ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  // ------------------------------------------------------------------------
  // WEBSOCKET LIFECYCLE
  // ------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (ws) ws.close();
    };
  }, [ws]);

  const connectToRoom = (code) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const basePath = API_BASE.startsWith('http') 
        ? API_BASE.replace(/^http/, 'ws') 
        : `${protocol}//${host}${API_BASE}`;
        
    const wsUrl = `${basePath}/quiz/ws/quiz/${code}/${clientId}/${playerName}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWs(socket);
      setRoomCode(code);
      setMode('lobby');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'room_state') {
        setRoomState(data);
      }
      else if (data.type === 'game_started') {
        setMode('playing');
        setQuestions(data.questions || []); 
        setCurrentQuestion(data.questions[0]);
        setQIndex(0);
        resetPlayState();
      }
      else if (data.type === 'game_over') {
        setRoomState(prev => ({ ...prev, players: data.final_leaderboard }));
        setMode('results');
        triggerConfetti(data.final_leaderboard);
      }
    };

    socket.onclose = () => {
      console.log("WS Disconnected");
    };
  };

  const resetPlayState = () => {
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setRevealedCorrectOption(null);
    setTimeLeft(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (!isAnswerLocked && mode === 'playing') {
      submitAnswer(null, 30);
    }
  };

  // ------------------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------------------
  const handleCreateRoom = async () => {
    try {
      const res = await fetch(`${API_BASE}/quiz/create-room`);
      if (!res.ok) throw new Error("Backend offline or missing endpoint");
      const data = await res.json();
      connectToRoom(data.room_code);
    } catch (e) {
      alert("Failed to create room. Ensure the AI Backend is running.");
      console.error(e);
    }
  };

  const handleJoinRoom = () => {
    if (joinCodeInput.length === 6) connectToRoom(joinCodeInput.toUpperCase());
  };

  const handleGenerateQuestions = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput, num_questions: numQuestions })
      });
      const data = await res.json();
      setGeneratedQuestions(data.questions);
    } catch (e) {
      alert("Failed to generate AI Quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartMatch = () => {
    if (!generatedQuestions) return;
    ws.send(JSON.stringify({
      action: 'start_game',
      questions: generatedQuestions
    }));
  };

  const submitAnswer = (option, timeTaken) => {
    setIsAnswerLocked(true);
    setSelectedOption(option);
    clearInterval(timerRef.current);
    
    ws.send(JSON.stringify({
      action: 'submit_answer',
      question_index: qIndex,
      selected_option: option,
      time_taken: timeTaken
    }));
    
    // Auto-Verify locally against full array payload
    const correctOption = questions[qIndex].correct_option;
    setRevealedCorrectOption(correctOption);
    
    // Emulate a swift transition pause for Asynchronous Player Progression
    setTimeout(() => {
      const nextIndex = qIndex + 1;
      if (nextIndex < questions.length) {
        setQIndex(nextIndex);
        setCurrentQuestion(questions[nextIndex]);
        resetPlayState();
      } else {
        // Player independently finished! Wait for everyone else in Spectator mode.
        setMode('waiting_results');
        ws.send(JSON.stringify({ action: 'player_finished' }));
      }
    }, 2500); 
  };

  const triggerConfetti = (leaderboard) => {
    // Check if I won
    const sorted = Object.values(leaderboard).sort((a,b) => b.score - a.score);
    if (sorted[0]?.name === playerName) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  // ------------------------------------------------------------------------
  // RENDERERS
  // ------------------------------------------------------------------------
  
  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-[#06020c] font-sans selection:bg-orange-500/30 text-slate-300 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION - Simplified for Arena */}
        <aside className="hidden md:flex w-20 lg:w-64 border-r border-white/5 bg-[#0a0514] flex-col p-4 shadow-2xl z-20 transition-all">
           <div className="flex items-center gap-3 mb-8 cursor-pointer justify-center lg:justify-start" onClick={() => navigate('/dashboard')}>
             <ArrowLeft className="w-5 h-5 text-slate-400 hover:text-white" />
             <span className="hidden lg:block font-bold mt-1 tracking-tight text-slate-300">Back to Hub</span>
           </div>
           <div className="flex-1"></div>
           <div className="flex justify-center lg:justify-start pt-4 border-t border-white/5">
             <UserButton afterSignOutUrl="/" />
           </div>
        </aside>

        {/* MAIN HOME */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative w-full overflow-y-auto">
          <div className="md:hidden absolute top-6 left-6 cursor-pointer p-2 bg-white/5 rounded-full z-50 text-slate-400 hover:text-white" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6" />
          </div>

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex items-center justify-center w-20 h-20 bg-orange-500/10 rounded-full mb-6 relative z-10 shadow-[0_0_50px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20">
            <Flame className="w-10 h-10 text-orange-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-medium text-white mb-4 z-10 text-center">
            Multiplayer <span className="text-orange-400">Quiz Arena</span>
          </h1>
          <p className="text-slate-400 text-center max-w-lg mb-12 z-10 px-4">
            Challenge your friends in real-time or practice solo with infinite AI-generated questions based on your learning map.
          </p>

          <div className="flex flex-col md:flex-row gap-6 z-10 w-full max-w-2xl">
            {/* Create Room */}
            <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all shadow-xl backdrop-blur-sm group">
              <Users className="w-8 h-8 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">Host a match</h3>
              <p className="text-sm text-slate-500 mb-6">Create a room, pick a topic, and invite friends.</p>
              <button 
                onClick={handleCreateRoom}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create Room
              </button>
            </div>

            {/* Join Room */}
            <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all shadow-xl backdrop-blur-sm group">
              <Play className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">Join a match</h3>
              <p className="text-sm text-slate-500 mb-6">Enter a 6-digit code to join a live arena.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="CODE"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-[0.2em] focus:outline-none focus:border-purple-500 uppercase"
                />
                <button 
                  onClick={handleJoinRoom}
                  disabled={joinCodeInput.length !== 6}
                  className="px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- LOBBY MODE ---
  if (mode === 'lobby') {
    const isHost = roomState?.host_id === clientId;
    const players = Object.values(roomState?.players || {});

    return (
      <div className="min-h-screen bg-[#06020c] font-sans text-slate-300 flex flex-col items-center pt-20 px-6">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-sm font-bold text-orange-400 tracking-widest uppercase mb-1">Lobby Room Code</p>
              <h1 className="text-5xl font-mono text-white tracking-[0.2em]">{roomCode}</h1>
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(roomCode); alert("Code copied!"); }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/10"
            >
              <Copy className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Player List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Players ({players.length})
              </h3>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-white font-medium">{p.name}</span>
                    {p.name === playerName && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">You</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Host Controls */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-orange-400" /> AI Settings
              </h3>
              
              {isHost ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Topic</label>
                    <input 
                      type="text" 
                      placeholder="e.g. React Hooks, System Design..."
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Questions</label>
                     <div className="flex gap-2">
                        {[5, 10, 15].map(n => (
                          <button 
                            key={n} onClick={() => setNumQuestions(n)}
                            className={`flex-1 py-2 rounded-xl border font-bold text-sm ${numQuestions === n ? 'bg-orange-500 text-white border-orange-500' : 'bg-black/50 text-slate-400 border-white/10 hover:border-white/20'}`}
                          >
                            {n}
                          </button>
                        ))}
                     </div>
                  </div>
                  
                  {!generatedQuestions ? (
                    <button 
                      onClick={handleGenerateQuestions}
                      disabled={isGenerating || !topicInput}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? "Generating AI Questions..." : "Generate Test"}
                    </button>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-inner">
                        <CheckCircle2 className="w-5 h-5" /> Questions Preloaded!
                      </div>
                      <button 
                        onClick={handleStartMatch}
                        disabled={players.length < 1} // allow solo for testing
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                      >
                        <Play className="w-5 h-5 fill-current" /> Start Match Now
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-8">
                  <Clock className="w-8 h-8 mb-3" />
                  <p>Waiting for Host to configure AI and start the match...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING MODE ---
  if (mode === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen bg-[#06020c] font-sans text-slate-300 flex flex-col items-center pt-10 px-6">
        {/* Top Bar Status */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-12 bg-white/5 border border-white/10 p-4 rounded-2xl">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-400 ring-1 ring-orange-500/30">
               {qIndex + 1}
             </div>
             <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
               of {roomState?.total_questions || '?'}
             </span>
           </div>
           
           <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
             <Clock className="w-5 h-5" /> 00:{timeLeft.toString().padStart(2, '0')}
           </div>
           
           <div className="text-right">
             <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Score</p>
             <p className="text-xl text-purple-400 font-mono font-bold">
               {roomState?.players?.[clientId]?.score || 0}
             </p>
           </div>
        </div>

        {/* Question Canvas */}
        <div className="w-full max-w-4xl">
           <h2 className="text-3xl md:text-4xl font-display font-medium text-white mb-10 leading-tight">
             {currentQuestion.question}
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                let bgStyle = "bg-white/5 hover:bg-white/10 border-white/10";
                let textStyle = "text-slate-300";
                let icon = null;

                if (revealedCorrectOption) {
                  if (opt === revealedCorrectOption) {
                    bgStyle = "bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]";
                    textStyle = "text-green-400 font-bold";
                    icon = <CheckCircle2 className="w-5 h-5 text-green-400" />;
                  } else if (isSelected) {
                    bgStyle = "bg-red-500/20 border-red-500";
                    textStyle = "text-red-400";
                    icon = <XCircle className="w-5 h-5 text-red-400" />;
                  } else {
                    bgStyle = "bg-black/40 border-white/5 opacity-50";
                  }
                } else if (isSelected) {
                  bgStyle = "bg-purple-600 border-purple-500 shadow-lg scale-[1.02]";
                  textStyle = "text-white font-bold";
                }

                return (
                  <button
                    key={i}
                    disabled={isAnswerLocked}
                    onClick={() => submitAnswer(opt, 30 - timeLeft)}
                    className={`p-6 rounded-2xl border flex items-center justify-between text-left transition-all ${bgStyle}`}
                  >
                    <span className={`text-lg ${textStyle}`}>{opt}</span>
                    {icon}
                  </button>
                )
              })}
           </div>

           {isAnswerLocked && !revealedCorrectOption && (
             <p className="text-center mt-12 text-slate-500 animate-pulse">Waiting for other players...</p>
           )}
           {revealedCorrectOption && (
             <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300 animate-fade-in flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">AI Explanation</span>
                <p>{currentQuestion.explanation}</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- SPECTATOR / WAITING RESULTS MODE ---
  if (mode === 'waiting_results') {
    const sortedPlayers = Object.values(roomState?.players || {}).sort((a,b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-[#06020c] font-sans text-slate-300 flex flex-col items-center pt-20 px-6">
         <div className="text-center mb-12 animate-pulse">
           <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
           <h1 className="text-4xl font-display font-medium text-white mb-2">You Finished Early!</h1>
           <p className="text-slate-400">Waiting for other players to complete their questions...</p>
         </div>
         
         <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" /> Live Spectator Board
            </h3>
            <div className="space-y-4">
               {sortedPlayers.map((p, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border relative overflow-hidden transition-all ${p.finished ? 'bg-green-500/5 border-green-500/20' : 'bg-black/40 border-white/5'}`}>
                     {p.finished && <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-bl-2xl flex items-center justify-center shadow-lg"><CheckCircle2 className="w-4 h-4 text-green-400"/></div>}
                     
                     <div className="flex items-center gap-4">
                       <span className="text-orange-400 font-bold w-6">#{i+1}</span>
                       <span className={`text-lg font-medium flex items-center gap-2 ${p.name === playerName ? 'text-white' : 'text-slate-300'}`}>
                         {p.name} {p.name === playerName && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded ml-1 tracking-wider uppercase">You</span>}
                       </span>
                     </div>
                     <span className="text-xl font-mono text-purple-400 font-bold">{p.score}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  // --- RESULTS MODE ---
  if (mode === 'results') {
    const sortedPlayers = Object.values(roomState?.players || {}).sort((a,b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-[#06020c] font-sans text-slate-300 flex flex-col items-center pt-20 px-6">
         <div className="text-center mb-12 animate-fade-in">
           <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
           <h1 className="text-5xl font-display font-bold text-white mb-2">Match Complete!</h1>
           <p className="text-slate-400">The AI has verified the final standings.</p>
         </div>

         <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
            {sortedPlayers.map((p, i) => (
               <div key={i} className={`flex items-center justify-between p-4 rounded-xl mb-3 ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : i === 1 ? 'bg-slate-300/10 border border-slate-300/30' : 'bg-black/50 border border-white/5'}`}>
                 <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-slate-300 text-black':'bg-white/10 text-slate-400'}`}>
                     {i+1}
                   </div>
                   <span className={`font-medium ${i===0?'text-yellow-400':i===1?'text-slate-200':'text-white'}`}>{p.name} {p.name === playerName ? '(You)' : ''}</span>
                 </div>
                 <span className="font-mono font-bold text-xl text-purple-400">{p.score} <span className="text-xs text-slate-500 uppercase tracking-widest ml-1">pts</span></span>
               </div>
            ))}
            
            {/* --- QUIZ REVIEW SECTION --- */}
            <div className="mt-16 pt-12 border-t border-white/10 w-full text-left">
               <h2 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                 <BrainCircuit className="w-8 h-8 text-purple-400" />
                 Post-Match Review
               </h2>
               
               <div className="space-y-8">
                 {questions.map((q, idx) => {
                   const myAnswer = roomState?.players?.[clientId]?.answers?.find(a => a.q_index === idx);
                   const isCorrect = myAnswer?.correct;
                   
                   return (
                     <div key={idx} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                       {/* Status Ribbon */}
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                       
                       <div className="flex items-start gap-4 mb-6">
                         <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold mt-1 ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                           {idx + 1}
                         </div>
                         <h3 className="text-xl font-medium text-white leading-relaxed">{q.question}</h3>
                       </div>
                       
                       {/* Options Array */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 sm:pl-12">
                         {q.options.map((opt, oIdx) => {
                           const isSelectedOption = myAnswer?.selected === opt;
                           const isActualCorrectOption = q.correct_option === opt;
                           
                           let optStyle = "bg-white/5 border-white/10 text-slate-400"; // Default
                           let Icon = null;
                           
                           if (isActualCorrectOption) {
                             optStyle = "bg-green-500/20 border-green-500/50 text-green-400 font-bold ring-1 ring-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                             Icon = CheckCircle2;
                           } else if (isSelectedOption && !isActualCorrectOption) {
                             optStyle = "bg-red-500/20 border-red-500/50 text-red-400 font-bold";
                             Icon = XCircle;
                           }
                           
                           return (
                             <div key={oIdx} className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${optStyle}`}>
                               <span>{opt}</span>
                               {Icon && <Icon className="w-5 h-5" />}
                             </div>
                           );
                         })}
                       </div>
                       
                       {/* AI Explanation Panel */}
                       <div className="sm:ml-12 p-5 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2">
                           <Sparkles className="w-4 h-4" /> Why this is correct
                         </h4>
                         <p className="text-sm text-slate-300 leading-relaxed">
                           {q.explanation}
                         </p>
                       </div>
                       
                     </div>
                   )
                 })}
               </div>
            </div>

            <button 
              onClick={() => { setMode('home'); setRoomCode(''); }}
              className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
            >
              Exit Arena
            </button>
         </div>
      </div>
    );
  }

  return null;
}
