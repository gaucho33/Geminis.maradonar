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

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [manualText, setManualText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [tokenResult, setTokenResult] = useState<MaradonTokenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validación de soberanía técnica (API KEY)
  useEffect(() => {
    const checkKey = async () => {
      // Prioridad 1: Variable de entorno de Vercel
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        setHasKey(true);
      } else {
        // Prioridad 2: Entorno de AI Studio (con comprobación segura)
        try {
          if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasKey(selected);
          } else {
            setHasKey(false);
          }
        } catch (e) {
          setHasKey(false);
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
      setError("No se detectó el entorno de AI Studio. Configura la VITE_GEMINI_API_KEY en Vercel.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file: File) => {
      try {
        if (file.name.toLowerCase().endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setLoadedFiles(prev => [...prev, { name: file.name, content: result.value }]);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            setLoadedFiles(prev => [...prev, { name: file.name, content }]);
          };
          reader.readAsText(file);
        }
      } catch (err) {
        setError(`No se pudo leer el archivo ${file.name}. ¿Está el formato en su base común?`);
      }
    });
  };

  const runAnalysis = async () => {
    const fullCorpus = [
      ...loadedFiles.map(f => f.content),
      manualText
    ].filter(t => t.trim().length > 0).join('\n\n--- NUEVO DOCUMENTO ---\n\n');

    if (!fullCorpus.trim()) {
      setError("Carga un archivo o escribe texto para iniciar la negación de centroides.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep(Step.ANALYZING);
    try {
      const result = await analyzeTextForMaradona(fullCorpus);
      setAnalysis(result);
      setStep(Step.RESULT_CENTROID);
    } catch (err: any) {
      console.error(err);
      setError("La interpelación ha fallado. Revisa tu conexión con la base de datos.");
      setStep(Step.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const runMaradonToken = async () => {
    if (!analysis) return;
    setLoading(true);
    setStep(Step.GENERATING_TOKEN);
    try {
      const fullCorpus = [...loadedFiles.map(f => f.content), manualText].join('\n\n');
      const result = await generateMaradonToken(fullCorpus, analysis);
      setTokenResult(result);
      setStep(Step.FINAL_REFORMULATION);
    } catch (err: any) {
      setError("Error al generar el Token Maradon.ar. El asombro se ha pausado.");
      setStep(Step.RESULT_CENTROID);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(Step.UPLOAD);
    setLoadedFiles([]);
    setManualText('');
    setAnalysis(null);
    setTokenResult(null);
    setError(null);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="text-6xl animate-bounce">🔑</div>
          <h2 className="text-2xl font-black text-slate-800">Conexión Maradon.ar</h2>
          <p className="text-slate-600 text-sm italic">
            "El asombro requiere una puerta abierta."
          </p>
          <p className="text-xs text-slate-400">Falta la API Key en Vercel.</p>
          <button onClick={handleOpenKeySelector} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">
            Configurar API Key
          </button>
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
          {step !== Step.UPLOAD && (
            <button onClick={reset} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-bold transition">
              Nuevo Inicio
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r shadow-sm">{error}</div>}

        {step === Step.UPLOAD && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card title="1. Cargar Corpus Heterogéneo">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center relative hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-4xl block mb-2">📂</span>
                <p className="font-bold text-slate-700">Arrastra o selecciona tus archivos</p>
                <p className="text-xs text-slate-400 mt-1">DOCX, TXT, Código y más</p>
              </div>
              {loadedFiles.length > 0 && (
                <div className="mt-4 space-y-1">
                  {loadedFiles.map((f, i) => (
                    <div key={i} className="text-xs flex justify-between bg-slate-100 p-2 rounded">
                      <span className="truncate">📄 {f.name}</span>
                      <button onClick={() => setLoadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 font-bold ml-2">×</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="2. Contexto de Asombro">
              <textarea 
                className="w-full h-32 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Añade aquí las reflexiones que guiarán la negación de centroides..." 
                value={manualText} 
                onChange={(e) => setManualText(e.target.value)} 
              />
              <button 
                disabled={loading || (loadedFiles.length === 0 && !manualText)} 
                onClick={runAnalysis} 
                className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
              >
                Iniciar Negación de Centroides
              </button>
            </Card>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 animate-pulse">
            <div className="animate-spin h-20 w-20 border-t-4 border-b-4 border-blue-600 rounded-full mx-auto"></div>
            <p className="mt-6 text-xl font-medium text-slate-700 italic">
              {step === Step.ANALYZING ? "Buscando la base común de las funciones..." : "Pulinedo la imagen del Token..."}
            </p>
          </div>
        )}

        {step === Step.RESULT_CENTROID && analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-500">
            <div className="md:col-span-2 space-y-6">
              <Card title="Mapa Conceptual No-Lineal">
                <div className="prose prose-slate text-slate-700 italic">
                  "{analysis.centroidExplanation}"
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Centroides" className="bg-blue-50 border-blue-100">
                <ul className="text-sm space-y-2">
                  {analysis.centroids.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
              <button onClick={runMaradonToken} className="w-full bg-slate-900 text-white p-6 rounded-xl font-bold shadow-2xl hover:bg-slate-800 transition transform hover:-translate-y-1">
                Generar Token Maradon.ar
              </button>
            </div>
          </div>
        )}

        {step === Step.FINAL_REFORMULATION && tokenResult && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-1000">
             <Card title="Token Maradon.ar Finalizado" className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200">
                <div className="text-lg leading-relaxed text-slate-800 font-medium">
                  {tokenResult.token}
                </div>
             </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
