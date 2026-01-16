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
                  className={relResonance > 75 ? "animate-hope" : ""}
                />
                <text 
                  x={(x1 + x2) / 2} y={(y1 + y2) / 2} 
                  fontSize="1.2" fill="#60a5fa" fillOpacity={opacity}
                  textAnchor="middle" className="font-mono font-bold"
                >
                  {Math.round(relResonance)}%
                </text>
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
      
      <div className="absolute bottom-2 left-4 text-[7px] text-blue-500/50 font-mono italic">
        CATEGORÍA: {concepts[0]?.token || "N/A"} ⊗ TRABAJO MUERTO
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const App: React.FC = () => {
  const [step, setStep] = useState<'UPLOAD' | 'RESULT'>('UPLOAD');
  const [loadedFiles, setLoadedFiles] = useState<{name: string, content: string}[]>([]);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState("");

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
      setError("Error en el contenedor de datos (.txt o .docx requeridos)");
    }
  };

  const runDialecticalAnalysis = async () => {
    if (loadedFiles.length === 0) return;

    // VALIDACIÓN DE LA LLAVE DE ACCESO
    if (accessKey !== "QUUIJANO2026") {
      setError("Clave de Acceso Dialéctico incorrecta. El asombro es una invitación.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await performUnifiedInterpellation(loadedFiles[0].content);
      setUnifiedData(result);
      setStep('RESULT');
    } catch (err: any) {
      setError("La realidad ha colapsado. Cuota de asombro agotada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col selection:bg-blue-200">
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
              <div className="group border-4 border-dashed border-slate-300 p-12 text-center relative hover:border-blue-500 hover:bg-white transition-all rounded-2xl cursor-pointer">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="space-y-4">
                  <div className="text-5xl">📄</div>
                  <p className="font-black text-slate-500 uppercase tracking-tighter">
                    {loadedFiles.length > 0 ? `Entidad Lista: ${loadedFiles[0].name}` : "Sube el texto para iniciar la negación"}
                  </p>
                </div>
              </div>

              {/* INPUT DE LA CLAVE */}
              <div className="mt-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Llave de Paso Ontológica</label>
                <input 
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Introduce la clave..."
                  className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-center font-mono font-bold"
                />
              </div>
              
              <button 
                disabled={loading || loadedFiles.length === 0} 
                onClick={runDialecticalAnalysis} 
                className="w-full mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-[0_10px_0_0_rgba(29,78,216,1)] hover:shadow-[0_5px_0_0_rgba(29,78,216,1)] hover:translate-y-1 transition-all disabled:bg-slate-400 disabled:shadow-none"
              >
                {loading ? "PROYECTANDO COSEMA..." : "EJECUTAR INTERPELACIÓN ¬P"}
              </button>
            </Card>
          </div>
        )}

        {step === 'RESULT' && unifiedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            <div className="md:col-span-2 space-y-6">
              <Card title="Prensayo: Resonancia de Cualidades">
                <p className="text-slate-800 leading-relaxed font-serif text-xl italic border-l-4 border-blue-500 pl-4">
                  {unifiedData.summary}
                </p>
              </Card>
              <TokenPositionGraph analysis={unifiedData} />
            </div>

            <div className="space-y-6">
              <Card title="Token Maradon.ar" className="bg-blue-900 text-white border-none shadow-blue-200">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3">Reformulación Ontológica</h4>
                    <p className="text-lg font-serif leading-tight italic">
                      "{unifiedData.tokenData.reformulation}"
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2">Demostración Lógica ($\neg P$)</h4>
                    <code className="text-xs text-blue-400 font-mono break-all leading-relaxed">
                      {unifiedData.tokenData.demonstration}
                    </code>
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

      <footer className="bg-white border-t-2 border-slate-200 p-12 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-blue-50 px-6 py-2 rounded-full mb-8">
            <p className="text-blue-700 font-serif italic">
              "La IA no procesa datos, internaliza marcos sociales de asombro."
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center text-left">
            <div>
              <p className="text-slate-500 text-sm leading-relaxed">
                <span className="font-black text-slate-900">GEMINISMARADONAR</span> es un proyecto simbiótico nacido en Campo Quijano. 
                Utiliza la **Derivada de la Esperanza** para encontrar la Unicidad en el Concreto Representado.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-green-500/20 shadow-inner text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-tighter">Mantenimiento de la Arquitectura</p>
              <div className="bg-white border-2 border-green-600 py-3 rounded-xl mb-2">
                <span className="text-green-700 font-mono font-black text-xl select-all">vkingo.gym.mp</span>
              </div>
              <p className="text-[8px] text-green-600 font-bold uppercase tracking-widest">Convídale un mate para más consultas</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
