import express from 'express';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./game.db');

type GameScore = {
  id?: number;
  name: string;
  email: string;
  score: number;
};

type EmailCountResult = {
  count: number;
};

type ScoreCountResult = {
  count: number;
};

const apiRouter = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    const userData: GameScore = req.body;

    if (!userData.name || !userData.email || typeof userData.score !== 'number') {
      return res.status(400).json({ error: 'Invalid user data provided' });
    }

    const stmt = db.prepare('INSERT INTO gamescores (name, email, score) VALUES (?, ?, ?)');

    stmt.run([userData.name, userData.email, userData.score], async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      try {
        const getPosition = new Promise<ScoreCountResult>((resolve, reject) => {
          const positionQuery = 'SELECT COUNT(*) as count FROM gamescores WHERE score >= ?';
          db.get(positionQuery, [userData.score], (err, row: ScoreCountResult) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        const row = await getPosition;
        const position = row.count + 1;

        res.json({ position });
      } catch (positionError: unknown) {
        res.status(500);
      }
    });
  });

  router.get('/', (_req, res) => {
    const sql = 'SELECT * FROM gamescores ORDER BY score DESC LIMIT 20';
    db.all(sql, [], (err: Error | null, rows: GameScore[]) => {
      if (err) {
        throw err;
      }
      res.json(rows);
    });
  });

  router.get('/can-play', (req, res) => {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const sql = 'SELECT COUNT(*) as count FROM gamescores WHERE email = ?';

    db.get(sql, [email], (err, row: EmailCountResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const canPlay = row.count <= 3;

      res.json({ canPlay });
    });
  });

  return router;
};

export const createServer = () => {
  const app = express();

  app.use(morgan('dev')).use(express.json()).use('/', apiRouter());

  return app;
};
