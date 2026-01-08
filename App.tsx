
import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, MaradonTokenResult } from './types';
import { analyzeTextForMaradona, generateMaradonToken } from './services/gemini';
import mammoth from 'mammoth';

// Extend window for aistudio types
// Fixed: Defined AIStudio interface separately and used it in Window declaration to avoid type mismatch and modifier errors.
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

  useEffect(() => {
    const checkKey = async () => {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true); // Se asume éxito según directrices
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
          console.error("Error al procesar archivo:", file.name, err);
          setError(`No se pudo leer el archivo ${file.name}`);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleError = (err: any) => {
    if (err.message?.includes("Requested entity was not found")) {
      setError("Error de autenticación. Por favor, vuelve a seleccionar tu API Key de un proyecto con facturación activa.");
      setHasKey(false);
    } else {
      setError("Ocurrió un error inesperado al procesar la solicitud.");
    }
  };

  const runAnalysis = async () => {
    const fullCorpus = [
      ...loadedFiles.map(f => f.content),
      manualText
    ].filter(t => t.trim().length > 0).join('\n\n--- NUEVO DOCUMENTO ---\n\n');

    if (!fullCorpus.trim()) {
      setError("Por favor, carga al menos un archivo o escribe texto para analizar.");
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
      handleError(err);
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
      const fullCorpus = [
        ...loadedFiles.map(f => f.content),
        manualText
      ].join('\n\n');
      const result = await generateMaradonToken(fullCorpus, analysis);
      setTokenResult(result);
      setStep(Step.FINAL_REFORMULATION);
    } catch (err: any) {
      handleError(err);
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

  // Pantalla de configuración de Key
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="text-6xl">🔑</div>
          <h2 className="text-2xl font-black text-slate-800">Conexión Requerida</h2>
          <p className="text-slate-600 text-sm">
            Para utilizar los modelos avanzados de <strong>Gemini Maradon.ar</strong>, debes seleccionar una API Key de un proyecto con facturación habilitada.
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full maradona-gradient text-white py-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 hover:scale-[1.02] transition transform"
          >
            Configurar API Key
          </button>
          <div className="pt-4 border-t">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="text-xs text-blue-500 hover:underline"
            >
              Documentación sobre facturación y cuotas
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="maradona-gradient text-white py-6 px-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gemini Maradon.ar</h1>
            <p className="text-blue-100 text-sm italic">Tutor Académico de Análisis No-Lineal</p>
          </div>
          {step !== Step.UPLOAD && (
            <button onClick={reset} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition text-sm font-semibold">
              Nuevo Análisis
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 animate-bounce">
            {error}
          </div>
        )}

        {step === Step.UPLOAD && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="1. Cargar Documentos y Código">
                <p className="text-slate-600 mb-4 text-sm">Sube múltiples archivos para tu corpus. Soportamos Word, textos, código y datos.</p>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer relative">
                  <input type="file" multiple accept=".txt,.md,.tex,.rtf,.csv,.json,.xml,.html,.js,.ts,.py,.c,.cpp,.java,.r,.m,.yaml,.yml,.log,.docx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="space-y-2">
                    <span className="text-4xl">📂</span>
                    <p className="font-bold text-slate-700">Arrastra o haz clic aquí</p>
                    <p className="text-xs text-slate-400">DOCX, TXT, MD, TEX, JSON, PY, etc.</p>
                  </div>
                </div>
                {loadedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Archivos en el corpus ({loadedFiles.length}):</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {loadedFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                          <span className="truncate flex-1 mr-2 text-slate-700">📄 {file.name}</span>
                          <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card title="2. Contexto Manual">
                <p className="text-slate-600 mb-4 text-sm">Añade reflexiones adicionales o instrucciones específicas para el tutor.</p>
                <textarea className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder="Escribe aquí tus observaciones adicionales..." value={manualText} onChange={(e) => setManualText(e.target.value)} />
                <button disabled={loading || (loadedFiles.length === 0 && !manualText.trim())} onClick={runAnalysis} className="w-full mt-4 maradona-gradient text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 hover:scale-[1.02] transition transform">
                  Iniciar Análisis Maradon.ar
                </button>
              </Card>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600">AI</div>
            </div>
            <p className="mt-6 text-xl font-medium text-slate-700">{step === Step.ANALYZING ? "Procesando Corpus Heterogéneo..." : "Negando Centroides..."}</p>
          </div>
        )}

        {step === Step.RESULT_CENTROID && analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="md:col-span-2 space-y-6">
              <Card title="Mapa de Conceptos y Cualidades">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.concepts.map((c, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-700 block mb-1">Concepto: {c.token}</span>
                      <div className="flex flex-wrap gap-1">
                        {c.qualities.map((q, qidx) => (
                          <span key={qidx} className="text-xs bg-white border px-2 py-0.5 rounded-full text-slate-600">{q}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Explicación desde el Centroide">
                <p className="text-slate-700 leading-relaxed italic">"{analysis.centroidExplanation}"</p>
              </Card>
            </div>
            <div className="space-y-6">
              <Card title="Centroides del Corpus" className="bg-blue-50">
                <ul className="space-y-2">
                  {analysis.centroids.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">●</span>
                      <span className="font-medium text-slate-800">{c}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="sticky top-24">
                <button onClick={runMaradonToken} className="w-full bg-slate-900 text-white p-6 rounded-xl shadow-2xl hover:bg-slate-800 transition transform hover:-translate-y-1 group">
                  <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Próximo Paso</span>
                  <span className="text-xl font-black">Generar Token Maradon.ar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === Step.FINAL_REFORMULATION && tokenResult && (
          <div className="max-w-4xl mx-auto space-y-8 animate-