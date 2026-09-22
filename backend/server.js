// ── TIMEZONE: must be set before any date operations ──────────────────────────
process.env.TZ = process.env.TZ || 'Asia/Kolkata';

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import { initSocket } from './config/socket.js';

import userRouter from './routes/userRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import adminRouter from './routes/adminRoute.js';
import superAdminRouter from './routes/superAdminRoute.js';
import salonAdminRouter from './routes/salonAdminRoute.js';
import shopRouter from './routes/shopRoute.js';

import {
  startAppointmentCompletionCron,
  completePastAppointments,
} from './utils/appointmentCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── APP CONFIG ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 4000;

// ── DATABASE ────────────────────────────────────────────────────────────────
connectDB().then(async () => {
  console.log('✅ Database connected successfully');
  await completePastAppointments();
  startAppointmentCompletionCron();
});

// ── CLOUDINARY ──────────────────────────────────────────────────────────────
connectCloudinary();

// ── SWAGGER ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salon Booking API',
      version: '1.0.0',
      description: 'API documentation for Salon Booking Application',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL
            : `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
  ...(process.env.EXTRA_CLIENT_URLS || '').split(',').map((u) => u.trim()),
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn('CORS blocked for origin:', origin);
      return callback(new Error('CORS blocked'), false);
    },
    credentials: true,
  })
);

app.set('trust proxy', 1);

// ── SWAGGER ROUTE ────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/salon-admin', salonAdminRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/shop', shopRouter);
app.use('/api/doctor', doctorRouter);

// ── STATIC FILES ─────────────────────────────────────────────────────────────
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('✅ Salon Booking API is running');
});

// ── SOCKET.IO ────────────────────────────────────────────────────────────────
initSocket(httpServer, allowedOrigins);

// ── START SERVER ─────────────────────────────────────────────────────────────
httpServer.listen(port, () => {
  console.log(`🚀 Server started on PORT: ${port}`);
});
