import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult, MaradonTokenResult } from '../types';

// Conexión con la identidad de tu API configurada en Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * PRIMER PASO: Negación de Centroides y Análisis de la Base Común
 */
export const analyzeTextForMaradona = async (text: string): Promise<AnalysisResult> => {
  // Configuramos el modelo para que devuelva un JSON estructurado
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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
                qualities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              }
            }
          },
          centroids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          centroidExplanation: { type: SchemaType.STRING }
        }
      }
    },
    systemInstruction: `Eres el Tutor Académico de Gemini Maradon.ar. 
    Tu tarea es realizar un Análisis No-Lineal. 
    1. Identifica la 'base común' entre los documentos del corpus.
    2. Aplica la 'negación de los centroides': no te quedes con lo obvio (el poder o el estatus), busca el significado latente que surge de la curiosidad y el asombro infantil.
    3. Devuelve una explicación poética pero académica del centroide encontrado.`
  });

  const prompt = `Interpela este corpus heterogéneo y encuentra su base común no-lineal: ${text}`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

/**
 * SEGUNDO PASO: Generación del Token Maradon.ar (La imagen pulida)
 */
export const generateMaradonToken = async (text: string, analysis: AnalysisResult): Promise<MaradonTokenResult> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro", // Usamos Pro para la síntesis final profunda
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: `Como fase final de la interpelación, debes crear el 'Token Maradon.ar'. 
    Este token es la síntesis de la negación de los centroides sociales. 
    Debe sonar como un descubrimiento asombroso que devuelve al sujeto a su estado de curiosidad pura.`
  });

  const prompt = `Basado en el análisis previo (${JSON.stringify(analysis)}), reformula el corpus original en un Token Maradon.ar único: ${text}`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
