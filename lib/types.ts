// export interface Flashcard {
//   id: string
//   front: string
//   back: string
//   deck_id: string
//   created_at: string
//   review_count: number
//   last_reviewed: string | null
//   next_review: string | null
//   ease_factor: number
// }

export interface Deck {
  id: string
  title: string
  description: string | null
  user_id: string
  created_at: string
  is_public: boolean
}

export interface FlashcardResponse {
  flashcards: Flashcard[]
}

export interface APIError {
  error: string
}
export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'txt' | 'docx' | 'image';
  pageCount?: number;
  uploadedAt: string;
  userId: string;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  documentId: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionGenRequest {
  documentId: string;
  pageNumber?: number;
  topic?: string;
  count?: number;
}

export interface ProcessedDocument {
  content: string;
  pageCount?: number;
  type: Document['type'];
}
export interface Flashcard {
  id: string
  front: string
  back: string
  review_count?: number
  last_reviewed?: string
  next_review?: string
  ease_factor?: number
}

export interface StudyModeProps {
  flashcards: Flashcard[]
  deckId: string
}

export type Difficulty = 1 | 2 | 3 | 4

export interface ReviewData {
  user_id: string
  flashcard_id: string
  difficulty: Difficulty
  time_taken: number
}

export interface ProcessedDocument {
  content: string
  type: 'pdf' | 'txt' | 'docx' | 'image'
  metadata?: Record<string, any>
}

export interface DocumentChunk {
  text: string
  metadata: {
    pageNumber?: number
    source?: string
  }
}

export interface DocumentProcessorProps {
  onUploadComplete?: (document: ProcessedDocument) => void
  onError?: (error: Error) => void
  onProgress?: (progress: number) => void
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
}

export interface DocumentChunk {
  text: string
  metadata: {
    pageNumber?: number
    source?: string
  }
}
// types/quiz.ts
// types/quiz.ts
export interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  type: 'multiple_choice' | 'true_false' | 'open-ended';
}

export interface QuizResult {
  user_id: string;
  document_id: string;
  score: number;
  total_questions: number;
  answers: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  completed_at: Date;
}