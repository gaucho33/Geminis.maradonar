import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, MaradonTokenResult } from './types';
import { analyzeTextForMaradona, generateMaradonToken, generateQuickSummary } from './services/gemini';
import mammoth from 'mammoth';

// --- Componentes de Soporte ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
      {title}
    </h3>
    {children}
  </div>
);

/**
 * Gráfica de Constelación de Tokens (Asombro Visual)
 */
const TokenPositionGraph: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  return (
    <div className="relative h-80 w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-blue-500/30">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {analysis.concepts.map((concept, i) => {
          // Si la IA no envía coordenadas, las generamos pseudo-aleatorias basadas en el nombre
          const x = concept.position?.x !== undefined ? (concept.position.x + 10) * 5 : (i * 25) % 90 + 5;
          const y = concept.position?.y !== undefined ? (concept.position.y + 10) * 5 : (i * 35) % 90 + 5;
          const size = concept.tensionValue ? 2 + (concept.tensionValue * 0.5) : 4;
          
          return (
            <g key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
              <circle cx={x} cy={y} r={size} fill="#3b82f6" fillOpacity="0.4" stroke="#60a5fa" strokeWidth="0.5" />
              <text x={x} y={y - size - 1} textAnchor="middle" fontSize="3" fill="#93c5fd" fontWeight="bold" className="pointer-events-none">
                {concept.token}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-2 right-3 text-[9px] text-blue-400 font-mono">MAPA_NO_LINEAL_V2.0</div>
    </div>
  );
};

// --- App Principal ---

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadedFiles, setLoadedFiles] = useState<{name: string, content: string}[]>([]);
  const [preSummary, setPreSummary] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [tokenResult, setTokenResult] = useState<MaradonTokenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificación de API Key
  useEffect(() => {
    const checkKey = async () => {
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        setHasKey(true);
      } else {
        try {
          if (window.aistudio) {
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
        let text = "";
        if (file.name.toLowerCase().endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else {
          text = await file.text();
        }
        
        const newFiles = [...loadedFiles, { name: file.name, content: text }];
        setLoadedFiles(newFiles);
        
        // Generación automática del Prensayo (Resumen)
        setIsSummarizing(true);
        const summary = await generateQuickSummary(newFiles.map(f => f.content).join("\n"));
        setPreSummary(summary);
        setIsSummarizing(false);
      } catch (err) { setError(`Error cargando ${file.name}`); }
    });
  };

  const removeFile = (index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
    if (loadedFiles.length <= 1) setPreSummary('');
  };

  const runAnalysis = async () => {
    const fullCorpus = loadedFiles.map(f => f.content).join('\n') + "\n" + preSummary;
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
      const fullCorpus = loadedFiles.map(f => f.content).join('\n');
      const result = await generateMaradonToken(fullCorpus, analysis);
      setTokenResult(result); setStep(Step.FINAL_REFORMULATION);
    } catch (err) { setError("Error en el Token."); setStep(Step.RESULT_CENTROID); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep(Step.UPLOAD); setLoadedFiles([]); setPreSummary(''); setAnalysis(null); setTokenResult(null); setError(null);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
        <Card title="🔑 Soberanía Técnica" className="max-w-md">
          <p className="mb-4 text-slate-600">No se detectó una API Key en el entorno.</p>
          <button onClick={() => window.aistudio?.openSelectKey()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Vincular con AI Studio</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <header className="bg-slate-900 text-white py-6 px-4 border-b-4 border-blue-500 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black italic tracking-tighter">GEMINI MARADON.AR</h1>
          {step !== Step.UPLOAD && <button onClick={reset} className="text-xs uppercase tracking-widest border border-white/30 px-3 py-1 rounded hover:bg-white/10">Reiniciar</button>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {error && <div className="bg-red-500 text-white p-4 rounded-xl mb-6 animate-pulse font-bold">⚠️ {error}</div>}

        {step === Step.UPLOAD && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="1. Corpus Heterogéneo">
              <div className="border-4 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-blue-500 transition-colors relative group">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-5xl block group-hover:scale-110 transition-transform">📄</span>
                <p className="mt-4 font-bold text-slate-400">Sumar archivos al Nensayo</p>
              </div>
              <div className="mt-6 space-y-2">
                {loadedFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
                    <span className="text-xs font-mono truncate mr-2">/ {f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="2. Prensayo (Resumen Central)">
              <div className="relative">
                <textarea 
                  className={`w-full h-48 p-4 border rounded-xl text-sm font-serif bg-slate-50 transition-opacity ${isSummarizing ? 'opacity-30' : 'opacity-100'}`}
                  placeholder="La IA generará un resumen aquí al cargar archivos..." 
                  value={preSummary} 
                  onChange={(e) => setPreSummary(e.target.value)} 
                />
                {isSummarizing && <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 animate-pulse italic">Escaneando base común...</div>}
              </div>
              <button 
                disabled={loading || loadedFiles.length === 0} 
                onClick={runAnalysis} 
                className="w-full mt-6 bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30"
              >
                EJECUTAR TORSIÓN →
              </button>
            </Card>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xl font-black italic text-slate-800 animate-pulse">NEGANDO CENTROIDES SOCIALES...</p>
          </div>
        )}

        {step === Step.RESULT_CENTROID && analysis && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card title="Explicación del Giro" className="md:col-span-2">
                <p className="text-lg leading-relaxed font-serif">{analysis.centroidExplanation}</p>
              </Card>
              <Card title="Centroides Negados" className="bg-slate-900 text-white border-none">
                <ul className="space-y-3">
                  {analysis.centroids.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                      <span className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]"></span> {c}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            
            <TokenPositionGraph analysis={analysis} />

            <div className="flex justify-center">
              <button onClick={runMaradonToken} className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                CONSOLIDAR TOKEN MARADON.AR
              </button>
            </div>
          </div>
        )}

        {step === Step.FINAL_REFORMULATION && tokenResult && (
          <div className="max-w-2xl mx-auto space-y-10 py-10">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-blue-600 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-sky-600"></div>
              <span className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">Token Final</span>
              <h2 className="text-4xl font-serif italic mt-4 text-slate-800">"{tokenResult.token}"</h2>
            </div>
            <button onClick={reset} className="w-full text-slate-400 hover:text-blue-600 font-bold uppercase text-xs tracking-widest">Iniciar nuevo ciclo de asombro</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
