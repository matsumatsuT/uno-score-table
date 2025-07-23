import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { gameRouter } from './routes/gameRouter';

const app = express();
const PORT = process.env.PORT || 9999;

app.use(cors({
  origin: 'http://localhost:3333',
  credentials: true,
}));

app.use(express.json());

app.use(
  '/trpc',
  createExpressMiddleware({
    router: gameRouter,
    createContext: ({ req, res }) => ({
      req,
      res,
    }),
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'UNO Score Table API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`tRPC endpoint: http://localhost:${PORT}/trpc`);
});