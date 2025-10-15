import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import './db/index.js';
import authRouter from './routes/auth.js';
import jobsRouter from './routes/jobs.js';
import applicationsRouter from './routes/applications.js';
import profilesRouter from './routes/profiles.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';
import institutionsRouter from './routes/institutions.js';
import feedbackRouter from './routes/feedback.js';
import savedRouter from './routes/saved.js';
import timelineRouter from './routes/timeline.js';
import aiRouter from './routes/ai.js';
import paymentsRouter from './routes/payments.js';
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

// Health endpoint for client base discovery
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/saved', savedRouter);
app.use('/api', timelineRouter);
app.use('/api', aiRouter);
app.use('/api/payments', paymentsRouter);

app.use((err, req, res, next) => { // eslint-disable-line
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error'});
});

export default app;
