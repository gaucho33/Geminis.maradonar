export enum Step {
  UPLOAD,
  ANALYZING,
  RESULT_CENTROID,
  GENERATING_TOKEN,
  FINAL_REFORMULATION
}

export interface Concept {
  token: string;
  qualities: string[];
  position: { x: number; y: number }; // <-- Obligatorio para la gráfica
  tensionValue: number;               // <-- Obligatorio para el tamaño
}

export interface AnalysisResult {
  centroids: string[];
  centroidExplanation: string;
  concepts: Concept[];
}

export interface MaradonTokenResult {
  token: string;
}
