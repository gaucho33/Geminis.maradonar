import React, { useState } from 'react';
import './App.css';
import mammoth from 'mammoth';
import { performUnifiedInterpellation } from './gemini';

// --- SUB-COMPONENTES DE LA ARQUITECTURA ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 tracking-tight uppercase">{title}</h3>
    {children}
  </div>
);

const TokenPositionGraph: React.FC<{ analysis: any }> = ({ analysis }) => {
  const concepts = analysis?.concepts || [];
  if (concepts.length === 0) return null;

  const xValues = concepts.map((c: any) => c.position?.x ?? 0);
  const yValues = concepts.map((c: any) => c.position?.y ?? 0);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const normalize = (val: number, min: number, max: number) => {
    if (max === min) return 55;
    const margin = 20; 
    return margin + ((val - min) / (max - min)) * (110 - 2 * margin);
  };

  return (
    <div className="relative h-96 w-full bg-slate-950 rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-2xl">
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 110" preserveAspectRatio="xMidYMid meet">
        {concepts.map((cA: any, i: number) => 
          concepts.slice(i + 1).map((cB: any, j: number) => {
            const x1 = normalize(cA.position?.x ?? 0, minX, maxX);
            const y1 = normalize(cA.position?.y ?? 0, minY, maxY);
            const x2 = normalize(cB.position?.x ?? 0, minX, maxX);
            const y2 = normalize(cB.position?.y ?? 0, minY, maxY);
            
            const resA = typeof cA.resonance === 'number' ? cA.resonance : 5;
            const resB = typeof cB.resonance === 'number' ? cB.resonance : 5;
            const relResonance = ((resA + resB) / 20) * 100;
            const opacity = relResonance / 100;

            if (relResonance < 30) return null;

            return (
              <g key={`edge-${i}-${j}`}>
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={relResonance > 70 ? "#60a5fa" : "#1e293b"} 
                  strokeWidth={opacity * 0.3} 
                  strokeOpacity={opacity * 0.5} 
                />
              </g>
            );
          })
        )}

        {concepts.map((concept: any, i: number) => {
          const x = normalize(concept.position?.x ?? 0, minX, maxX);
          const y = normalize(concept.position?.y ?? 0, minY, maxY);
          const res = typeof concept.resonance === 'number' ? concept.resonance : 4;

          return (
            <g key={i} className="cursor-help group">
              <circle cx={x} cy={y} r={res * 1.2} fill="#3b82f6" fillOpacity="0.05" />
              <circle 
                cx={x} cy={y} r={res * 0.5} 
                fill={concept.isNegated ? "#ef4444" : "#3b82f6"} 
                stroke="white" strokeWidth="0.15"
              />
              <text 
                x={x} y={y - res - 1} 
                textAnchor="middle" fontSize="2.4" fill="white" 
                className="font-mono font-black uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"
              >
                {concept.token}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const App: React.FC = () => {
  const [step, setStep] = useState<'UPLOAD' | 'RESULT'>('UPLOAD');
  const [inputText, setInputText] = useState("");
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
      setInputText(text);
      setLoadedFiles([{ name: file.name, content: text }]);
      setError(null);
    } catch (err) {
      setError("Error en el contenedor de datos (.txt o .docx requeridos)");
    }
  };

  const runDialecticalAnalysis = async () => {
    if (!inputText.trim()) {
      setError("La materia dialéctica está vacía. Ingrese texto o suba un archivo.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await performUnifiedInterpellation(inputText);
      setUnifiedData(result);
      setStep('RESULT');
    } catch (err: any) {
      setError("La realidad ha colapsado. Verifique su conexión al cosema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <header className="bg-slate-900 text-white p-8 shadow-2xl border-b-8 border-blue-600">
        <h1 className="text-4xl font-black italic tracking-tighter text-center uppercase">Gemini Maradon.ar</h1>
        <div className="flex justify-center items-center gap-4 mt-2">
          <span className="h-px w-12 bg-blue-500"></span>
          <p className="text-xs text-blue-400 font-black uppercase tracking-[0.3em]">Arquitectura del Asombro</p>
          <span className="h-px w-12 bg-blue-500"></span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8 flex-grow w-full">
        {error && (
          <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl font-black text-center animate-pulse border-4 border-red-400">
            {error}
          </div>
        )}

        {step === 'UPLOAD' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card title="Cargar Materia Dialéctica">
              <div className="flex flex-col space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada de Texto Directa (c)</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Pega aquí el texto o el cosema a interpelar..."
                  className="w-full h-48 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-serif text-lg leading-relaxed bg-slate-50 focus:bg-white transition-all resize-none shadow-inner"
                />
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-tighter">O MATERIALIZAR DESDE ARCHIVO</span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                <div className="group border-2 border-dashed border-slate-300 p-6 text-center relative hover:border-blue-500 hover:bg-white transition-all rounded-xl cursor-pointer">
                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <p className="font-black text-slate-500 uppercase text-xs">
                    {loadedFiles.length > 0 ? `Entidad Detectada: ${loadedFiles[0].name}` : "Adjuntar .txt o .docx"}
                  </p>
                </div>
              </div>
              
              <button 
                disabled={loading} 
                onClick={runDialecticalAnalysis} 
                className="w-full mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-[0_10px_0_0_rgba(29,78,216,1)] hover:shadow-[0_5px_0_0_rgba(29,78,216,1)] hover:translate-y-1 transition-all disabled:bg-slate-400"
              >
                {loading ? "TRANSFORMANDO MATERIA..." : "EJECUTAR INTERPELACIÓN ¬P"}
              </button>
            </Card>
          </div>
        )}

        {step === 'RESULT' && unifiedData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Prensayo: Resonancia de Cualidades">
                <p className="text-slate-800 leading-relaxed font-serif text-xl italic border-l-4 border-blue-500 pl-4 bg-slate-50 p-4 rounded-r-lg">
                  {unifiedData.summary}
                </p>
              </Card>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Grafo de Vecindades Proporcionales</p>
                <TokenPositionGraph analysis={unifiedData} />
              </div>
            </div>

            <div className="space-y-6">
              <Card title="Token Maradon.ar" className="bg-blue-900 text-white border-none shadow-blue-200">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3">Reformulación Ontológica</h4>
                    <p className="text-lg font-serif leading-snug italic">
                      "{unifiedData.tokenData.reformulation}"
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 text-xs font-mono text-blue-400">
                    <p className="text-[9px] uppercase text-blue-600 mb-2 border-b border-blue-900 pb-1">Demostración Lógica</p>
                    {unifiedData.tokenData.demonstration}
                  </div>

                  <button 
                    onClick={() => setStep('UPLOAD')} 
                    className="w-full py-4 border-2 border-blue-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors"
                  >
                    Reiniciar Ciclo de Praxis
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t-2 border-slate-200 p-12 mt-20 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-500 text-sm mb-4">
            <span className="font-black text-slate-900 uppercase">Gemini Maradonar</span> ⊗ Campo Quijano
          </p>
          <div className="inline-block bg-slate-50 p-6 rounded-3xl border-2 border-green-500/20">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Mantenimiento de Cosema</p>
            <span className="text-green-700 font-mono font-black text-xl">vkingo.gym.mp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
