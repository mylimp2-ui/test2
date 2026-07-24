import { Question } from './types';

export const sampleQuestions: Question[] = [
  {
    id: 1,
    text: "프랑스의 수도는 어디인가요?",
    options: ["런던", "베를린", "파리", "마드리드"],
    answerIndex: 2,
    explanation: "파리는 프랑스의 수도이자 가장 큰 도시입니다."
  },
  {
    id: 2,
    text: "붉은 행성으로 알려진 행성은 무엇인가요?",
    options: ["금성", "화성", "목성", "토성"],
    answerIndex: 1,
    explanation: "화성은 표면의 산화철(녹) 때문에 붉은빛을 띠어 붉은 행성이라고 불립니다."
  },
  {
    id: 3,
    text: "2 + 2는 무엇인가요?",
    options: ["3", "4", "5", "6"],
    answerIndex: 1,
    explanation: "2와 2를 더하면 4가 됩니다."
  },
];
