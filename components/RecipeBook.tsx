
import React, { useState } from 'react';
import { Recipe, FoodAnalysis, ChatMessage, DisplayMode } from '../types';

interface RecipeBookProps {
  mode: DisplayMode;
  recipe: Recipe | null;
  analysis: FoodAnalysis | null;
  chat: ChatMessage | null;
  loading: boolean;
  onCorrection?: (text: string) => void;
  onExportPDF?: () => void;
  isPaid?: boolean;
}

// Logo URL placeholder - user can replace this with their ORIX logo URL
const ORIX_LOGO_URL = "https://ui-avatars.com/api/?name=Orix&background=020617&color=38bdf8&size=128&bold=true&length=1&rounded=true"; 

// Helper to parse strings like "450 kcal" or "30g" into numbers
const parseValue = (str: string): number => {
  if (!str) return 0;
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

// Internal Component: Tech Donut Chart
const MacroChart = ({ analysis }: { analysis: FoodAnalysis }) => {
  const calories = parseValue(analysis.nutritionalInfo.calories);
  const protein = parseValue(analysis.nutritionalInfo.protein);
  const carbs = parseValue(analysis.nutritionalInfo.carbs);
  const fat = parseValue(analysis.nutritionalInfo.fat);

  const totalMacros = protein + carbs + fat;
  // Avoid division by zero
  const safeTotal = totalMacros === 0 ? 1 : totalMacros;

  // Calculate percentages for the chart stroke
  // We will use a standard circle circumference. Radius = 40, Circumference ~ 251.2
  const R = 40;
  const C = 2 * Math.PI * R;
  
  const pctProtein = protein / safeTotal;
  const pctCarbs = carbs / safeTotal;
  const pctFat = fat / safeTotal;

  // Offsets for the segments
  const offProtein = C * (1 - pctProtein);
  const offCarbs = C * (1 - pctCarbs);
  const offFat = C * (1 - pctFat);

  // Rotations to stack them (approximate visual stacking)
  const dashProtein = `${pctProtein * C} ${C}`;
  const dashCarbs = `${pctCarbs * C} ${C}`;
  const dashFat = `${pctFat * C} ${C}`;
  
  const rotCarbs = -90 + (pctProtein * 360);
  const rotFat = rotCarbs + (pctCarbs * 360);

  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-orix-blue/10 rounded-full blur-xl animate-pulse"></div>
        
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Background Track */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />

          {/* Protein Segment (Cyan) */}
          <circle 
            cx="50" cy="50" r={R} 
            fill="none" 
            stroke="#06b6d4" 
            strokeWidth="8" 
            strokeDasharray={dashProtein}
            strokeDashoffset="0"
            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-1000 ease-out"
          />

          {/* Carbs Segment (Blue) */}
        </svg>
        
        <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0" style={{ transform: `rotate(${rotCarbs}deg)` }}>
           <circle 
            cx="50" cy="50" r={R} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="8" 
            strokeDasharray={dashCarbs}
            strokeDashoffset="0"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-1000 ease-out"
          />
        </svg>

        <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0" style={{ transform: `rotate(${rotFat}deg)` }}>
           <circle 
            cx="50" cy="50" r={R} 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="8" 
            strokeDasharray={dashFat}
            strokeDashoffset="0"
            className="drop-shadow-[0_0_8px_rgba(148,163,184,0.8)] transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text (Calories) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-3xl md:text-4xl font-mono font-bold text-white drop-shadow-md">{calories}</span>
          <span className="text-[10px] text-orix-cyan font-bold uppercase tracking-widest">Kcal</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 w-full justify-center">
        <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-orix-cyan rounded-full mb-1 shadow-[0_0_5px_#06b6d4]"></div>
            <span className="text-xs text-orix-silver font-mono">Prot</span>
            <span className="text-sm font-bold text-white">{Math.round(pctProtein * 100)}%</span>
        </div>
        <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-orix-blue rounded-full mb-1 shadow-[0_0_5px_#3b82f6]"></div>
            <span className="text-xs text-orix-silver font-mono">Carb</span>
            <span className="text-sm font-bold text-white">{Math.round(pctCarbs * 100)}%</span>
        </div>
        <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-orix-silver rounded-full mb-1 shadow-[0_0_5px_#94a3b8]"></div>
            <span className="text-xs text-orix-silver font-mono">Gord</span>
            <span className="text-sm font-bold text-white">{Math.round(pctFat * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export const RecipeBook: React.FC<RecipeBookProps> = ({ mode, recipe, analysis, chat, loading, onCorrection, onExportPDF, isPaid }) => {
  const [correctionText, setCorrectionText] = useState("");
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (correctionText.trim() && onCorrection) {
      onCorrection(correctionText);
      setCorrectionText("");
    }
  };

  const handleGenerateImage = () => {
    if (!analysis?.suggestedRecipe) return;

    setIsGeneratingImg(true);
    
    // Construct Prompt
    const keywords = analysis.suggestedRecipe.imageKeywords?.join(', ') || 'gourmet food';
    const title = analysis.suggestedRecipe.title;
    const prompt = encodeURIComponent(`Professional food photography of ${title}, ${keywords}, cinematic lighting, 8k resolution, appetizing, highly detailed, photorealistic`);
    
    // Using Pollinations AI (No API Key needed for frontend demo)
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
    
    // Simulate slight loading feel and set URL
    setTimeout(() => {
        setGeneratedImgUrl(url);
        setIsGeneratingImg(false);
    }, 1500);
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[400px] glass-panel rounded-3xl p-8 flex flex-col items-center justify-center border border-orix-blue/30 shadow-neon-blue">
        <div className="relative">
           <div className="absolute inset-0 bg-orix-blue/20 rounded-full animate-ping"></div>
           <div className="w-24 h-24 bg-gradient-to-tr from-orix-blue to-orix-cyan rounded-full flex items-center justify-center text-white relative z-10 shadow-neon-blue border-2 border-white/20">
             <div className="w-20 h-20 rounded-full bg-orix-dark flex items-center justify-center">
                <svg className="w-10 h-10 text-orix-cyan animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
           </div>
        </div>
        <p className="mt-8 text-orix-cyan font-mono uppercase tracking-widest text-sm animate-pulse">Processando dados ORIX AI...</p>
      </div>
    );
  }

  // --- WELCOME STATE ---
  if (mode === 'welcome') {
    return (
      <div className="w-full max-w-4xl mx-auto text-center mt-8">
        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-orix-blue to-orix-silver shadow-neon-blue mb-8">
            <div className="bg-orix-dark rounded-full p-6">
                <span className="text-6xl animate-pulse block grayscale-0">💠</span>
            </div>
        </div>
        <h2 className="text-5xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-orix-silver to-white mb-6 tracking-wide drop-shadow-lg">
          SISTEMA ORIX ATIVO
        </h2>
        <p className="text-orix-silver max-w-lg mx-auto mb-12 text-lg font-light tracking-wide leading-relaxed">
          Inteligência Artificial de Alta Performance para Nutrição e Evolução Física.
        </p>
      </div>
    );
  }

  // --- ANALYSIS / RECIPE STATE ---
  if (analysis) {
    return (
      <div id="printable-book" className="w-full max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* --- 1. ANALYSIS DASHBOARD --- */}
        <div className="glass-panel rounded-[2rem] overflow-hidden border border-orix-blue/20 shadow-neon-blue relative">
             {/* Header */}
             <div className="bg-orix-dark/50 p-4 border-b border-orix-blue/10 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-orix-cyan animate-pulse"></span>
                     <span className="text-orix-cyan font-mono text-xs tracking-widest uppercase">Análise em Tempo Real</span>
                 </div>
                 <span className="text-orix-silver font-mono text-xs">{new Date().toLocaleTimeString()}</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                 {/* Left: Image & Description */}
                 <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-orix-blue/10">
                     <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-orix-blue/30 shadow-lg mb-6 group">
                         <img src={analysis.imageUri} alt="Food Analysis" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-orix-dark via-transparent to-transparent opacity-60"></div>
                         <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg border border-orix-cyan/30">
                             <span className="text-orix-cyan text-xs font-mono font-bold uppercase">Input Visual</span>
                         </div>
                     </div>
                     
                     <div className="space-y-4">
                         <h3 className="text-xl text-white font-bold font-mono border-l-4 border-orix-blue pl-3">
                             DIAGNÓSTICO
                         </h3>
                         <p className="text-orix-silver text-sm leading-relaxed text-justify">
                             {analysis.description}
                         </p>
                     </div>
                 </div>

                 {/* Right: Data Visualization */}
                 <div className="p-6 md:p-8 bg-orix-dark/30">
                     <h3 className="text-center text-orix-white font-mono text-sm tracking-widest mb-4 uppercase">Composição Nutricional</h3>
                     
                     <MacroChart analysis={analysis} />

                     <div className="grid grid-cols-4 gap-2 mt-6">
                        <div className="bg-orix-dark p-2 rounded-lg border border-orix-blue/20 text-center">
                            <span className="block text-xs text-orix-silver font-mono uppercase">Peso</span>
                            <span className="block text-lg font-bold text-white">{analysis.nutritionalInfo.weight || "--"}</span>
                        </div>
                        <div className="bg-orix-dark p-2 rounded-lg border border-orix-blue/20 text-center">
                            <span className="block text-xs text-orix-silver font-mono uppercase">Prot</span>
                            <span className="block text-lg font-bold text-orix-cyan">{analysis.nutritionalInfo.protein}</span>
                        </div>
                        <div className="bg-orix-dark p-2 rounded-lg border border-orix-blue/20 text-center">
                            <span className="block text-xs text-orix-silver font-mono uppercase">Carb</span>
                            <span className="block text-lg font-bold text-orix-blue">{analysis.nutritionalInfo.carbs}</span>
                        </div>
                        <div className="bg-orix-dark p-2 rounded-lg border border-orix-blue/20 text-center">
                            <span className="block text-xs text-orix-silver font-mono uppercase">Gord</span>
                            <span className="block text-lg font-bold text-orix-silver">{analysis.nutritionalInfo.fat}</span>
                        </div>
                     </div>

                     {/* MICRONUTRIENTS SECTION */}
                     {((analysis.nutritionalInfo.vitamins && analysis.nutritionalInfo.vitamins.length > 0) || (analysis.nutritionalInfo.minerals && analysis.nutritionalInfo.minerals.length > 0)) && (
                         <div className="mt-6 pt-6 border-t border-orix-blue/10">
                            <h3 className="text-center text-orix-white font-mono text-sm tracking-widest mb-4 uppercase">Micronutrientes</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {analysis.nutritionalInfo.vitamins?.map((vit, i) => (
                                    <span key={`v-${i}`} className="px-2 py-1 bg-orix-cyan/10 border border-orix-cyan/30 text-orix-cyan text-[10px] rounded font-mono uppercase tracking-wide hover:bg-orix-cyan/20 transition-colors cursor-default">
                                        {vit}
                                    </span>
                                ))}
                                {analysis.nutritionalInfo.minerals?.map((min, i) => (
                                    <span key={`m-${i}`} className="px-2 py-1 bg-orix-blue/10 border border-orix-blue/30 text-orix-blue text-[10px] rounded font-mono uppercase tracking-wide hover:bg-orix-blue/20 transition-colors cursor-default">
                                        {min}
                                    </span>
                                ))}
                            </div>
                         </div>
                     )}
                 </div>
             </div>

             {/* Correction Footer */}
             <div className="p-4 bg-orix-dark/80 border-t border-orix-blue/10 no-print">
                 <form onSubmit={handleCorrectionSubmit} className="flex gap-2 max-w-lg mx-auto">
                     <div className="relative flex-grow">
                        <input 
                            type="text" 
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            placeholder="IA errou? Digite o nome correto aqui..." 
                            className="w-full bg-orix-card/50 border border-orix-silver/20 rounded-lg px-4 py-2 text-sm text-white placeholder-orix-silver/40 focus:border-orix-cyan focus:ring-1 focus:ring-orix-cyan outline-none transition-all"
                        />
                     </div>
                     <button type="submit" className="bg-orix-silver/10 hover:bg-orix-blue text-orix-silver hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors border border-orix-silver/20">
                         Corrigir
                     </button>
                 </form>
             </div>
        </div>

        {/* --- 2. SUGGESTED RECIPE CARD --- */}
        {analysis.suggestedRecipe && (
            <div className="glass-panel rounded-[2rem] p-8 border border-orix-blue/20 shadow-neon-blue relative overflow-hidden">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orix-cyan/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">🍽️</span>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-orix-cyan">
                                {analysis.suggestedRecipe.title}
                            </h2>
                            <p className="text-orix-silver text-xs font-mono uppercase tracking-widest mt-1">
                                SUGESTÃO DO SISTEMA ORIX
                            </p>
                        </div>
                    </div>

                    {/* AI IMAGE GENERATION SECTION */}
                    <div className="mb-8 no-print">
                        {!generatedImgUrl ? (
                             <button 
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImg}
                                className="w-full py-4 border border-orix-blue/50 border-dashed rounded-xl flex items-center justify-center gap-3 text-orix-cyan hover:bg-orix-blue/10 hover:border-orix-blue transition-all group"
                             >
                                {isGeneratingImg ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-orix-cyan border-t-transparent rounded-full animate-spin"></div>
                                        <span className="font-mono text-sm uppercase tracking-wider">Gerando Imagem com IA...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                        </svg>
                                        <span className="font-mono text-sm uppercase tracking-wider font-bold">Gerar Imagem Ilustrativa</span>
                                    </>
                                )}
                             </button>
                        ) : (
                            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-orix-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95 duration-700 group">
                                <img src={generatedImgUrl} alt="Generated Dish" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <span className="text-orix-cyan text-xs font-mono uppercase tracking-widest border border-orix-cyan/30 px-2 py-1 rounded bg-black/40 backdrop-blur">
                                        Imagem Gerada por IA
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Only show generated image in print if it exists */}
                    {generatedImgUrl && (
                        <div className="hidden print:block mb-6 border border-black">
                            <img src={generatedImgUrl} alt="Prato" className="w-full h-64 object-cover" />
                            <p className="text-xs italic text-center mt-1">Imagem ilustrativa gerada por ORIX AI</p>
                        </div>
                    )}


                    <div className="mb-8 p-4 bg-orix-blue/5 border-l-2 border-orix-blue rounded-r-lg">
                        <p className="text-orix-silver italic">"{analysis.suggestedRecipe.description}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-orix-cyan font-mono uppercase tracking-widest mb-4 border-b border-orix-silver/10 pb-2">Ingredientes</h3>
                            <ul className="space-y-3">
                                {analysis.suggestedRecipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <span className="text-orix-blue mt-1">▪</span>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-orix-cyan font-mono uppercase tracking-widest mb-4 border-b border-orix-silver/10 pb-2">Modo de Preparo</h3>
                             <ol className="space-y-4">
                                {analysis.suggestedRecipe.instructions.map((inst, i) => (
                                    <li key={i} className="flex gap-4 text-sm text-gray-300">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orix-dark border border-orix-blue/30 flex items-center justify-center text-xs font-mono text-orix-blue">{i + 1}</span>
                                        <span className="mt-0.5">{inst}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    {/* DICAS ÚTEIS SECTION */}
                    {analysis.suggestedRecipe.tips && analysis.suggestedRecipe.tips.length > 0 && (
                        <div className="mt-8 bg-orix-cyan/5 border border-orix-cyan/20 rounded-xl p-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.45l.34-.099a12.01 12.01 0 014.755-1.48l1.05-.15c.382-.055.766-.055 1.148 0l1.05.15a12.01 12.01 0 014.755 1.48l.34.098c.195.056.368.163.513.298l.32.285c.145.13.254.303.321.49l.08.217c.077.206.077.432 0 .638l-.08.217a.998.998 0 01-.321.49l-.32.285a.999.999 0 01-.513.298l-.34.098a12.01 12.01 0 01-4.755 1.48l-1.05.15a8.04 8.04 0 01-1.148 0l-1.05-.15a12.01 12.01 0 01-4.755-1.48l-.34-.099a.999.999 0 01-.513-.298l-.32-.285a.998.998 0 01-.321-.49l-.08-.217a.998.998 0 000-.638l.08-.217a.998.998 0 01.321-.49l.32-.285a.999.999 0 01.513-.298L12 12.75zM12 12.75V3m0 9.75V18" />
                                </svg>
                             </div>
                             
                             <h3 className="text-orix-cyan font-mono font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                                Dicas do Especialista
                             </h3>
                             <ul className="space-y-3 relative z-10">
                                {analysis.suggestedRecipe.tips.map((tip, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex gap-3">
                                        <span className="text-orix-cyan font-bold">✓</span>
                                        {tip}
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}

                </div>
            </div>
        )}
        
        {/* Actions Footer */}
        <div className="flex justify-center mt-8 pb-10 no-print">
            <button 
                onClick={onExportPDF}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold font-mono uppercase tracking-wider transition-all shadow-lg ${isPaid ? 'bg-gradient-to-r from-orix-blue to-orix-cyan text-white hover:scale-105 shadow-neon-blue' : 'bg-orix-dark border border-orix-silver/30 text-orix-silver cursor-not-allowed opacity-70'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {isPaid ? "BAIXAR E-BOOK PDF" : "PDF (PREMIUM)"}
            </button>
        </div>

      </div>
    );
  }

  return null;
};