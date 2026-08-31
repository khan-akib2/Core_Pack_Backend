import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { xssSanitizer } from './middleware/xss.js';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import challanRoutes from './routes/challanRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import counterRoutes from './routes/counterRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

app.set('trust proxy', 1);

app.disable('x-powered-by');

// Setup morgan to pipe to winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: { write: (message) => logger.info(message.trim()) } }));

app.use(compression());

const whitelist = process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://10.0.2.2:3000',
  'https://core-pack-india.vercel.app'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, 
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { status: 'Error', message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // allow 3 requests per 15 minutes, then...
  delayMs: (hits) => (hits - 3) * 500, // add 500ms of delay per request above 3
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP
  message: { status: 'Error', message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth/login', authSpeedLimiter, authLimiter);

app.use(express.json({ limit: '1mb' })); 
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(xssSanitizer);
app.use(hpp());

app.get('/', (req, res) => {
  res.status(200).send('Core Pack India API is running');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Core Pack India Engine',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/challans', challanRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/counters', counterRoutes);
app.use('/api/v1/backups', backupRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

app.use(errorHandler);

export default app;
