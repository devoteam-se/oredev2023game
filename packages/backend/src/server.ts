import express from 'express';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./game.db');

type GameScore = {
  id?: number;
  position: number;
  name: string;
  email: string;
  score: number;
  canContact: boolean;
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

    const stmt = db.prepare('INSERT INTO gamescores (name, email, score, can_contact) VALUES (?, ?, ?, ?)');

    try {
      stmt.run([userData.name, userData.email, userData.score, userData.canContact], async (err) => {
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
    } catch (err) {
      console.error(err);
    }
  });

  router.get('/', (req, res) => {
    let sql;

    const rankingSubquery = `
    SELECT
      id,
      name,
      email,
      score,
      RANK() OVER (ORDER BY score DESC, id ASC) AS position
    FROM gamescores
  `;

    if (req.query.type === 'recent') {
      sql = `
      WITH RankedScores AS (${rankingSubquery})
      SELECT * FROM (
        SELECT * FROM RankedScores
        ORDER BY id DESC
        LIMIT 10
      ) ORDER BY id DESC
    `;
    } else {
      // 'top' is the default behavior
      sql = `
      SELECT * FROM (${rankingSubquery}) 
      ORDER BY position ASC 
      LIMIT 10
    `;
    }

    db.all(sql, [], (err: Error | null, rows: GameScore[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  router.get('/', (req, res) => {
    const orderBy = req.query.orderBy === 'id' ? 'id' : 'score';

    const sql = `
    SELECT
      *,
      ROW_NUMBER() OVER (ORDER BY ${orderBy} DESC) as position
    FROM gamescores
    ORDER BY ${orderBy} DESC
    LIMIT 20
  `;

    db.all(sql, [], (err: Error | null, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
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
