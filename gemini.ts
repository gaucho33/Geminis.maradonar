import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Usamos un nombre de modelo más "estándar" para evitar el 404
const MODEL_NAME = "gemini-1.5-flash"; 

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key faltante");
  
  try {
    // Forzamos el uso del modelo con una configuración mínima para asegurar respuesta
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Resume los conceptos centrales de este texto para un "Nensayo" en máximo 50 palabras. Texto: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error en QuickSummary:", error);
    throw error;
  }
};

export const analyzeTextForMaradona = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Analiza este texto bajo la lógica de "Negación de Centroides". 
    Texto: "${text}"
    Responde ÚNICAMENTE con un objeto JSON (sin markdown) que tenga esta estructura:
    {
      "centroids": ["centroide1", "centroide2", "centroide3"],
      "centroidExplanation": "explicación",
      "concepts": [{"token": "palabra", "qualities": [], "position": {"x": 0, "y": 0}, "tensionValue": 5}]
    }`;

    const result = await model.generateContent(prompt);
    const textRes = result.response.text();
    // Limpiamos por si devuelve ```json ... ```
    const cleanJson = textRes.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error en Análisis:", error);
    throw error;
  }
};

export const generateMaradonToken = async (text: string, analysis: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Basado en este análisis: ${JSON.stringify(analysis)}, genera un aforismo corto (Token Maradon.ar). Responde JSON: {"token": "tu frase"}`;
    const result = await model.generateContent(prompt);
    const textRes = result.response.text();
    const cleanJson = textRes.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error en Token:", error);
    throw error;
  }
};
