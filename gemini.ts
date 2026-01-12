import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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
                    properties: { x: { type: SchemaType.NUMBER }, y: { type: SchemaType.NUMBER } },
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
  ROL: Epistemólogo, Traductor de Vecindades y Analista de Sistemas Complejos.
  
  TAREA UNIFICADA:
  1. ANÁLISIS DE TORSIÓN: Identifica las cualidades (a, b, c) del texto y calcula el centroide C.
  2. NEGACIÓN (EL TOKEN): Realiza la inversión ontológica ¬C para estresar la tesis original.
  3. SÍNTESIS (LA TERCERA VÍA): Resuelve la contradicción entre C y ¬C. Propón una "Inmanencia Relacional" donde el sentido sea un evento emergente (Producto Tensorial) entre el contenedor social y el contenido inmanente.
  
  FORMATO DE RESPUESTA (JSON):
  - summary: Resumen riguroso del corpus.
  - concepts: Array de tokens con cualidades y coordenadas (x, y).
  - tokenData: {
      negatedCentroids: ["Cualidad 1", "Cualidad 2"],
      reformulation: "Tesis de la Síntesis (mínimo 150 palabras, tono académico elevado)",
      demonstration: "Estructura lógica formal usando notación matemática (Φ = C ⊗ c)",
      suggestedBibliography: ["Autor - Obra (Relacionado a la síntesis)"]
    }

  RESTRICCIÓN: Prohibido lenguaje coloquial. El tono debe ser el de un 'Paper' de Filosofía de la Técnica.
  
  TEXTO: ${text}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}') + 1;
    return JSON.parse(responseText.substring(start, end));

  } catch (error) {
    console.error("Error en performUnifiedInterpellation:", error);
    throw error;
  }
};
