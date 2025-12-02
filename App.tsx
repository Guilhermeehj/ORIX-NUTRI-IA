import React, { useState, useRef, useEffect } from 'react';
import { RecipeBook } from './components/RecipeBook';
import { PaymentGateway } from './components/PaymentGateway'; // Import Payment Gateway
import { analyzeFoodImage } from './services/geminiService';
import { FoodAnalysis, DisplayMode } from './types';

// --- ICONS ---
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
    <path fillRule="evenodd" d="M9.344 3.071a4.993 4.993 0 015.312 0l.208.125a.75.75 0 01.378.647v2.657h2.008c.57 0 1.126.158 1.614.437l.453.259a.75.75 0 010 1.305l-.453.259a3.375 3.375 0 00-1.614.437v3.013c0 .57-.158 1.126-.437 1.614l-.259.453a.75.75 0 01-1.305 0l-.259-.453a3.375 3.375 0 00-1.614-.437h-3.013c-.57 0-1.126-.158-1.614-.437l-.453-.259a.75.75 0 010-1.305l.453-.259a3.375 3.375 0 001.614-.437V7.5H9.375a.75.75 0 01-.378-.647V4.196a4.993 4.993 0 01.347-1.125zM12 18a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
    <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const MuscleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ScaleIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A5.99 5.99 0 0121.75 12c0 2.261-.874 4.334-2.286 5.858M5.25 4.97A5.99 5.99 0 002.25 12c0 2.261.874 4.334 2.286 5.858" />
   </svg>
);

const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
    </svg>
);

