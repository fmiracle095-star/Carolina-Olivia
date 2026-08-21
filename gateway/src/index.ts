import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { mellyRouter } from './routes/melly';
import { systemRouter } from './routes/system';
import { errorHandler } from './middleware/error';

const app = express();

app.use(helmet());

const allowedOrigins = [
  'https://carolina-olivia.vercel.app',
  ...(env.FRONTEND_ORIGIN ? [env.FRONTEND_ORIGIN] : [])
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.run.app')) {
      callback(null, origin || true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/api/v1/melly', mellyRouter);
app.use('/api/v1/system', systemRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`[GATEWAY] Secure service listening on port ${env.PORT}`);
  });
}

export default app;
