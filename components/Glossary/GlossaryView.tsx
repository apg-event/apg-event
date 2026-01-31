import React, { useState, useRef } from 'react';
import { GLOSSARY_DATA } from '../../data/glossaryData';
import { GlossaryCategory, WheelSubCategory, RulesSubCategory } from '../../types';
import { Search, Dices, BookOpen, Package, Zap, Skull, Image as ImageIcon, Users, Gamepad2, ArrowUp } from 'lucide-react';

// --- HELPER: Simple Markdown Parser ---
// Handles:
// 1. Line breaks (\n)
// 2. URLs (http/https) -> Clickable links
// 3. Bold text (**text**)
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Process URLs
                const parts = line.split(/(https?:\/\/[^\s]+)/g);
                
                return (
                    <div key={i} className="min-h-[1.5em] break-words">
                        {parts.map((part, j) => {
                            if (part.match(/^https?:\/\//)) {
                                return (
                                    <a 
                                        key={j} 
                                        href={part} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-ice-400 hover:text-ice-300 underline font-medium transition-colors"
                                    >
                                        {part}
                                    </a>
                                );
                            }
                            // Process Bold (**text**) inside the part
                            const boldParts = part.split(/(\*\*.*?\*\*)/g);
                            return (
                                <span key={j}>
                                    {boldParts.map((bp, k) => {
                                        if (bp.startsWith('**') && bp.endsWith('**')) {
                                            return <strong key={k} className="font-bold text-ice-100">{bp.slice(2, -2)}</strong>;
                                        }
                                        return bp;
                                    })}
                                </span>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export const GlossaryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<GlossaryCategory>('Rules');
  
  // Unified subcategory state. 'All' works for both categories.
  const [activeSubCategory, setActiveSubCategory] = useState<WheelSubCategory | RulesSubCategory | 'All'>('All');

  // Scroll Logic
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
      if (scrollContainerRef.current) {
          const { scrollTop } = scrollContainerRef.current;
          // Show button after scrolling down 300px
          setShowScrollTop(scrollTop > 300);
      }
  };

  const scrollToTop = () => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter Logic
  const filteredEntries = GLOSSARY_DATA.filter(entry => {
    const matchesSearch = 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = entry.category === activeTab;
    
    let matchesSub = true;
    if (activeSubCategory !== 'All') {
        matchesSub = entry.subcategory === activeSubCategory;
    }

    return matchesSearch && matchesTab && matchesSub;
  });

  // Dynamic Subtabs Configuration
  const getSubTabs = () => {
      if (activeTab === 'Wheel') {
          return [
              { id: 'All', label: 'Все', icon: null },
              { id: 'Items', label: 'Предметы', icon: Package },
              { id: 'Events', label: 'События', icon: Zap },
              { id: 'Traps', label: 'Ловушки', icon: Skull },
          ];
      }
      if (activeTab === 'Rules') {
          return [
              { id: 'All', label: 'Все', icon: null },
              { id: 'Viewers', label: 'Для зрителей', icon: Users },
              { id: 'Streamers', label: 'Для стримеров', icon: Gamepad2 },
          ];
      }
      return [];
  };

  const subTabs = getSubTabs();

  // Helper function to resolve colors for grid cards based on isPositive or subcategory
  const getEntryColors = (entry: any) => {
      // 1. Explicit override via isPositive (Green/Red)
      if (entry.isPositive === true) {
          return {
              bg: 'bg-emerald-500',
              text: 'text-emerald-400',
              border: 'border-emerald-500/20',
              badgeBg: 'bg-emerald-500/10'
          };
      }
      if (entry.isPositive === false) {
          return {
              bg: 'bg-rose-500',
              text: 'text-rose-400',
              border: 'border-rose-500/20',
              badgeBg: 'bg-rose-500/10'
          };
      }

      // 2. Default fallback based on Subcategory
      if (entry.subcategory === 'Items') {
          return {
              bg: 'bg-amber-400',
              text: 'text-amber-400',
              border: 'border-amber-500/20',
              badgeBg: 'bg-amber-500/10'
          };
      }
      if (entry.subcategory === 'Events') {
          return {
              bg: 'bg-ice-400',
              text: 'text-ice-400',
              border: 'border-ice-500/20',
              badgeBg: 'bg-ice-500/10'
          };
      }
      // Traps fallback
      return {
          bg: 'bg-rose-500',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          badgeBg: 'bg-rose-500/10'
      };
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0C15] overflow-hidden relative">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex-shrink-0 p-4 md:p-8 pb-4 border-b border-white/5 bg-midnight-950/50 backdrop-blur-xl z-20">
            <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                
                {/* Title & Tabs */}
                <div className="flex flex-col gap-4 w-full lg:w-auto">
                    {/* <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-ice-300">
                        База Знаний
                    </h2> */}
                    
                    {/* Main Tabs Switcher */}
                    <div className="flex p-1 bg-midnight-900 rounded-xl border border-white/5 w-full md:w-fit">
                        <button 
                            onClick={() => { setActiveTab('Rules'); setSearchTerm(''); setActiveSubCategory('All'); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                activeTab === 'Rules' 
                                ? 'bg-ice-600 text-white shadow-lg shadow-ice-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <BookOpen size={16} /> Правила
                        </button>
                        <button 
                            onClick={() => { setActiveTab('Wheel'); setSearchTerm(''); setActiveSubCategory('All'); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                activeTab === 'Wheel' 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Dices size={16} /> Колесо<span className="hidden md:inline">&nbsp;Приколов</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group w-full lg:w-80">
                    <Search className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-ice-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'Rules' ? "Поиск по правилам..." : "Поиск предметов и событий..."}
                        className="w-full bg-midnight-800/50 border border-white/10 text-slate-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-ice-500/50 focus:bg-midnight-800 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Sub-Tabs (Always visible if category has subcategories) */}
            {subTabs.length > 0 && (
                <div className="max-w-6xl mx-auto w-full mt-4 pt-4 border-t border-white/5 flex gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-1">
                    {subTabs.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => setActiveSubCategory(sub.id as any)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                                activeSubCategory === sub.id
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                            }`}
                        >
                            {sub.icon && <sub.icon size={12} />}
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* --- CONTENT SECTION --- */}
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8"
        >
            <div className="max-w-6xl mx-auto min-h-full pb-20">
                
                {/* VIEW 1: RULES (Document Style) */}
                {activeTab === 'Rules' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredEntries.map((rule, idx) => (
                            <div key={rule.id} className="relative pl-6 md:pl-0">
                                {/* Decor Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ice-500 to-transparent md:hidden"></div>
                                
                                <div className="bg-midnight-900/40 border border-white/5 rounded-2xl p-5 md:p-8 hover:bg-midnight-900/60 transition-colors">
                                    <h3 className="text-xl md:text-2xl font-bold text-ice-100 mb-2 flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ice-500/10 text-ice-400 text-sm font-mono border border-ice-500/20 flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        {rule.title}
                                    </h3>
                                    
                                    {/* Subcategory Tag */}
                                    {rule.subcategory && (
                                        <div className="mb-4 ml-11">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                                                rule.subcategory === 'Streamers' 
                                                ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' 
                                                : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                                            }`}>
                                                {rule.subcategory === 'Streamers' ? 'Для стримеров' : 'Для зрителей'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-slate-300 leading-relaxed text-base md:text-lg font-light ml-0 md:ml-11">
                                        <MarkdownText text={rule.description} />
                                    </div>
                                </div>
                            </div>
                        ))}
                         {filteredEntries.length === 0 && (
                            <div className="text-center py-20 text-slate-500">
                                Правила не найдены
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 2: WHEEL (Grid Cards) */}
                {activeTab === 'Wheel' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in zoom-in duration-300">
                        {filteredEntries.map(entry => {
                            const colors = getEntryColors(entry);
                            
                            return (
                                <div 
                                    key={entry.id} 
                                    className="group bg-midnight-800/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl hover:border-ice-500/30 hover:bg-midnight-800/80 transition-all duration-300 flex gap-4 items-start"
                                >
                                    {/* 1:1 Icon Slot (Top Left) */}
                                    <div className="w-16 h-16 flex-shrink-0 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-ice-500/20 transition-colors">
                                        
                                        {/* 
                                            IMAGE LOADING LOGIC:
                                            1. Tries to load /assets/icons/{id}.png
                                            2. If fails, hides the img and shows the fallback ImageIcon
                                        */}
                                        <img 
                                            src={`/assets/icons/${entry.id}.png`} 
                                            alt={entry.title}
                                            className="w-full h-full object-cover p-1 z-10 relative"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                // Find the sibling icon and show it
                                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                        
                                        {/* Fallback Icon */}
                                        <ImageIcon className="fallback-icon hidden text-slate-600 w-6 h-6 opacity-50 absolute z-0" />
                                        
                                        {/* Color Overlay (Tint) */}
                                        <div className={`absolute inset-0 opacity-10 pointer-events-none ${colors.bg}`}></div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-100 group-hover:text-ice-200 transition-colors leading-tight">
                                                {entry.title}
                                            </h4>
                                        </div>
                                        
                                        {/* Tag */}
                                        <div className="mb-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${colors.text} ${colors.border} ${colors.badgeBg}`}>
                                                {entry.subcategory === 'Items' ? 'Предмет' :
                                                 entry.subcategory === 'Events' ? 'Событие' : 'Ловушка'}
                                            </span>
                                        </div>

                                        <div className="text-slate-400 text-xs leading-relaxed">
                                            <MarkdownText text={entry.description} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredEntries.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-500 italic border border-dashed border-white/5 rounded-3xl">
                                Элементы не найдены
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>

        {/* --- SCROLL TO TOP BUTTON --- */}
        <button
            onClick={scrollToTop}
            className={`
                fixed bottom-8 right-8 z-50 p-3 rounded-full bg-ice-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-ice-400/50
                transition-all duration-500 transform hover:scale-110 hover:bg-ice-500 active:scale-95
                ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
            `}
            title="Наверх"
        >
            <ArrowUp size={24} className="animate-pulse" />
        </button>
    </div>
  );
};