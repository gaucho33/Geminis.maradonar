import React, { useState, useEffect } from 'react';
import { Step, AnalysisResult, UnifiedResult } from './types'; // Asegúrate de añadir UnifiedResult a tus types
import { performUnifiedInterpellation } from './gemini';
import mammoth from 'mammoth';

// ... Componentes Card y TokenPositionGraph se mantienen igual ...

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadedFiles, setLoadedFiles] = useState<{name: string, content: string}[]>([]);
  const [preSummary, setPreSummary] = useState('');
  const [unifiedData, setUnifiedData] = useState<UnifiedResult | null>(null); // Estado único
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manejo de archivos simplificado
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const file = files[0]; // Simplificamos a un archivo para la prueba de cuota
    try {
      let text = "";
      if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      } else {
        text = await file.text();
      }
      setLoadedFiles([{ name: file.name, content: text }]);
    } catch (err) {
      setError("Error al leer el archivo.");
    }
  };

  // LA TORSIÓN UNIFICADA (Ahorra cuota y elimina frases hechas)
  const runAnalysis = async () => {
    if (loadedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Llamamos a la función maestra de gemini.ts
      const result = await performUnifiedInterpellation(loadedFiles[0].content);
      
      setUnifiedData(result); // Guardamos TODO el paquete (Resumen, Gráfica y Token)
      setPreSummary(result.summary);
      setStep(Step.RESULT_CENTROID);
    } catch (err) {
      setError("Límite de cuota alcanzado o error de red. Intenta mañana.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="font-bold text-slate-400">
                  {loadedFiles.length > 0 ? `Cargado: ${loadedFiles[0].name}` : "Subir archivo al Nensayo"}
                </p>
              </div>
            </Card>

            <Card title="2. Prensayo y Torsión">
              <p className="text-xs text-slate-500 mb-4">La interpelación generará la gráfica y el token teórico en un solo paso.</p>
              <button 
                disabled={loading || loadedFiles.length === 0} 
                onClick={runAnalysis} 
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 disabled:bg-slate-300"
              >
                {loading ? "PROCESANDO..." : "EJECUTAR INTERPELACIÓN"}
              </button>
            </Card>
          </div>
        )}

        {/* RESULTADO DE LA GRÁFICA */}
        {step === Step.RESULT_CENTROID && unifiedData && (
          <div className="space-y-6">
            <Card title="Prensayo Automático">
              <p className="text-slate-700 leading-relaxed">{unifiedData.summary}</p>
            </Card>
            
            <TokenPositionGraph analysis={unifiedData} />

            <button 
              onClick={() => setStep(Step.FINAL_REFORMULATION)} 
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black hover:bg-black"
            >
              VER RECONSTRUCCIÓN TEÓRICA (TOKEN)
            </button>
          </div>
        )}

        {/* RESULTADO DEL TOKEN (Sin llamadas extra a la API) */}
        {step === Step.FINAL_REFORMULATION && unifiedData && (
          <div className="space-y-6">
            <Card title="Token Maradon.ar: Inversión ¬C" className="border-4 border-blue-600">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-blue-700 italic">Reformulación Ontológica:</h2>
                <p className="text-lg font-serif leading-relaxed text-slate-800">
                  {unifiedData.tokenData.reformulation}
                </p>
                <div className="bg-slate-100 p-4 rounded-lg">
                  <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">Demostración Lógica:</h4>
                  <code className="text-blue-600">{unifiedData.tokenData.demonstration}</code>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-500"
              >
                Reiniciar ciclo de asombro
              </button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
