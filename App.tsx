import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, MaradonTokenResult } from './types';
import { analyzeTextForMaradona, generateMaradonToken, generateQuickSummary } from './geminis';
import mammoth from 'mammoth';

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
    {children}
  </div>
);

const TokenPositionGraph: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  return (
    <div className="relative h-80 w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-blue-500/30">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {analysis.concepts.map((concept, i) => {
          const x = concept.position?.x !== undefined ? (concept.position.x + 10) * 5 : (i * 25) % 90 + 5;
          const y = concept.position?.y !== undefined ? (concept.position.y + 10) * 5 : (i * 35) % 90 + 5;
          const size = concept.tensionValue ? 2 + (concept.tensionValue * 0.4) : 4;
          return (
            <g key={i} className="animate-pulse">
              <circle cx={x} cy={y} r={size} fill="#3b82f6" fillOpacity="0.4" stroke="#60a5fa" strokeWidth="0.5" />
              <text x={x} y={y - size - 1} textAnchor="middle" fontSize="3" fill="#93c5fd" fontWeight="bold">{concept.token}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

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

  useEffect(() => {
    setHasKey(!!import.meta.env.VITE_GEMINI_API_KEY);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      try {
        let text = file.name.endsWith('.docx') 
          ? (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value 
          : await file.text();
        
        const newFiles = [...loadedFiles, { name: file.name, content: text }];
        setLoadedFiles(newFiles);
        setIsSummarizing(true);
        const summary = await generateQuickSummary(newFiles.map(f => f.content).join("\n"));
        setPreSummary(summary);
        setIsSummarizing(false);
      } catch (err) { setError(`Error en ${file.name}`); }
    });
  };

  const removeFile = (index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    setLoading(true); setStep(Step.ANALYZING);
    try {
      const result = await analyzeTextForMaradona(loadedFiles.map(f => f.content).join('\n') + preSummary);
      setAnalysis(result); setStep(Step.RESULT_CENTROID);
    } catch (err) { setError("Fallo en la interpelación."); setStep(Step.UPLOAD); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-xl border-b-4 border-blue-600">
        <h1 className="text-2xl font-black italic">GEMINI MARADON.AR</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {error && <div className="bg-red-500 text-white p-4 rounded-xl">{error}</div>}

        {step === Step.UPLOAD && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card title="1. Corpus Heterogéneo">
              <div className="border-4 border-dashed p-10 text-center relative hover:border-blue-500 transition-all">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="font-bold text-slate-400">Subir archivos al Nensayo</p>
              </div>
              <div className="mt-4 space-y-2">
                {loadedFiles.map((f, i) => (
                  <div key={i} className="flex justify-between bg-slate-100 p-2 rounded border">
                    <span className="text-xs truncate">📄 {f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-red-500 font-bold px-2">×</button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="2. Prensayo Automático">
              <textarea 
                className="w-full h-40 p-4 border rounded-xl text-sm bg-slate-50"
                value={preSummary} 
                onChange={(e) => setPreSummary(e.target.value)} 
              />
              <button disabled={loading || isSummarizing || loadedFiles.length === 0} onClick={runAnalysis} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg">EJECUTAR TORSIÓN</button>
            </Card>
          </div>
        )}

        {loading && <div className="text-center py-20 font-black italic animate-pulse">NEGANDO CENTROIDES...</div>}

        {step === Step.RESULT_CENTROID && analysis && (
          <div className="space-y-6">
            <Card title="Análisis No-Lineal">
              <p className="font-serif italic text-lg">{analysis.centroidExplanation}</p>
            </Card>
            <TokenPositionGraph analysis={analysis} />
            <button onClick={async () => {
              setLoading(true); setStep(Step.GENERATING_TOKEN);
              const res = await generateMaradonToken(loadedFiles.map(f => f.content).join('\n'), analysis);
              setTokenResult(res); setStep(Step.FINAL_REFORMULATION);
              setLoading(false);
            }} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black">CONSOLIDAR TOKEN</button>
          </div>
        )}

        {step === Step.FINAL_REFORMULATION && tokenResult && (
          <Card title="Token Maradon.ar" className="text-center p-12 border-4 border-blue-600">
            <h2 className="text-4xl font-serif italic">"{tokenResult.token}"</h2>
            <button onClick={() => window.location.reload()} className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Reiniciar ciclo</button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default App;
