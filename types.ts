
export interface NutritionalInfo {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  weight?: string; // Adicionado peso
  vitamins?: string[]; // Adicionado Vitaminas
  minerals?: string[]; // Adicionado Minerais
}

export interface Recipe {
  title: string;
  description: string; // The "speech" summary or intro text
  ingredients: string[];
  instructions: string[];
  nutritionalInfo: NutritionalInfo;
  tips: string[];
  imageKeywords?: string[];
}

export interface FoodAnalysis {
  imageUri: string; // Base64 or Blob URL to display the image
  description: string; // Analysis text
  nutritionalInfo: NutritionalInfo;
  suggestedRecipe?: Recipe; // Optional recipe suggestions
  timestamp?: number; // Added for history tracking
}

export interface ChatMessage {
  text: string;
}

export interface HistoryItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type DisplayMode = 'payment' | 'onboarding' | 'welcome' | 'analysis';

export interface AppState {
  mode: DisplayMode;
  userGoal: string; // Armazena o objetivo do usuário
  currentAnalysis: FoodAnalysis | null;
  loading: boolean;
  error: string | null;
}
