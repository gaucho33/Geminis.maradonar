import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modelos según tu cronograma de 2026
const ANALYSIS_MODEL = "gemini-2.5-flash"; // Estabilidad para análisis de cualidades
const TOKEN_MODEL = "gemini-3-pro-preview"; // Potencia para la reformulación teórica

export const generateQuickSummary = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key no configurada.");
  try {
    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL });
    const prompt = `Resume este corpus. Al final del resumen, añade una sección "CENTROIDES POTENCIALES" que sean los puntos de afinidad de las cualidades descritas por el autor. Texto: ${text}`;
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
                    }
                }
              },
              required: ["token", "qualities"]
            }
          },
          centroids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          centroidExplanation: { type: SchemaType.STRING }
        },
        required: ["concepts", "centroids", "centroidExplanation"]
      },
    },
  });

  const prompt = `Analiza el siguiente texto académico aplicando la lógica de "Gemini Maradon.ar":
    1. Identifica los conceptos (tokens) centrales.
    2. Para cada concepto, identifica sus "cualidades" (conceptos que lo definen por asociación en el texto).
    3. Busca los "Centroides" C que sinteticen las CUALIDADES encontradas (punto de afinidad de los embeddings de las cualidades, no de los tokens).
    4. Explica el trabajo original basándote estrictamente en estos centroides de cualidades.
    5. Asigna posiciones (x, y) a los conceptos basadas en su cercanía al centroide C.

    TEXTO:
    ${text}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
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
    INSTRUCCIÓN DE CONTROL: Prohibido usar jerga futbolística o lenguaje coloquial. 
    Actúa como un epistemólogo que opera sobre una topología de conceptos.

    BASES:
    - Cualidades extraídas: ${JSON.stringify(analysis.concepts)}
    - Centroides de afinidad (C): ${JSON.stringify(analysis.centroids)}

    OPERACIÓN LÓGICA:
    1. Define el opuesto funcional de los centroides (Negación ¬C).
    2. REFORMULACIÓN: Redacta una tesis académica que reconstruya el texto original bajo la óptica de ¬C, pero manteniendo las cualidades (a, b, c) de los conceptos originales.
    3. DEMOSTRACIÓN: Desarrolla una prueba lógica o matemática (ej: silogismo deductivo o relación de variables) que valide por qué ¬C es una estructura más estable que C.
    4. BIBLIOGRAFÍA: Cita autores reales que traten sobre la negación o la inversión de estas categorías.
    5. DESAFÍO: Pide al estudiante que formalice esta negación en una ecuación o modelo teórico.

    Sé riguroso, denso y profundamente académico.
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
