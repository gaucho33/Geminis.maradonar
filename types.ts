
export interface Concept {
  token: string;
  qualities: string[];
}

export interface AnalysisResult {
  concepts: Concept[];
  centroids: string[];
  centroidExplanation: string;
}

export interface MaradonTokenResult {
  negatedCentroids: string[];
  reformulation: string;
  demonstration: string;
  suggestedBibliography: string[];
  challengeForStudent: string;
}

export enum Step {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULT_CENTROID = 'RESULT_CENTROID',
  GENERATING_TOKEN = 'GENERATING_TOKEN',
  FINAL_REFORMULATION = 'FINAL_REFORMULATION'
}
