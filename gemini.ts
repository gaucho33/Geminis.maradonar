import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = "gemini-2.5-flash"; 

export const analyzeTextForMaradona = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `
      TAREA: Geometría de Cualidades y Negación de Centroides.
      
      1. EXTRACCIÓN: Identifica los conceptos de importancia (1, 2, 3...) y, para cada uno, extrae sus cualidades específicas (a, b, c...) tal como las define el autor en el texto.
      2. CENTROIDE (C): Calcula el centroide C por afinidad de los embeddings de las cualidades {a1, b1, c1, a2, b2, c2...}. No uses los conceptos centrales para el cálculo, usa sus vecindades descriptivas.
      3. NEGACIÓN Y AFINACIÓN: Niega el centroide C resultante, pero mantén la proximidad con la nube de cualidades original. 
      4. RECONSTRUCCIÓN: Redefine la teoría del autor a partir de este centroide negado que conserva las cualidades del texto.

      Texto: "${text}"

      Responde estrictamente en JSON:
      {
        "centroids": ["Centroide C (Afinidad de Cualidades)", "Centroide Negado"],
        "centroidExplanation": "Resumen de la teoría reconstruida a partir de la negación del centroide C pero manteniendo sus cualidades vecinas.",
        "concepts": [
          {
            "token": "Concepto original",
            "qualities": ["cualidad extraída A", "cualidad extraída B"],
            "position": { "x": número, "y": número },
            "tensionValue": 7
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error en Torsión por Cualidades:", error);
    throw error;
  }
};
