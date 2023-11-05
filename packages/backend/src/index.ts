import { createServer } from './server';
import express from 'express';
import cors from 'cors';

const server = createServer();

const prepend = express();
prepend.use(cors());
prepend.use('/api', server);

const port = parseInt(process.env.PORT || '3000');

prepend.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
