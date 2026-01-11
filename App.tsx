import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { performUnifiedInterpellation } from './gemini';

// --- SUB-COMPONENTES (Definidos arriba para evitar ReferenceError) ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
    {children}
  </div>
);

const TokenPositionGraph: React.FC<{ analysis: any }> = ({ analysis }) => {
  return (
    <div className="relative h-80 w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-blue-500/30">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {analysis.concepts.map((concept: any, i: number) => {
          const x = concept.position?.x !== undefined ? (concept.position.x + 10) * 5 : (i * 25) % 90 + 5;
          const y = concept.position?.y !== undefined ? (concept.position.y + 10) * 5 : (i * 35) % 90 + 5;
          const size = 4;
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

// --- COMPONENTE PRINCIPAL ---

const App: React.FC = () => {
  const [step, setStep] = useState<string>('UPLOAD');
  const [loadedFiles, setLoadedFiles] = useState<{name: string, content: string}[]>([]);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    try {
      let text = "";
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }
      setLoadedFiles([{ name: file.name, content: text }]);
      setError(null);
    } catch (err) {
      setError("Error al leer el archivo.");
    }
  };

  const runAnalysis = async () => {
    if (loadedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Llamada unificada para ahorrar cuota
      const result = await performUnifiedInterpellation(loadedFiles[0].content);
      setUnifiedData(result);
      setStep('RESULT');
    } catch (err: any) {
      setError("Error de interpelación. Posible límite de cuota.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-xl border-b-4 border-blue-600 text-center">
        <h1 className="text-2xl font-black italic tracking-tighter">GEMINI MARADON.AR</h1>
        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Traductor de Vecindades Unificado</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {error && <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg font-bold">{error}</div>}

        {step === 'UPLOAD' && (
          <div className="grid gap-8">
            <Card title="Cargar Corpus para Nensayo">
              <div className="border-4 border-dashed border-slate-200 p-10 text-center relative hover:border-blue-500 transition-all rounded-xl">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="font-bold text-slate-400">
                  {loadedFiles.length > 0 ? `Archivo: ${loadedFiles[0].name}` : "Arrastra o selecciona un documento"}
                </p>
              </div>
              
              <button 
                disabled={loading || loadedFiles.length === 0} 
                onClick={runAnalysis} 
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
              >
                {loading ? "INTERPELANDO VECINDADES..." : "EJECUTAR TORSIÓN UNIFICADA"}
              </button>
            </Card>
          </div>
        )}

        {step === 'RESULT' && unifiedData && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <Card title="Prensayo (Análisis de Cualidades)">
              <p className="text-slate-700 leading-relaxed font-serif text-lg">{unifiedData.summary}</p>
            </Card>
            
            <TokenPositionGraph analysis={unifiedData} />

            <Card title="Token Maradon.ar (Negación ¬C)" className="border-t-4 border-t-blue-600 bg-blue-50">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-blue-600 uppercase mb-2">Reformulación Ontológica</h4>
                  <p className="text-xl font-serif italic text-slate-900 leading-snug">
                    {unifiedData.tokenData.reformulation}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Demostración Lógica Formal</h4>
                  <code className="text-sm text-blue-700 font-mono break-all">{unifiedData.tokenData.demonstration}</code>
                </div>

                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                >
                  Reiniciar Ciclo de Asombro
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
