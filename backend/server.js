// backend/server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

import userRouter from './routes/userRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import adminRouter from './routes/adminRoute.js';

import passport from './config/passport.js';
import authRouter from './routes/authRoutes.js';

import {
  startAppointmentCompletionCron,
  completePastAppointments,
} from './utils/appointmentCron.js';

// ── APP CONFIG ──────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 4000;

// ── DATABASE ────────────────────────────────────────────────────────────────
connectDB().then(async () => {
  console.log('✅ Database connected successfully');
  await completePastAppointments();
  startAppointmentCompletionCron();
});

// ── CLOUDINARY ──────────────────────────────────────────────────────────────
connectCloudinary();

// ── STARTUP ENV CHECK (safe — no secrets printed) ───────────────────────────
console.log('TWILIO SID present    :', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO TOKEN present  :', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO PHONE present  :', !!process.env.TWILIO_PHONE_NUMBER);
console.log('GOOGLE CLIENT ID      :', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE CALLBACK URL   :', process.env.GOOGLE_CALLBACK_URL);
console.log('CLIENT URL            :', process.env.CLIENT_URL);

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

// ── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(express.json());

// ✅ FIXED: Use env var for allowed origins — easy to extend for new deployments
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL, // frontend (prod)
  process.env.ADMIN_CLIENT_URL, // admin panel (prod) — add to .env
  // Supports multiple comma-separated origins, e.g. Vercel domain + custom subdomain
  ...(process.env.EXTRA_CLIENT_URLS || '').split(',').map((url) => url.trim()),
].filter(Boolean); // removes undefined/empty if env vars not set

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server calls (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn('CORS blocked for origin:', origin);
      return callback(new Error('CORS blocked'), false);
    },
    credentials: true,
  })
);

// ✅ Required for Vercel/Render — trust proxy headers
app.set('trust proxy', 1);

// ✅ Passport — must be AFTER express.json() and cors
app.use(passport.initialize());

// ── SWAGGER ROUTE ────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/auth', authRouter); // Google OAuth + Forgot Password OTP

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('✅ Salon Booking API is running');
});

// ── START SERVER ─────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 Server started on PORT: ${port}`);
});
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve uploaded images statically
app.use('/images', express.static(path.join(__dirname, 'uploads')))
