import React, { useState } from 'react';
import { GLOSSARY_DATA } from '../../data/glossaryData';
import { GlossaryCategory, WheelSubCategory } from '../../types';
import { Search, Dices, BookOpen, Package, Zap, Skull, Image as ImageIcon } from 'lucide-react';

export const GlossaryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<GlossaryCategory>('Rules');
  const [activeSubCategory, setActiveSubCategory] = useState<WheelSubCategory | 'All'>('All');

  // Filter Logic
  const filteredEntries = GLOSSARY_DATA.filter(entry => {
    const matchesSearch = 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = entry.category === activeTab;
    
    let matchesSub = true;
    if (activeTab === 'Wheel' && activeSubCategory !== 'All') {
        matchesSub = entry.subcategory === activeSubCategory;
    }

    return matchesSearch && matchesTab && matchesSub;
  });

  return (
    <div className="flex flex-col h-full bg-[#0B0C15] overflow-hidden">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex-shrink-0 p-8 pb-4 border-b border-white/5 bg-midnight-950/50 backdrop-blur-xl z-20">
            <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                
                {/* Title & Tabs */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-ice-300">
                        База Знаний
                    </h2>
                    
                    {/* Main Tabs Switcher */}
                    <div className="flex p-1 bg-midnight-900 rounded-xl border border-white/5 w-fit">
                        <button 
                            onClick={() => { setActiveTab('Rules'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                activeTab === 'Rules' 
                                ? 'bg-ice-600 text-white shadow-lg shadow-ice-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <BookOpen size={16} /> Правила
                        </button>
                        <button 
                            onClick={() => { setActiveTab('Wheel'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                activeTab === 'Wheel' 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Dices size={16} /> Колесо Приколов
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group w-full md:w-80">
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

            {/* Sub-Tabs for Wheel (Only visible when Wheel is active) */}
            {activeTab === 'Wheel' && (
                <div className="max-w-6xl mx-auto w-full mt-6 pt-4 border-t border-white/5 flex gap-4 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'All', label: 'Все', icon: null },
                        { id: 'Items', label: 'Предметы', icon: Package },
                        { id: 'Events', label: 'События', icon: Zap },
                        { id: 'Traps', label: 'Ловушки', icon: Skull },
                    ].map((sub) => (
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-6xl mx-auto min-h-full">
                
                {/* VIEW 1: RULES (Document Style) */}
                {activeTab === 'Rules' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredEntries.map((rule, idx) => (
                            <div key={rule.id} className="relative pl-8 md:pl-0">
                                {/* Decor Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ice-500 to-transparent md:hidden"></div>
                                
                                <div className="bg-midnight-900/40 border border-white/5 rounded-2xl p-6 md:p-8 hover:bg-midnight-900/60 transition-colors">
                                    <h3 className="text-2xl font-bold text-ice-100 mb-4 flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ice-500/10 text-ice-400 text-sm font-mono border border-ice-500/20">
                                            {idx + 1}
                                        </span>
                                        {rule.title}
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-lg font-light">
                                        {rule.description}
                                    </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                        {filteredEntries.map(entry => (
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
                                    
                                    {/* Subcategory Indicator Overlay (Background Tint) */}
                                    <div className={`absolute inset-0 opacity-10 pointer-events-none ${
                                        entry.subcategory === 'Items' ? 'bg-amber-400' :
                                        entry.subcategory === 'Events' ? 'bg-ice-400' :
                                        'bg-rose-500'
                                    }`}></div>
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
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                            entry.subcategory === 'Items' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                            entry.subcategory === 'Events' ? 'text-ice-400 border-ice-500/20 bg-ice-500/10' :
                                            'text-rose-400 border-rose-500/20 bg-rose-500/10'
                                        }`}>
                                            {entry.subcategory === 'Items' ? 'Предмет' :
                                             entry.subcategory === 'Events' ? 'Событие' : 'Ловушка'}
                                        </span>
                                    </div>

                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        {entry.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {filteredEntries.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-500 italic border border-dashed border-white/5 rounded-3xl">
                                Элементы не найдены
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};