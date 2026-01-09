import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modelos según el cronograma de 2026
const ANALYSIS_MODEL = "gemini-2.5-flash"; 
const TOKEN_MODEL = "gemini-3-pro-preview"; 

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key no configurada.");
  try {
    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL });
    const prompt = `Resume este corpus de forma rigurosa. Al final, añade una sección "CENTROIDES POTENCIALES" identificando los puntos de afinidad de las cualidades (a, b, c) descritas por el autor. Texto: ${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error en QuickSummary:", error);
    return "Error al generar el resumen inicial.";
  }
};

export const analyzeTextForMaradona = async (text: string) => {
  if (!apiKey) throw new Error("API Key no configurada.");

  const model = genAI.getGenerativeModel({
    model: ANALYSIS_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
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
          centroidExplanation: { type: SchemaType.STRING }
        },
        required: ["concepts", "centroids", "centroidExplanation"]
      },
    },
  });

  const prompt = `Analiza el siguiente texto bajo la lógica de afinidad de cualidades:
    1. Identifica tokens centrales y sus cualidades asociadas (conceptos vecinos).
    2. Calcula Centroides C basados exclusivamente en la afinidad de las CUALIDADES (embeddings de vecindad), no en el nombre del token.
    3. Define la topología del texto basándote en estos puntos de gravedad.
    4. Asigna coordenadas x, y (rango -10 a 10) según la tensión semántica.

    TEXTO:
    ${text}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  // Limpieza de Markdown para asegurar un JSON puro
  const jsonContent = responseText.match(/\{[\s\S]*\}/)?.[0] || responseText;
  return JSON.parse(jsonContent);
};

export const generateMaradonToken = async (analysis: any) => {
  if (!apiKey) throw new Error("API Key no configurada.");

  const model = genAI.getGenerativeModel({
    model: TOKEN_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          negatedCentroids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          reformulation: { type: SchemaType.STRING },
          demonstration: { type: SchemaType.STRING },
          suggestedBibliography: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          challengeForStudent: { type: SchemaType.STRING }
        },
        required: ["negatedCentroids", "reformulation", "demonstration", "suggestedBibliography", "challengeForStudent"]
      },
    },
  });

  const prompt = `
    ROL: Epistemólogo y Analista de Sistemas Complejos.
    OBJETIVO: Realizar una inversión ontológica de la base común del texto.

    DATOS DE ENTRADA:
    - Nube de Cualidades: ${JSON.stringify(analysis.concepts)}
    - Centroides de Afinidad (C): ${JSON.stringify(analysis.centroids)}

    INSTRUCCIONES DE PROCESAMIENTO (¬C):
    1. Toma el Centroide C y aplica una negación lógica funcional (Inversión Estructural).
    2. REFORMULACIÓN: Escribe una tesis académica de mínimo 100 palabras con tono de paper científico. Usa terminología técnica (isomorfismo, entropía, dialéctica formal).
    3. DEMOSTRACIÓN: Incluye una estructura lógica "Si P entonces Q" que valide la nueva tesis ¬C.
    4. BIBLIOGRAFÍA: Cita autores académicos reales pertinentes a esta inversión conceptual.

    RESTRICCIÓN ABSOLUTA: Prohibido usar metáforas de "juego", "fútbol", "crack", "máscaras" o lenguaje coloquial.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonContent = responseText.match(/\{[\s\S]*\}/)?.[0] || responseText;
  return JSON.parse(jsonContent);
};
