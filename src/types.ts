export interface StudentSession {
  classCode: string;
  studentCode: string;
}

export interface Question {
  id: string;
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizData {
  quiz_title: string;
  questions: Question[];
}
