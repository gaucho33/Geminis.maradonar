import { GoogleGenerativeAI } from "@google/generative-ai";

// Buscamos la Key con el prefijo VITE_ que es el estándar de Vite/Vercel
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key no configurada en Vercel");
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Resume los conceptos centrales para un Nensayo (max 60 palabras): ${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error en QuickSummary:", error);
    throw error;
  }
};

export const analyzeTextForMaradona = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Analiza bajo Negación de Centroides. Texto: "${text}". Devuelve JSON con centroids (string[]), centroidExplanation (string), y concepts (array de objetos con token, qualities[], position{x,y}, tensionValue).`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText.replace(/```json|```/g, "").trim());
  } catch (error) {
    console.error("Error en Análisis:", error);
    throw error;
  }
};

export const generateMaradonToken = async (text: string, analysis: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Genera un Token Maradon.ar (aforismo corto) basado en este análisis: ${JSON.stringify(analysis)}`;
    const result = await model.generateContent(prompt);
    return { token: result.response.text() };
  } catch (error) {
    console.error("Error en Token:", error);
    throw error;
  }
};
