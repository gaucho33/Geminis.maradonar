import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, MaradonTokenResult } from './types';
import { analyzeTextForMaradona, generateMaradonToken } from './services/gemini';
import mammoth from 'mammoth';

// Definición de tipos globales para compatibilidad
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

  // EFECTO MODIFICADO: Prioriza la variable de Vercel para el "asombro" inmediato
  useEffect(() => {
    const checkKey = async () => {
      // 1. Intentar leer la llave de Maradon.ar desde Vercel
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (envKey) {
        setHasKey(true);
      } else {
        // 2. Fallback por si se ejecuta dentro de AI Studio
        try {
          if (window.aistudio) {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasKey(selected);
          } else {
            setHasKey(false);
          }
        } catch {
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
    if (files) {
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
          setError(`No se pudo leer el archivo ${file.name}`);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
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
      setError("Error en la interpelación: Revisa la API Key.");
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
      setError("Error al generar el Token Maradon.ar");
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

  // UI de Bloqueo: Solo aparece si realmente no hay API Key configurada
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="text-6xl">🔑</div>
          <h2 className="text-2xl font-black text-slate-800">Conexión Maradon.ar</h2>
          <p className="text-slate-600 text-sm">
            Falta la API Key `maradonargeminis` en las variables de entorno de Vercel.
          </p>
          <button onClick={handleOpenKeySelector} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">
            Configurar Localmente
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
          {step !== Step.UPLOAD && <button onClick={reset} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm">Nuevo Inicio</button>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {error && <div className="bg-red-100 border-l-4 border-red-500 p-4 text-red-700">{error}</div>}

        {step === Step.UPLOAD && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="1. Cargar Corpus Heterogéneo">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center relative hover:bg-slate-50">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-4xl">📂</span>
                <p className="font-bold">Subir archivos para análisis</p>
              </div>
              {loadedFiles.map((f, i) => <div key={i} className="text-xs mt-2 bg-slate-100 p-1">📄 {f.name}</div>)}
            </Card>

            <Card title="2. Contexto de Asombro">
              <textarea className="w-full h-32 p-3 border rounded-lg text-sm" placeholder="Escribe reflexiones adicionales..." value={manualText} onChange={(e) => setManualText(e.target.value)} />
              <button disabled={loading || (loadedFiles.length === 0 && !manualText)} onClick={runAnalysis} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold">
                Iniciar Negación de Centroides
              </button>
            </Card>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin h-16 w-16 border-t-4 border-blue-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600">Buscando la base común de las funciones...</p>
          </div>
        )}

        {/* Visualización de resultados del Centroide */}
        {step === Step.RESULT_CENTROID && analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="md:col-span-2"><Card title="Mapa Conceptual">{analysis.centroidExplanation}</Card></div>
            <div><button onClick={runMaradonToken} className="w-full bg-slate-900 text-white p-6 rounded-xl font-bold">Generar Token Final</button></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