// --- FUTURISTIC LOADER COMPONENT (Static Version) ---
const AnalysisLoader = () => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    
    const messages = [
        "ESCANEANDO GEOMETRIA MOLECULAR...",
        "EXTRAINDO PADRÕES VISUAIS...",
        "CALCULANDO DENSIDADE CALÓRICA...",
        "IDENTIFICANDO MACRONUTRIENTES...",
        "COMPILANDO PROTOCOLO ORIX..."
    ];

    useEffect(() => {
        // Progress bar animation
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 99) return 99;
                return prev + Math.floor(Math.random() * 3) + 1; 
            });
        }, 80);

        // Message cycler
        const msgInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 1200);

        return () => {
            clearInterval(interval);
            clearInterval(msgInterval);
        };
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[500px] flex flex-col items-center justify-center relative bg-orix-card/30 backdrop-blur-md rounded-[2rem] border border-orix-blue/20 shadow-neon-blue overflow-hidden">
            
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20" 
                style={{backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Central Spinner Core */}
                <div className="relative w-48 h-48 mb-10">
                    <div className="absolute inset-0 border-4 border-orix-blue/30 rounded-full"></div>
                    <div className="absolute inset-2 border-t-4 border-l-4 border-orix-cyan rounded-full animate-spin"></div>
                    <div className="absolute inset-8 bg-orix-blue/10 rounded-full border border-orix-blue/50"></div>
                    
                    {/* Logo/Icon in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-4xl">💠</span>
                    </div>
                </div>

                {/* Progress Text */}
                <h3 className="text-4xl font-mono font-bold text-white mb-2 tabular-nums">
                    {progress}%
                </h3>

                {/* Status Message */}
                <div className="h-8 flex items-center justify-center">
                    <p className="text-orix-cyan font-mono text-sm tracking-[0.2em] uppercase text-center">
                        {messages[messageIndex]}
                    </p>
                </div>

                {/* Progress Bar Visual */}
                <div className="w-64 h-1 bg-orix-dark mt-6 rounded-full overflow-hidden border border-orix-blue/30 relative">
                    <div 
                        className="h-full bg-gradient-to-r from-orix-blue to-orix-cyan shadow-[0_0_10px_#3b82f6]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [mode, setMode] = useState<DisplayMode>('payment');
  const [userGoal, setUserGoal] = useState<string>('');
  const [customGoal, setCustomGoal] = useState('');
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  
  // History State
  const [history, setHistory] = useState<FoodAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
        const hasPaid = localStorage.getItem('orix_paid') === 'true';
        const storedCredits = parseInt(localStorage.getItem('orix_credits') || '0', 10);
        
        let storedHistory: FoodAnalysis[] = [];
        try {
            storedHistory = JSON.parse(localStorage.getItem('orix_recipe_history') || '[]');
        } catch (e) {
            console.error("History corrupted, resetting", e);
            localStorage.removeItem('orix_recipe_history');
        }
        
        setIsPaid(hasPaid);
        setCredits(isNaN(storedCredits) ? 0 : storedCredits);
        setHistory(Array.isArray(storedHistory) ? storedHistory : []);

        if (hasPaid || storedCredits > 0) {
            setMode('onboarding');
        } else {
            setMode('payment');
        }
    } catch (error) {
        console.error("Initialization error", error);
        setMode('payment');
    }
  }, []);

  const saveToHistory = (newAnalysis: FoodAnalysis) => {
    const newHistory = [newAnalysis, ...history].slice(0, 5);
    setHistory(newHistory);
    try {
        localStorage.setItem('orix_recipe_history', JSON.stringify(newHistory));
    } catch (e) {
        console.warn("Quota exceeded, trying to save only the latest item");
        try {
             localStorage.setItem('orix_recipe_history', JSON.stringify([newAnalysis]));
        } catch (innerError) {
             console.error("Could not save history to localStorage", innerError);
        }
    }
  };

  const handlePaymentSuccess = (isTrial: boolean) => {
    if (isTrial) {
        localStorage.setItem('orix_credits', '2');
        localStorage.setItem('orix_trial_used', 'true');
        setCredits(2);
    } else {
        localStorage.setItem('orix_paid', 'true');
        setIsPaid(true);
    }
    setMode('onboarding');
  };

  const handleGoalSelect = (goal: string) => {
    setUserGoal(goal);
    setMode('welcome');
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(customGoal.trim()) {
      handleGoalSelect(customGoal);
    }
  };

  const consumeCredit = () => {
      if (isPaid) return true;
      if (credits > 0) {
          const newCredits = credits - 1;
          setCredits(newCredits);
          localStorage.setItem('orix_credits', newCredits.toString());
          return true;
      }
      return false;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPaid && credits <= 0) {
        alert("Seus créditos acabaram. Realize o pagamento para continuar.");
        setMode('payment');
        return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (!base64String || !base64String.includes(',')) {
            alert("Erro ao ler o arquivo de imagem.");
            return;
        }
        
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        setLoading(true);
        setMode('analysis');
        setAnalysis(null);
        setShowHistory(false);

        try {
            const result = await analyzeFoodImage(base64Data, mimeType, userGoal);
            consumeCredit();
            const fullAnalysis: FoodAnalysis = {
                imageUri: base64String, 
                timestamp: Date.now(),
                ...result
            };
            setAnalysis(fullAnalysis);
            saveToHistory(fullAnalysis);

        } catch (error) {
            console.error(error);
            alert("Não foi possível analisar a imagem. Tente novamente com uma foto mais clara.");
            setMode('welcome');
        } finally {
            setLoading(false);
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  
  const handleCorrection = async (correctionText: string) => {
    if (!analysis || !analysis.imageUri) return;
    
    const parts = analysis.imageUri.split(',');
    if (parts.length < 2) return;
    
    const base64Data = parts[1];
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    setLoading(true);
    
    try {
        const result = await analyzeFoodImage(base64Data, mimeType, userGoal, correctionText);
        const fullAnalysis: FoodAnalysis = {
            imageUri: analysis.imageUri,
            timestamp: Date.now(),
            ...result
        };
        setAnalysis(fullAnalysis);
    } catch (error) {
        console.error(error);
        alert("Falha ao reprocessar com a correção.");
    } finally {
        setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!isPaid) {
        alert("🔒 RECURSO PREMIUM BLOQUEADO\n\nPara transformar suas receitas em E-BOOK PDF, é necessário realizar o pagamento do plano vitalício.");
        setMode('payment');
        return;
    }
    window.print();
  };

  const loadHistoryItem = (item: FoodAnalysis) => {
      setAnalysis(item);
      setMode('analysis');
      setShowHistory(false);
  };

  const resetToHome = () => {
    if (!isPaid && credits <= 0) {
        setMode('payment');
        return;
    }
    setMode('welcome');
    setAnalysis(null);
    setShowHistory(false);
  };
  
  const resetToOnboarding = () => {
    if (!isPaid && credits <= 0) {
        setMode('payment');
        return;
    }
    setMode('onboarding');
    setUserGoal('');
    setAnalysis(null);
    setShowHistory(false);
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-orix-dark relative selection:bg-orix-blue selection:text-white text-gray-200 overflow-hidden">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      {/* Static Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 no-print">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orix-blue/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orix-cyan/5 rounded-full blur-[150px]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
         <div className="absolute inset-0 opacity-10" 
              style={{backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
         </div>
      </div>

      {mode !== 'payment' && (
        <nav className="w-full bg-orix-dark/80 backdrop-blur-md p-4 sticky top-0 z-40 border-b border-orix-blue/20 shadow-neon-blue no-print">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToOnboarding}>
                <div className="w-10 h-10 rounded-full bg-black border-2 border-orix-blue overflow-hidden shadow-neon-blue relative">
                    <div className="absolute inset-0 bg-orix-blue/20"></div>
                    <img src="https://ui-avatars.com/api/?name=Orix&background=020617&color=38bdf8&size=128&bold=true&length=1&rounded=true" alt="ORIX" className="w-full h-full object-cover relative z-10" />
                </div>
                <h1 className="text-2xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orix-blue to-white group-hover:text-orix-cyan transition-colors">ORIX</h1>
            </div>
            
            <div className="flex items-center gap-3">
                {!isPaid && (
                    <div className="px-3 py-1 bg-orix-blue/10 border border-orix-blue/30 rounded-full flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${credits > 0 ? 'bg-orix-cyan' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-mono tracking-wider ${credits > 0 ? 'text-orix-cyan' : 'text-red-400'}`}>
                            {credits} CRÉDITOS
                        </span>
                    </div>
                )}

                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-full transition-all ${showHistory ? 'bg-orix-blue text-white shadow-neon-blue' : 'hover:bg-white/10 text-orix-silver'}`}
                  title="Histórico de Receitas"
                >
                   <HistoryIcon />
                </button>

                {mode !== 'onboarding' && (
                    <button onClick={resetToHome} className="p-2 rounded-full hover:bg-white/10 text-orix-silver transition-colors">
                        <BackIcon />
                    </button>
                )}
            </div>
            </div>
        </nav>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
           <div className="w-full max-w-sm bg-orix-card border-l border-orix-blue/30 shadow-2xl p-6 relative overflow-y-auto">
              <h2 className="text-orix-cyan font-mono text-xl mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-orix-blue/20 pb-4">
                 <HistoryIcon /> Logs do Sistema
              </h2>
              
              {history.length === 0 ? (
                 <p className="text-orix-silver text-sm text-center italic mt-10">Nenhum registro encontrado.</p>
              ) : (
                 <div className="space-y-4">
                    {history.map((item, idx) => (
                       <div 
                         key={idx} 
                         onClick={() => loadHistoryItem(item)}
                         className="glass-panel p-3 rounded-xl border border-orix-blue/10 hover:border-orix-cyan/50 cursor-pointer transition-all hover:bg-orix-blue/10 flex gap-3 group"
                       >
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                             <img src={item.imageUri} alt="Food" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                          </div>
                          <div className="flex-grow min-w-0">
                             <div className="flex justify-between items-start">
                                <span className="text-orix-cyan text-[10px] font-mono tracking-wider">
                                   {new Date(item.timestamp || 0).toLocaleDateString()}
                                </span>
                                <span className="text-white text-[10px] font-bold bg-orix-blue/20 px-1 rounded">
                                   {item.nutritionalInfo.calories}
                                </span>
                             </div>
                             <p className="text-white text-xs font-bold truncate mt-1">
                                {item.suggestedRecipe?.title || "Análise Nutricional"}
                             </p>
                             <p className="text-orix-silver text-[10px] truncate mt-0.5">
                                {item.nutritionalInfo.protein} Prot • {item.nutritionalInfo.carbs} Carb
                             </p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full">
        
        {mode === 'payment' && (
            <PaymentGateway onPaymentSuccess={handlePaymentSuccess} />
        )}

        {mode === 'onboarding' && (
          <div className="w-full max-w-2xl">
             <div className="text-center mb-10">
                <h2 className="text-4xl font-mono font-bold text-white mb-2">OBJETIVO</h2>
                <p className="text-orix-silver text-sm tracking-widest uppercase">Selecione o protocolo desejado</p>
             </div>

             <div className="grid gap-4">
                <button 
                  onClick={() => handleGoalSelect('Emagrecer')}
                  className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-orix-blue/20 border border-orix-blue/30 transition-all hover:border-orix-cyan group text-left shadow-lg"
                >
                   <div className="w-12 h-12 bg-orix-dark rounded-full flex items-center justify-center border border-orix-cyan text-orix-cyan group-hover:text-white group-hover:bg-orix-cyan transition-colors">
                      <ScaleIcon />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">EMAGRECER</h3>
                      <p className="text-sm text-orix-silver">Queima de gordura e déficit calórico</p>
                   </div>
                </button>

                <button 
                  onClick={() => handleGoalSelect('Ganhar Massa')}
                  className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-orix-blue/20 border border-orix-blue/30 transition-all hover:border-orix-blue group text-left shadow-lg"
                >
                   <div className="w-12 h-12 bg-orix-dark rounded-full flex items-center justify-center border border-orix-blue text-orix-blue group-hover:text-white group-hover:bg-orix-blue transition-colors">
                      <MuscleIcon />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">GANHAR MASSA</h3>
                      <p className="text-sm text-orix-silver">Hipertrofia e superávit calórico</p>
                   </div>
                </button>

                <button 
                  onClick={() => handleGoalSelect('Definir')}
                  className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-orix-blue/20 border border-orix-blue/30 transition-all hover:border-orix-silver group text-left shadow-lg"
                >
                   <div className="w-12 h-12 bg-orix-dark rounded-full flex items-center justify-center border border-orix-silver text-orix-silver group-hover:text-white group-hover:bg-orix-silver transition-colors">
                      <TargetIcon />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">DEFINIÇÃO</h3>
                      <p className="text-sm text-orix-silver">Manutenção e qualidade muscular</p>
                   </div>
                </button>

                <form onSubmit={handleCustomGoalSubmit} className="mt-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Digitar outro objetivo..."
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      className="w-full bg-orix-dark/50 border border-orix-blue/30 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-orix-cyan focus:shadow-neon-blue transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={!customGoal.trim()}
                      className="absolute right-2 top-2 bottom-2 bg-orix-blue/20 text-orix-blue px-4 rounded-lg font-bold hover:bg-orix-blue hover:text-white transition-all disabled:opacity-0"
                    >
                      OK
                    </button>
                  </div>
                </form>
             </div>
          </div>
        )}

        {mode === 'welcome' && (
           <div className="flex flex-col items-center justify-center">
              
              <div className="mb-12 text-center">
                 <h2 className="text-4xl md:text-5xl font-mono font-bold text-white mb-2 tracking-wider drop-shadow-lg">SCANNER</h2>
                 <p className="text-orix-cyan font-light tracking-[0.3em] text-sm md:text-base uppercase">
                    MODO: <span className="font-bold text-white">{userGoal}</span>
                 </p>
              </div>

              <div className="relative group cursor-pointer" onClick={() => {
                  if(!isPaid && credits <= 0) {
                      setMode('payment');
                  } else {
                      fileInputRef.current?.click()
                  }
              }}>
                 
                 <div className="absolute -inset-8 rounded-full border border-orix-blue/30 border-t-transparent border-l-transparent"></div>
                 <div className="absolute -inset-12 rounded-full border border-orix-cyan/20 border-b-transparent border-r-transparent"></div>
                 
                 <div className="absolute inset-0 bg-orix-blue/30 rounded-full blur-2xl group-hover:bg-orix-cyan/40 transition-all duration-500"></div>

                 <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-orix-card border-4 border-orix-blue/50 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:border-orix-cyan transition-colors">
                    
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orix-dark to-black overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]"></div>
                        <div className="text-orix-cyan group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                            <CameraIcon />
                        </div>
                    </div>
                    
                 </div>
                 
                 <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-orix-silver text-xs font-mono uppercase tracking-[0.2em] group-hover:text-orix-cyan transition-colors">TIRE UMA FOTO DA SUA REFEIÇÃO</span>
                 </div>
              </div>
           </div>
        )}

        {(mode === 'analysis' || loading) && (
            <div className="w-full max-w-5xl">
                {loading ? (
                    <AnalysisLoader />
                ) : (
                    <>
                        <RecipeBook 
                            mode={mode} 
                            recipe={null} 
                            analysis={analysis} 
                            chat={null}
                            loading={loading}
                            onCorrection={handleCorrection}
                            onExportPDF={handleExportPDF}
                            isPaid={isPaid}
                        />
                        
                        <div className="flex justify-center mt-8 gap-4 no-print">
                            <button 
                                onClick={() => {
                                    if(!isPaid && credits <= 0) {
                                        setMode('payment');
                                    } else {
                                        fileInputRef.current?.click()
                                    }
                                }}
                                className="bg-orix-blue/10 border border-orix-blue text-orix-cyan px-8 py-3 rounded-full hover:bg-orix-blue hover:text-white transition-all shadow-neon-blue font-mono uppercase tracking-wider text-sm flex items-center gap-2"
                            >
                                <CameraIcon />
                                <span>Nova Análise</span>
                            </button>
                             <button 
                                onClick={resetToOnboarding}
                                className="bg-transparent border border-orix-silver/30 text-orix-silver px-6 py-3 rounded-full hover:bg-white/5 transition-all font-mono uppercase tracking-wider text-xs"
                            >
                                Alterar Objetivo
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}

      </main>
      
      <footer className="w-full p-4 text-center text-orix-silver/30 font-mono text-[10px] tracking-widest z-10 no-print">
         ORIX SYSTEMS • NEURAL SCANNER V2.0
      </footer>
    </div>
  );
}