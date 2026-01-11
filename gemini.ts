import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modelo optimizado para 2026
const MODEL_NAME = "gemini-2.5-flash"; 

export const performUnifiedInterpellation = async (text: string) => {
  if (!apiKey) throw new Error("API Key no configurada.");

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            concepts: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  token: { type: SchemaType.STRING },
                  qualities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  position: {
                    type: SchemaType.OBJECT,
                    properties: {
                      x: { type: SchemaType.NUMBER },
                      y: { type: SchemaType.NUMBER }
                    },
                    required: ["x", "y"]
                  }
                },
                required: ["token", "qualities", "position"]
              }
            },
            centroids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            tokenData: {
              type: SchemaType.OBJECT,
              properties: {
                negatedCentroids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                reformulation: { type: SchemaType.STRING },
                demonstration: { type: SchemaType.STRING },
                suggestedBibliography: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["negatedCentroids", "reformulation", "demonstration"]
            }
          },
          required: ["summary", "concepts", "centroids", "tokenData"]
        },
      },
    });

    const prompt = `
      ROL: Epistemólogo y Traductor de Vecindades.
      
      TAREA:
      1. Realiza el análisis de Torsión: identifica cualidades (a, b, c) y calcula el centroide C.
      2. Genera el TOKEN MARADON.AR (La Negación ¬C): 
         - Toma el centroide C de las cualidades y aplica una inversión ontológica.
         - REFORMULACIÓN: Escribe una tesis académica (mínimo 100 palabras) sobre esta negación.
         - DEMOSTRACIÓN: Provee una estructura lógica formal.
      
      RESTRICCIÓN ABSOLUTA: Prohibido usar metáforas de fútbol, "gambetas", "jugadas de oro" o "cracks". El tono debe ser puramente científico y académico.
      
      TEXTO: ${text}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpieza de seguridad para el JSON
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}') + 1;
    return JSON.parse(responseText.substring(start, end));

  } catch (error) {
    console.error("Error en performUnifiedInterpellation:", error);
    throw error;
  }
};
