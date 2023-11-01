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

const apiRouter = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    const userData: GameScore = req.body;

    if (!userData.name || !userData.email || typeof userData.score !== 'number') {
      return res.status(400).json({ error: 'Invalid user data provided' });
    }

    const stmt = db.prepare('INSERT INTO gamescores (name, email, score) VALUES (?, ?, ?)');

    stmt.run([userData.name, userData.email, userData.score], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
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
  return router;
};

export const createServer = () => {
  const app = express();

  app.use(morgan('dev')).use(express.json()).use('/', apiRouter());

  return app;
};
