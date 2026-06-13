import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import billingRoutes from './routes/billingRoutes';
import reportRoutes from './routes/reportRoutes';
import publicRoutes from './routes/publicRoutes';
import availabilityRoutes from './routes/availabilityRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// ── Trust proxy ────────────────────────────────────────────────────────────
// Required so that req.ip returns the real client IP when behind Nginx,
// a cloud load balancer, or a reverse proxy (reads X-Forwarded-For).
app.set('trust proxy', 1);

// ── Core middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://rajdental.com', 'https://app.rajdental.com'],
  credentials: true   // Required: allows the browser to send/receive cookies cross-origin
}));
app.use(express.json());

// ── Cookie parser ──────────────────────────────────────────────────────────
// Must be registered BEFORE routes so req.cookies is populated.
// Powers the HttpOnly session cookie (sid) used by slot reservation.
app.use(cookieParser());

// ── Global rate limiting ───────────────────────────────────────────────────
// General guard: 200 requests per 15 minutes per IP.
// The slot reservation endpoint has its own stricter limiter (10 req/min)
// applied at the route level in publicRoutes.ts.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ── Mount routes ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/availability', availabilityRoutes);

// ── Error handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
