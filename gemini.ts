import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modelos según cronograma 2026 - Normalizados sin caracteres invisibles
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

  try {
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
      1. Identifica tokens centrales y sus cualidades asociadas.
      2. Calcula Centroides C basados exclusivamente en la afinidad de las CUALIDADES, no en el nombre del token.
      3. Define la topología del texto basándote en estos puntos de gravedad.
      4. Asigna coordenadas x, y (rango -10 a 10).
      
      TEXTO: ${text}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Limpieza robusta: busca el primer '{' y el último '}'
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}') + 1;
    return JSON.parse(responseText.substring(start, end));
  } catch (error) {
    console.error("Error en analyzeTextForMaradona:", error);
    throw error;
  }
};

export const generateMaradonToken = async (analysis: any) => {
  if (!apiKey) throw new Error("API Key no configurada.");

  try {
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

    const prompt = `ROL: Epistemólogo. OBJETIVO: Inversión ontológica (¬C).
      DATOS: Cualidades: ${JSON.stringify(analysis.concepts)}, Centroides: ${JSON.stringify(analysis.centroids)}.
      TAREA: 1. Niega C. 2. Reformula la tesis (mínimo 100 palabras, tono científico). 3. Demostración lógica. 4. Bibliografía real.
      RESTRICCIÓN: Prohibido lenguaje coloquial o deportivo.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}') + 1;
    return JSON.parse(responseText.substring(start, end));
  } catch (error) {
    console.error("Error en generateMaradonToken:", error);
    throw error;
  }
};
