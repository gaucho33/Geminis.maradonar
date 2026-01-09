import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modelo estándar para enero 2026
const MODEL_NAME = "gemini-2.5-flash"; 

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key no configurada.");
  
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    // Mantenemos tu instrucción: resumen + centroides al final
    const prompt = `Resume este corpus de forma analítica. Al final, añade una sección clara titulada "CENTROIDES POTENCIALES" identificando los puntos de afinidad de las cualidades descritas por el autor. Texto: ${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error en QuickSummary:", error);
    return "Error al generar el resumen de afinidades.";
  }
};

export const analyzeTextForMaradona = async (text: string) => {
  if (!apiKey) throw new Error("API Key no configurada.");

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Ajuste de "Formación de Centroides" por afinidad de cualidades
    const prompt = `
      Actúa como un motor de análisis topológico.
      1. Extrae los conceptos de importancia (1, 2, 3...) y sus cualidades específicas (a, b, c...) definidas por el autor.
      2. Define el Centroide C no por los conceptos, sino por la afinidad matemática de la nube de cualidades {a1, b1, c1, a2, b2, c2...}.
      3. Niega el Centroide C y reconstruye la teoría proponiendo nuevas cualidades de la proximidad del centroide negado con las cualidades originales.
      
      Texto: "${text}"

      Responde ÚNICAMENTE en formato JSON:
      {
        "centroids": ["Centroide C (Afinidad)", "Centroide Negado (Reconstrucción)"],
        "centroidExplanation": "Explicación de la reconstrucción teórica basada en la negación del centroide de cualidades.",
        "concepts": [
          {
            "token": "Concepto",
            "qualities": ["cualidad a", "cualidad b"],
            "position": { "x": 0, "y": 0 },
            "tensionValue": 5
          }
        ]
      }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Limpieza robusta de la respuesta JSON
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error en el análisis de centroides:", error);
    throw error;
  }
};

export const generateMaradonToken = async (text: string, analysis: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Basado en este análisis de centroides negados y afinidad de cualidades, genera un aforismo final (Token Maradon.ar): ${JSON.stringify(analysis)}`;
    const result = await model.generateContent(prompt);
    return { token: result.response.text() };
  } catch (error) {
    return { token: "El asombro permanece en la nube de cualidades." };
  }
};
