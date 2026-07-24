import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const DB_FILE = path.join(process.cwd(), 'database.json');
const QUESTIONS_FILE = path.join(process.cwd(), 'questions.json');

// Initialize questions.json if it doesn't exist
const defaultQuestions = {
  "quiz_title": "1차 형성평가",
  "questions": [
    {
      "id": "Q1",
      "question": "프랑스의 수도는 어디인가요?",
      "choices": ["런던", "베를린", "파리", "마드리드"],
      "correct_index": 2,
      "explanation": "파리는 프랑스의 수도이자 가장 큰 도시입니다."
    },
    {
      "id": "Q2",
      "question": "붉은 행성으로 알려진 행성은 무엇인가요?",
      "choices": ["금성", "화성", "목성", "토성"],
      "correct_index": 1,
      "explanation": "화성은 표면의 산화철(녹) 때문에 붉은빛을 띠어 붉은 행성이라고 불립니다."
    },
    {
      "id": "Q3",
      "question": "물의 끓는점은 1기압에서 몇 도인가요?",
      "choices": ["0℃","50℃","100℃","200℃"],
      "correct_index": 2,
      "explanation": "물의 끓는점은 1기압(atm)에서 100℃ 입니다."
    }
  ]
};

async function getQuestions() {
  try {
    const data = await fs.readFile(QUESTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(defaultQuestions, null, 2));
    return defaultQuestions;
  }
}

async function getDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { responses: [] };
  }
}

async function saveDb(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limit just in case
  app.use(express.json({ limit: '10mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/questions", async (req, res) => {
    const questions = await getQuestions();
    res.json({ success: true, data: questions });
  });

  app.post("/api/submit", async (req, res) => {
    try {
      const { classCode, studentCode, answers } = req.body;
      const questionsData = await getQuestions();
      const questions = questionsData.questions;
      
      let score = 0;
      const total = questions.length;
      
      const db = await getDb();
      const now = new Date().toISOString();
      const results = [];

      for (const q of questions) {
        const isCorrect = answers[q.id] === q.correct_index;
        if (isCorrect) score += 1;
        
        const record = {
          id: randomUUID(),
          classCode,
          studentCode,
          questionId: q.id,
          selectedAnswer: answers[q.id],
          correctAnswer: q.correct_index,
          isCorrect,
          submittedAt: now
        };
        
        db.responses.push(record);
        
        results.push({
          id: q.id,
          text: q.question,
          options: q.choices,
          explanation: q.explanation,
          isCorrect,
          userAnswer: answers[q.id],
          correctAnswer: q.correct_index
        });
      }

      await saveDb(db);
      res.json({ success: true, score, total, results });
    } catch (error) {
      console.error('Submit error:', error);
      res.status(500).json({ error: 'Failed to process results' });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { code } = req.body;
    if (code === 'teacher123') {
      res.json({ success: true, token: 'admin-token-123' });
    } else {
      res.status(401).json({ success: false, error: '잘못된 관리자 코드입니다.' });
    }
  });

  app.get("/api/admin/data", async (req, res) => {
    const db = await getDb();
    const questionsData = await getQuestions();
    res.json({ success: true, responses: db.responses, questions: questionsData });
  });

  app.post("/api/admin/reset", async (req, res) => {
    await saveDb({ responses: [] });
    res.json({ success: true });
  });
  
  app.post("/api/admin/questions", async (req, res) => {
    try {
      await fs.writeFile(QUESTIONS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
