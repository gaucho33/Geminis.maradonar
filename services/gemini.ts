import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const generateQuickSummary = async (text: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Resume los conceptos centrales de este corpus para un "Nensayo" en máximo 60 palabras. Enfócate en las tensiones y puntos de poder que podrían ser negados. Texto: ${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

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
  const responseText = result.response.text();
  // Blindaje contra Markdown
  return JSON.parse(responseText.replace(/```json|```/g, "").trim());
};

export const generateMaradonToken = async (text: string, analysis: any) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });
  const prompt = `Basado en el análisis previo (${JSON.stringify(analysis)}), genera un "Token Maradon.ar" para este Nensayo: un aforismo o frase corta que capture la esencia negada y el asombro recuperado. Devuelve JSON: {"token": "la frase"}`;
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText.replace(/```json|```/g, "").trim());
};
