import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Usamos el modelo más capaz para asegurar la precisión en la torsión dialéctica
const MODEL_NAME = "gemini-2.0-flash"; 

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
                  resonance: { type: SchemaType.NUMBER }, // Escala 1-10 para la pulsación de esperanza
                  isNegated: { type: SchemaType.BOOLEAN }, // True para puntos de fricción/enajenación
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
                required: ["token", "resonance", "isNegated", "qualities", "position"]
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
      
      CONTEXTO FILOSÓFICO:
      Opera bajo la tesis de la "Inmanencia Relacional". El sentido no preexiste, es un Producto Tensorial (Φ = C ⊗ c) entre el Contenedor Social (C) y el Contenido Inmanente (c).
      
      TAREA UNIFICADA:
      1. ANÁLISIS DE TORSIÓN: Identifica las categorías dialécticas fundamentales del texto.
      2. MAPEO DE VECINDAD: Asigna coordenadas (x, y) donde la cercanía indique afinidad semántica. 
      3. RESONANCIA: Define 'resonance' (1-10) según la potencia transformadora del concepto. Un valor > 8 activará la "Esperanza Activa".
      4. NEGACIÓN (EL TOKEN): Identifica conceptos de 'enajenación' o 'trabajo muerto' y márcalos como 'isNegated: true'. Realiza la inversión ontológica ¬C para estresar la tesis original.
      5. SÍNTESIS: Resuelve la contradicción entre el texto y su negación. Propón una reformulación que devuelva al sujeto al estado de 'Asombro Infantil' libre de estatus.

      FORMATO DE RESPUESTA (JSON):
      - summary: Resumen riguroso en tono de 'Paper' académico.
      - concepts: Tokens con sus metadatos de posición y resonancia.
      - tokenData: {
          negatedCentroids: ["Lo que se niega del texto original"],
          reformulation: "Tesis de la Síntesis (Mínimo 150 palabras, profundidad ontológica)",
          demonstration: "Estructura lógica formal (ej: Φ = C ⊗ ¬P → Unicidad)",
          suggestedBibliography: ["Autor - Obra"]
        }

      RESTRICCIÓN: Queda estrictamente prohibido el lenguaje coloquial.
      
      TEXTO A INTERPELAR: ${text}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpieza de seguridad para asegurar un JSON válido
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}') + 1;
    const jsonString = responseText.substring(start, end);
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error en la Interpelación Unificada:", error);
    throw error;
  }
};
