
export interface GeminiResult {
  garmentDescription: string;
  personDescription: string;
  technicalPrompt: string;
  bodySize?: 'S' | 'M' | 'L';
  resultImageUrl?: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  error?: string;
  stylingSuggestions?: {
    suggestedPants?: string;
    suggestedShoes?: string;
    suggestedShirt?: string;
    styleVibe?: string;
  };
}

export interface PaperSection {
  title: string;
  content: string;
  icon: string;
}

export interface ImageUploads {
  person: string | null;
  top: string | null;
  bottom: string | null;
  dress: string | null;
}

export type Gender = 'MEN' | 'WOMEN';
