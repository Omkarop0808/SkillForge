import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Plus, Video, FileText, ChevronLeft, Save,
  Bold, Italic, Underline, Highlighter, Heading1, Heading2,
  List, ListOrdered, Code, Image as ImageIcon, CornerDownLeft, Circle
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function NotesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, youtube, article, manual
  
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef(null);

  // Load notes on mount
  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('skillforge_notes') || '[]');
    setNotes(loaded);
  }, []);

  // Save functionality with debounce
  useEffect(() => {
    if (!activeNoteId) return;

    const timer = setTimeout(() => {
      saveActiveNote();
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, activeNoteId]);

  const saveActiveNote = () => {
    setIsSaving(true);
    localStorage.setItem('skillforge_notes', JSON.stringify(notes));
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      tags: ['Manual'],
      sourceType: 'manual',
      url: '',
      date: new Date().toISOString(),
      content: '',
      bgColor: '#130922' // default dark purple
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  const updateActiveNote = (updates) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates } : n));
  };

  const handleEditorInput = (e) => {
    updateActiveNote({ content: e.currentTarget.innerHTML });
  };

  // Sync editor innerHTML when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote && editorRef.current.innerHTML !== activeNote.content) {
      editorRef.current.innerHTML = activeNote.content || '';
    }
  }, [activeNoteId]);

  const formatDoc = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
        updateActiveNote({ content: editorRef.current.innerHTML });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.targe.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        formatDoc('insertImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || n.sourceType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#06020c] font-sans selection:bg-purple-500/30 text-slate-300 flex overflow-hidden">
      
      {/* LEFT PANEL: Note List */}
      <div className={`${activeNote ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-white/5 bg-[#0a0514] flex-col relative z-20 shadow-2xl h-screen`}>
        <div className="p-6 border-b border-white/5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-medium text-white flex items-center gap-3">
              <BookOpen className="text-purple-500" /> My Notes
            </h1>
            <button 
              onClick={handleCreateNote}
              className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'youtube', 'article', 'manual'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterType === type ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 text-sm">No notes found. Create a new one or extract from Notebook AI!</div>
          ) : (
            filteredNotes.map(n => (
              <div 
                key={n.id}
                onClick={() => setActiveNoteId(n.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${activeNoteId === n.id ? 'bg-purple-500/10 border-purple-500/50 shadow-inner' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium text-sm line-clamp-1">{n.title}</h3>
                  {n.sourceType === 'youtube' && <Video className="w-4 h-4 text-red-400 shrink-0" />}
                  {n.sourceType === 'article' && <FileText className="w-4 h-4 text-blue-400 shrink-0" />}
                  {n.sourceType === 'manual' && <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mb-3">{new Date(n.date).toLocaleDateString()}</p>
                <div className="flex gap-2 flex-wrap">
                  {n.tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-slate-400">{t}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Editor */}
      {activeNote ? (
        <div className={`${activeNote ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative h-screen`} style={{ backgroundColor: activeNote.bgColor || '#130922' }}>
          
          {/* Editor Toolbar */}
          <div className="h-16 px-4 md:px-6 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 w-full overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setActiveNoteId(null)} 
                className="md:hidden p-2 mr-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => formatDoc('bold')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
              <button onClick={() => formatDoc('italic')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
              <button onClick={() => formatDoc('underline')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button onClick={() => formatDoc('formatBlock', 'H1')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
              <button onClick={() => formatDoc('formatBlock', 'H2')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button onClick={() => formatDoc('insertUnorderedList')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bullet List"><List className="w-4 h-4" /></button>
              <button onClick={() => formatDoc('insertOrderedList')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
              <button onClick={() => formatDoc('formatBlock', 'PRE')} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Code Block"><Code className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <label className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Insert Image">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => formatDoc('insertImage', ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" />
              </label>
              <div className="relative group">
                 <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1" title="Highlight Color">
                    <Highlighter className="w-4 h-4" />
                 </button>
                 <div className="absolute top-full left-0 mt-2 p-2 bg-[#1a0b33] border border-white/10 rounded-xl shadow-2xl hidden group-hover:flex gap-2 z-50">
                    {['#facc15', '#f87171', '#4ade80', '#60a5fa', '#c084fc'].map(color => (
                        <button key={color} onClick={() => formatDoc('hiliteColor', color)} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }}></button>
                    ))}
                 </div>
              </div>
              <div className="relative group ml-2">
                 <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1" title="Note Background">
                    <Circle className="w-4 h-4" />
                 </button>
                 <div className="absolute top-full left-0 mt-2 p-2 bg-[#1a0b33] border border-white/10 rounded-xl shadow-2xl hidden group-hover:flex gap-2 z-50">
                    {['#130922', '#1e1b4b', '#064e3b', '#451a03', '#312e81'].map(color => (
                        <button key={color} onClick={() => updateActiveNote({ bgColor: color })} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color }}></button>
                    ))}
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isSaving ? (
                <span className="text-xs text-purple-400 flex items-center gap-1 animate-pulse"><Save className="w-3 h-3" /> Saving...</span>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1"><Save className="w-3 h-3" /> Saved</span>
              )}
            </div>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-12 max-w-4xl mx-auto w-full">
            <input 
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              className="w-full bg-transparent text-4xl font-display font-medium text-white mb-6 border-none focus:outline-none placeholder-slate-600"
              placeholder="Note Title..."
            />
            {activeNote.url && (
               <a href={activeNote.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-black/30 rounded-lg text-sm text-purple-400 hover:text-purple-300 border border-purple-500/20 w-max">
                 {activeNote.sourceType === 'youtube' ? <Video className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                 Source URL <CornerDownLeft className="w-3 h-3"/>
               </a>
            )}
            
            {/* Custom ContentEditable Rich Text */}
            <div 
              ref={editorRef}
              className="outline-none min-h-[500px] text-slate-200 leading-relaxed text-lg prose prose-invert prose-purple max-w-none"
              contentEditable
              onInput={handleEditorInput}
              suppressContentEditableWarning={true}
              style={{ paddingBottom: '100px' }}
            >
            </div>
          </div>

        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0a0514] h-screen">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-xl text-slate-400 font-display">Select a note to start editing</h2>
          <p className="text-sm text-slate-500 mt-2">Create new notes or extract them directly from the AI Notebook</p>
        </div>
      )}
    </div>
  );
}
