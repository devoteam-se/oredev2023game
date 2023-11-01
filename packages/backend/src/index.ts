import { createServer } from './server';
import express from 'express';

const server = createServer();

const prepend = express();
prepend.use('/api', server);

const port = parseInt(process.env.PORT || '3000');

prepend.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
