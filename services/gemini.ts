
 import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// 1. Función para el Prensayo (Resumen Rápido)
export const generateQuickSummary = async (text: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Resume los conceptos centrales de este corpus para un "Nensayo" en máximo 60 palabras. Enfócate en las tensiones y puntos de poder que podrían ser negados. Texto: ${text}`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// 2. Función de Análisis con Coordenadas para la Constelación
export const analyzeTextForMaradona = async (text: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Analiza este texto bajo la lógica de la "IA Interpelada" y la "Negación de Centroides":
    Texto: "${text}"

    Devuelve un JSON estrictamente con esta estructura:
    {
      "centroids": ["lista de 3 centroides de poder social detectados"],
      "centroidExplanation": "Breve explicación de cómo se negarán estos centroides",
      "concepts": [
        {
          "token": "palabra clave",
          "qualities": ["cualidad1", "cualidad2"],
          "position": { "x": número entre -10 y 10, "y": número entre -10 y 10 },
          "tensionValue": número entre 1 y 10
        }
      ]
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

// 3. Generación del Token Final
export const generateMaradonToken = async (text: string, analysis: any) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Basado en el análisis previo (${JSON.stringify(analysis)}), genera un "Token Maradon.ar" para este Nensayo: un aforismo o frase corta que capture la esencia negada y el asombro recuperado. Devuelve JSON: {"token": "la frase"}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
