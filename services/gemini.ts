
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, MaradonTokenResult } from "../types";

export const analyzeTextForMaradona = async (text: string): Promise<AnalysisResult> => {
  // Se instancia justo antes de la llamada según las directrices de seguridad
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analiza el siguiente texto académico aplicando la lógica de "Gemini Maradon.ar":
    1. Identifica los conceptos (tokens) centrales.
    2. Para cada concepto, identifica sus "cualidades" (conceptos o términos que aparecen cercanos en el texto y lo definen por asociación).
    3. Busca uno o más "Centroides" que sinteticen las CUALIDADES encontradas (no los conceptos centrales en sí, sino el núcleo de lo que esas cualidades representan).
    4. Explica brevemente el trabajo original basándote estrictamente en estos centroides.

    TEXTO:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                token: { type: Type.STRING },
                qualities: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["token", "qualities"]
            }
          },
          centroids: { type: Type.ARRAY, items: { type: Type.STRING } },
          centroidExplanation: { type: Type.STRING }
        },
        required: ["concepts", "centroids", "centroidExplanation"]
      }
    }
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
};

export const generateMaradonToken = async (
  originalText: string,
  analysis: AnalysisResult
): Promise<MaradonTokenResult> => {
  // Se instancia de nuevo para asegurar que tiene la clave del diálogo si cambió
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Actúa como el tutor académico de "Gemini Maradon.ar". 
    Usando el análisis previo:
    Conceptos y Cualidades: ${JSON.stringify(analysis.concepts)}
    Centroides: ${JSON.stringify(analysis.centroids)}

    Tu tarea es generar el "Token Maradon.ar":
    1. Niega los centroides encontrados (invierte su significado lógico o funcional).
    2. Vincula esta negación con las cualidades originales de los conceptos centrales (afinidad estadística).
    3. Reformula la teoría o idea central del texto original basándote en esta negación.
    4. Propón una demostración (matemática, lógica o teórica) de esta nueva hipótesis.
    5. Brinda una bibliografía sugerida que pueda sustentar o contrastar esta nueva perspectiva.
    6. Desafía al estudiante a proponer sus propias fórmulas o hipótesis complementarias.

    Sé estimulante, riguroso y académico.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          negatedCentroids: { type: Type.ARRAY, items: { type: Type.STRING } },
          reformulation: { type: Type.STRING },
          demonstration: { type: Type.STRING },
          suggestedBibliography: { type: Type.ARRAY, items: { type: Type.STRING } },
          challengeForStudent: { type: Type.STRING }
        },
        required: ["negatedCentroids", "reformulation", "demonstration", "suggestedBibliography", "challengeForStudent"]
      }
    }
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
};
