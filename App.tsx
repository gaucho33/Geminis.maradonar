import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, MaradonTokenResult } from './types';
import { analyzeTextForMaradona, generateMaradonToken } from './services/gemini';
import mammoth from 'mammoth';

// Definición de tipos globales
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
    {children}
  </div>
);

interface LoadedFile {
  name: string;
  content: string;
}

/**
 * Visualización de Ratios: Cada relación es una entidad única.
 */
const RatioVisualizer: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  return (
    <Card title="Visualización de Ratios y Tensiones" className="overflow-hidden bg-slate-50">
      <div className="relative h-64 w-full bg-white rounded-xl border border-blue-100 flex items-center justify-center overflow-hidden">
        {/* La Base Común (Fondo) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="flex flex-wrap justify-center gap-4 p-4 relative z-10">
          {analysis.concepts.map((concept, i) => {
            const ratioSize = Math.max(80, Math.min(150, 100 + (concept.qualities.length * 10)));
            return (
              <div 
                key={i}
                style={{ width: `${ratioSize}px`, height: `${ratioSize}px` }}
                className="rounded-full bg-blue-500/10 border-2 border-blue-400 flex flex-col items-center justify-center p-2 text-center animate-pulse shadow-inner hover:scale-110 transition-transform cursor-help"
                title={concept.qualities.join(', ')}
              >
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-tighter">
                  {concept.token}
                </span>
                <span className="text-[18px] font-serif italic text-blue-900">
                  {concept.qualities.length}:1
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 italic text-center">
        *Ratios no-lineales calculados sobre la base común del corpus.
      </p>
    </Card>
  );
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [manualText, setManualText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [tokenResult, setTokenResult] = useState<MaradonTokenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        setHasKey(true);
      } else {
        try {
          if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasKey(selected);
          } else { setHasKey(false); }
        } catch (e) { setHasKey(false); }
      }
    };
    checkKey();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      try {
        if (file.name.toLowerCase().endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setLoadedFiles(prev => [...prev, { name: file.name, content: result.value }]);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => setLoadedFiles(prev => [...prev, { name: file.name, content: event.target?.result as string }]);
          reader.readAsText(file);
        }
      } catch (err) { setError(`Error en ${file.name}`); }
    });
  };

  const runAnalysis = async () => {
    const fullCorpus = [...loadedFiles.map(f => f.content), manualText].filter(t => t.trim()).join('\n\n--- NUEVO ---\n\n');
    setLoading(true); setStep(Step.ANALYZING);
    try {
      const result = await analyzeTextForMaradona(fullCorpus);
      setAnalysis(result); setStep(Step.RESULT_CENTROID);
    } catch (err) { setError("Fallo en la interpelación."); setStep(Step.UPLOAD); }
    finally { setLoading(false); }
  };

  const runMaradonToken = async () => {
    if (!analysis) return;
    setLoading(true); setStep(Step.GENERATING_TOKEN);
    try {
      const fullCorpus = [...loadedFiles.map(f => f.content), manualText].join('\n\n');
      const result = await generateMaradonToken(fullCorpus, analysis);
      setTokenResult(result); setStep(Step.FINAL_REFORMULATION);
    } catch (err) { setError("Error en el Token."); setStep(Step.RESULT_CENTROID); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep(Step.UPLOAD); setLoadedFiles([]); setManualText(''); setAnalysis(null); setTokenResult(null); setError(null);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4">
          <div className="text-6xl animate-bounce">🔑</div>
          <h2 className="text-2xl font-black">Conexión Maradon.ar</h2>
          <button onClick={() => window.aistudio?.openSelectKey()} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700">Configurar API Key</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-sky-500 text-white py-6 px-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gemini Maradon.ar</h1>
            <p className="text-blue-100 text-sm italic">Tutor de Análisis No-Lineal</p>
          </div>
          {step !== Step.UPLOAD && <button onClick={reset} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-bold">Nuevo Inicio</button>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">{error}</div>}

        {step === Step.UPLOAD && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card title="1. Cargar Corpus Heterogéneo">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center relative hover:border-blue-400 cursor-pointer">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-4xl block">📂</span>
                <p className="font-bold">Arrastra tus archivos</p>
              </div>
              <div className="mt-4 space-y-1">
                {loadedFiles.map((f, i) => <div key={i} className="text-xs bg-slate-100 p-2 rounded flex justify-between"><span>📄 {f.name}</span></div>)}
              </div>
            </Card>
            <Card title="2. Contexto de Asombro">
              <textarea className="w-full h-32 p-3 border rounded-lg text-sm" placeholder="Reflexiones..." value={manualText} onChange={(e) => setManualText(e.target.value)} />
              <button disabled={loading || (loadedFiles.length === 0 && !manualText)} onClick={runAnalysis} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">Iniciar Negación de Centroides</button>
            </Card>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin h-16 w-16 border-t-4 border-blue-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600 italic">Negando centroides...</p>
          </div>
        )}

        {step === Step.RESULT_CENTROID && analysis && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card title="Mapa Conceptual No-Lineal">
                  <div className="italic text-slate-700">"{analysis.centroidExplanation}"</div>
                </Card>
              </div>
              <Card title="Centroides" className="bg-blue-50">
                <ul className="text-sm space-y-2">
                  {analysis.centroids.map((c, i) => <li key={i} className="flex items-center gap-2"><span className="h-2 w-2 bg-blue-500 rounded-full animate-ping"></span>{c}</li>)}
                </ul>
              </Card>
            </div>
            <RatioVisualizer analysis={analysis} />
            <div className="flex justify-center"><button onClick={runMaradonToken} className="bg-slate-900 text-white px-12 py-6 rounded-2xl font-bold hover:bg-blue-700 transition-all">Consolidar en Token Maradon.ar →</button></div>
          </div>
        )}

        {step === Step.FINAL_REFORMULATION && tokenResult && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-top-4">
             <Card title="Token Maradon.ar" className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 text-lg italic text-center">
                {tokenResult.token}
             </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
