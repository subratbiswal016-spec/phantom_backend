import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { connectDB } from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';
import { syncAllVipCaches } from './src/services/redis.service.js';
import { startSchedulerService } from './src/services/scheduler.service.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import vipRoutes from './src/routes/vip.routes.js';
import invisibleRoutes from './src/routes/invisible.routes.js';
import callsRoutes from './src/routes/calls.routes.js';
import scheduleRoutes from './src/routes/schedule.routes.js';
import webhookRoutes from './src/routes/webhook.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';
import subscriptionRoutes from './src/routes/subscription.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ============= MIDDLEWARE =============
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ============= ROUTES =============

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '👻 Phantom API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/invisible', invisibleRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscription', subscriptionRoutes);

// ============= ERROR HANDLER =============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Sync VIP caches to Redis
    await syncAllVipCaches();

    // Start scheduler for auto-invisible
    startSchedulerService();

    // Start HTTP + WebSocket server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('👻 ═══════════════════════════════════════');
      console.log(`👻  PHANTOM SERVER v1.0.0`);
      console.log(`👻  Running in ${process.env.NODE_ENV} mode`);
      console.log(`👻  Port: ${PORT}`);
      console.log(`👻  http://localhost:${PORT}/api/health`);
      console.log('👻 ═══════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
