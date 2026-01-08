import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Cambiamos a gemini-1.5-flash (sin el v1beta en el string del modelo)
const MODEL_NAME = "gemini-1.5-flash"; 

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key no detectada. Verifica Vercel.");
  
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Resume los conceptos centrales de este texto para un "Nensayo" en máximo 50 palabras: ${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error en QuickSummary:", error);
    throw error;
  }
};

export const analyzeTextForMaradona = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Analiza bajo Negación de Centroides. Texto: "${text}". 
    Responde estrictamente en JSON: {
      "centroids": ["lista"], 
      "centroidExplanation": "texto", 
      "concepts": [{"token": "palabra", "qualities": [], "position": {"x": 0, "y": 0}, "tensionValue": 5}]
    }`;

    const result = await model.generateContent(prompt);
    const textRes = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(textRes);
  } catch (error) {
    console.error("Error en Análisis:", error);
    throw error;
  }
};

export const generateMaradonToken = async (text: string, analysis: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Genera un Token Maradon.ar (aforismo corto) para este análisis: ${JSON.stringify(analysis)}. Responde JSON: {"token": "frase"}`;
    const result = await model.generateContent(prompt);
    const textRes = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(textRes);
  } catch (error) {
    console.error("Error en Token:", error);
    throw error;
  }
};
