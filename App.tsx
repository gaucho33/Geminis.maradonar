import React, { useState } from 'react';
import mammoth from 'mammoth';
import { performUnifiedInterpellation } from './gemini';

// --- SUB-COMPONENTES (Declarados arriba para evitar ReferenceError) ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 tracking-tight">{title}</h3>
    {children}
  </div>
);

const TokenPositionGraph: React.FC<{ analysis: any }> = ({ analysis }) => {
  // Función para evitar la superposición mediante un pequeño desplazamiento aleatorio (Jitter)
  const getSafePos = (val: number, index: number) => {
    // Escalamos el rango original de -10/10 a 0/100
    const scaled = (val + 10) * 5;
    // Añadimos un pequeño desplazamiento basado en el índice para que tokens en la misma pos. se separen
    return scaled + (index % 3) * 2; 
  };

  return (
    <div className="relative h-96 w-full bg-slate-950 rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-2xl">
      {/* Grilla de fondo para dar profundidad */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 110">
        {/* Líneas de ejes centrales */}
        <line x1="55" y1="5" x2="55" y2="105" stroke="#1e293b" strokeWidth="0.5" />
        <line x1="5" y1="55" x2="105" y2="55" stroke="#1e293b" strokeWidth="0.5" />

        {analysis.concepts.map((concept: any, i: number) => {
          const x = getSafePos(concept.position?.x || 0, i);
          const y = getSafePos(concept.position?.y || 0, i + 1);
          const size = 3.5;

          return (
            <g key={i} className="hover:opacity-100 transition-opacity cursor-help group">
              {/* Brillo de vecindad */}
              <circle cx={x} cy={y} r={size * 2} fill="#3b82f6" fillOpacity="0.1" />
              
              {/* Punto central del Token */}
              <circle 
                cx={x} 
                cy={y} 
                r={size} 
                fill="#3b82f6" 
                fillOpacity="0.6" 
                stroke="#60a5fa" 
                strokeWidth="0.4"
                className="animate-pulse"
              />
              
              {/* Etiqueta del Token con fondo para legibilidad */}
              <rect x={x - 10} y={y - size - 6} width="20" height="5" rx="1" fill="#0f172a" fillOpacity="0.8" className="hidden group-hover:block" />
              <text 
                x={x} 
                y={y - size - 2} 
                textAnchor="middle" 
                fontSize="3.5" 
                fill="#fff" 
                className="font-bold pointer-events-none select-none drop-shadow-md"
              >
                {concept.token}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Leyenda de la gráfica */}
      <div className="absolute bottom-2 right-4 text-[8px] text-slate-500 font-mono uppercase tracking-widest">
        Topología de Torsión: Φ = c ⊗ C
      </div>
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
      setError("Error al procesar el archivo. Intenta con otro formato.");
    }
  };

  const runAnalysis = async () => {
    if (loadedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await performUnifiedInterpellation(loadedFiles[0].content);
      setUnifiedData(result);
      setStep('RESULT');
    } catch (err: any) {
      setError("Error de interpelación. Cuota diaria agotada (20/20).");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-slate-900 text-white p-6 shadow-xl border-b-4 border-blue-600 text-center">
        <h1 className="text-2xl font-black italic tracking-tighter">GEMINI MARADON.AR</h1>
        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Traductor de Vecindades Unificado</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 flex-grow w-full">
        {error && <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg font-bold animate-bounce text-center">{error}</div>}

        {step === 'UPLOAD' && (
          <div className="grid gap-8">
            <Card title="Cargar Corpus para Nensayo">
              <div className="border-4 border-dashed border-slate-200 p-10 text-center relative hover:border-blue-500 transition-all rounded-xl bg-slate-50/50">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="font-bold text-slate-400">
                  {loadedFiles.length > 0 ? `Archivo listo: ${loadedFiles[0].name}` : "Arrastra o selecciona un documento (.txt o .docx)"}
                </p>
              </div>
              
              <button 
                disabled={loading || loadedFiles.length === 0} 
                onClick={runAnalysis} 
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 disabled:bg-slate-300 transition-all transform active:scale-95"
              >
                {loading ? "NEGANDO CENTROIDES..." : "EJECUTAR TORSIÓN UNIFICADA"}
              </button>
            </Card>
          </div>
        )}

        {step === 'RESULT' && unifiedData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card title="Prensayo (Análisis de Cualidades)">
              <p className="text-slate-700 leading-relaxed font-serif text-lg">{unifiedData.summary}</p>
            </Card>
            
            <TokenPositionGraph analysis={unifiedData} />

            <Card title="Token Maradon.ar (Negación ¬C)" className="border-t-4 border-t-blue-600 bg-blue-50/50">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">Reformulación Ontológica</h4>
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

      {/* --- FOOTER DE IDENTIDAD Y DONACIONES --- */}
      <footer className="bg-slate-100 border-t border-slate-200 p-8 mt-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-slate-600 italic font-serif text-lg leading-relaxed px-4">
            "Como buen argentino, <span className="font-bold text-blue-600">Geminismaradonar</span> discutirá y reformulará todo lo que le pongas en frente totalmente gratis, es ideal para encontrar inspiración para trabajos de investigación teórica."
          </p>
          
          <div className="pt-6 border-t border-slate-300">
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
              Convídale un mate para que pueda hacer más de 20 consultas por día:
            </p>
            <div className="inline-flex flex-col items-center bg-white border-2 border-green-600 px-8 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-transform">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Alias Mercado Pago</span>
              <span className="text-green-700 font-mono font-black text-2xl select-all">vkingo.gym.mp</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-6 uppercase tracking-[0.3em] font-bold">
              Arquitectura del Asombro © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
