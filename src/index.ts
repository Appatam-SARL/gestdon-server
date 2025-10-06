import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { redisClient } from './config/redis';
import swaggerSpec from './config/swagger';

import activityTypeRoutes from './routes/activity-type.routes';
import activityRoutes from './routes/activity.routes';
import { adminRoutes } from './routes/admin.routes';
import agendaroutes from './routes/agenda.routes';
import audienceRoutes from './routes/audience.routes';
import beneficiaryType from './routes/beneficiaire-type.routes';
import beneficiaireRoutes from './routes/beneficiaire.routes';
import categoryMouvementCheckoutRoutes from './routes/category-mouvement-checkout.routes';
import { chatRoutes } from './routes/chat.routes';
import commentRoutes from './routes/comment.route';
import contactRoutes from './routes/contact.routes';
import { contributorRoutes } from './routes/contributor.routes';
import customFieldRoutes from './routes/custom-field.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { documentRoutes } from './routes/document.routes';
import donRoutes from './routes/don.routes';
import fanRoutes from './routes/fan.routes';
import { fileRoutes } from './routes/file.routes';
import invoiceRoutes from './routes/invoice.routes';
import { logRoutes } from './routes/log.routes';
import { mediaRoutes } from './routes/media.routes';
import menuRoutes from './routes/menu.routes';
import mouvementCheckoutRoutes from './routes/mouvement-checkout.routes';
import notificationRoutes from './routes/notification.routes';
import packageRoutes from './routes/package.routes';
import permissionRoutes from './routes/permission.routes';
import postRoute from './routes/post.routes';
import promesseRoutes from './routes/promesse.routes';
import reportRoutes from './routes/report.routes';
import subscriptionRoutes from './routes/subscription.routes';
import typeMouvementCheckoutRoutes from './routes/type-mouvement-checkout.routes';
import { userRoutes } from './routes/user.routes';

import { CronManagerService } from './services/cron-manager.service';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { PaymentService } from './services/payment.service';
import { QueueService } from './services/queue.service';
import { SocketService } from './services/socket.service';
import { verifyEmailConnection } from './utils/email';
import { logger } from './utils/logger';
dotenv.config();
const VERSION = 'v1/api';

export const app = express();
const server = createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const allowedOrigins = [
  'https://unfragrantly-unharsh-jameson.ngrok-free.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gestdon-contrib-workspace.vercel.app',
  'http://10.0.2.2:19006', // Expo Go (Android Emulator)
  'http://10.0.2.2:5000', // si tu appelles directement API
  'http://127.0.0.1:19006', // Expo Go (iOS Simulator)
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans origin (ex: Postman) ou si l'origine est dans la liste
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'dev') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(morgan('dev'));

app.use(express.static('public'));

// Documentation API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.use(limiter);
// Routes
app.use(`/${VERSION}/admins`, adminRoutes);
app.use(`/${VERSION}/agendas`, agendaroutes);
app.use(`/${VERSION}/activities`, activityRoutes);
app.use(`/${VERSION}/audiences`, audienceRoutes);
app.use(`/${VERSION}/users`, userRoutes);
app.use(`/${VERSION}/fans`, fanRoutes);
app.use(`/${VERSION}/logs`, logRoutes);
app.use(`/${VERSION}/files`, fileRoutes);
app.use(`/${VERSION}/media`, mediaRoutes);
app.use(`/${VERSION}/documents`, documentRoutes);
app.use(`/${VERSION}/notifications`, notificationRoutes);
app.use(`/${VERSION}/chat`, chatRoutes);
app.use(`/${VERSION}/contributors`, contributorRoutes);
app.use(`/${VERSION}/permissions`, permissionRoutes);
app.use(`/${VERSION}/beneficiaires`, beneficiaireRoutes);
app.use(`/${VERSION}/dons`, donRoutes);
app.use(`/${VERSION}/promesses`, promesseRoutes);
app.use(`/${VERSION}/activity-types`, activityTypeRoutes);
app.use(`/${VERSION}/beneficiaire-types`, beneficiaryType);
app.use(`/${VERSION}/custom-fields`, customFieldRoutes);
app.use(`/${VERSION}/reports`, reportRoutes);
app.use(`/${VERSION}/dashboard`, dashboardRoutes);
app.use(`/${VERSION}/contacts`, contactRoutes);
app.use(`/${VERSION}/comments`, commentRoutes);
app.use(`/${VERSION}/posts`, postRoute);
app.use(`/${VERSION}/menus`, menuRoutes);
app.use(`/${VERSION}/packages`, packageRoutes);
app.use(`/${VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/${VERSION}/invoices`, invoiceRoutes);
app.use(`/${VERSION}/mouvements`, mouvementCheckoutRoutes);
app.use(`/${VERSION}/type-mouvement-checkouts`, typeMouvementCheckoutRoutes);
app.use(
  `/${VERSION}/category-mouvement-checkouts`,
  categoryMouvementCheckoutRoutes
);
// Initialiser Socket.io via le service uniquement
SocketService.initialize(server);

// Initialiser les files d'attente
(async () => {
  try {
    // Initialiser le service de file d'attente
    await QueueService.initialize();
    logger.system("Services de files d'attente initialisés avec succès");

    // Initialiser les workers
    EmailService.initializeWorker();

    const notificationService = new NotificationService();
    notificationService.initializeWorker();

    PaymentService.initializeWorker();

    logger.system("Workers des files d'attente initialisés avec succès");
  } catch (error) {
    logger.error("Erreur lors de l'initialisation des files d'attente:", error);
    // Ne pas interrompre le démarrage du serveur si les files d'attente échouent
  }
})();

logger.database(
  `${process.env.MONGODB_URI?.replace('env', process.env.NODE_ENV || 'dev')}`
);

const startServer = async () => {
  try {
    // Vérifier la connexion email
    await verifyEmailConnection();

    // Connexion à MongoDB
    if (process.env.NODE_ENV !== 'test') {
      mongoose
        .connect(
          `${process.env.MONGODB_URI?.replace(
            'env',
            process.env.NODE_ENV || 'dev'
          )}`,
          {
            serverSelectionTimeoutMS: 30000,
          }
        )
        .then(() => {
          logger.database('Connected to MongoDB');

          // Démarrer le serveur
          const PORT = process.env.PORT || 3000;
          server.listen(PORT, () => {
            logger.system(`Serveur démarré sur le port ${PORT}`);

            // Vérification de la connexion à Redis
            redisClient
              .ping()
              .then(() => {
                logger.redis('Connexion à Redis établie');
              })
              .catch((error) => {
                logger.error('Erreur de connexion Redis:', error);
              });

            // Vérification de la configuration SMTP
            EmailService.verifyConnection().then((isValid) => {
              if (isValid) {
                logger.email('Configuration SMTP vérifiée avec succès');
              } else {
                logger.error('Erreur de configuration SMTP');
              }
            });

            // Démarrer les tâches automatiques de gestion des abonnements
            CronManagerService.startAllCronJobs();
          });
        })
        .catch((error) => {
          logger.error('Error connecting to MongoDB:', error);
        });
    }
  } catch (error) {
    logger.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// const startServer = async () => {
//   try {
//     // Vérifier la connexion email
//     await verifyEmailConnection();

//     // Connexion à MongoDB
//     const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/gescomdb';
//     mongoose
//       .connect(mongoUri)
//       .then(() => {
//         logger.database('Connected to MongoDB');

//         // Démarrer le serveur
//         const PORT = process.env.PORT || 5000;
//         server.listen(PORT, () => {
//           logger.system(`Serveur démarré sur le port ${PORT}`);

//           // Vérification de la connexion à Redis
//           redisClient
//             .ping()
//             .then(() => {
//               logger.redis('Connexion à Redis établie');
//             })
//             .catch((error) => {
//               logger.error('Erreur de connexion Redis:', error);
//             });

//           // Vérification de la configuration SMTP
//           EmailService.verifyConnection().then((isValid) => {
//             if (isValid) {
//               logger.email('Configuration SMTP vérifiée avec succès');
//             } else {
//               logger.error('Erreur de configuration SMTP');
//             }
//           });
//         });
//       })
//       .catch((error) => {
//         logger.error('Error connecting to MongoDB:', error);
//       });
//   } catch (error) {
//     logger.error('Erreur au démarrage du serveur:', error);
//     process.exit(1);
//   }
// };

startServer();

// Gestion des erreurs globale
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
);

// Ajoutons une gestion propre de la fermeture
const gracefulShutdown = () => {
  logger.system("🔴 Signal d'arrêt reçu. Fermeture du serveur...");

  // Arrêter les tâches automatiques
  CronManagerService.stopAllCronJobs();

  // Récupérer l'instance de Socket.io depuis le service
  const socketIo = SocketService.getInstance();

  // Fermer proprement les connexions
  if (socketIo) {
    logger.system('📡 Fermeture des connexions WebSocket...');
    socketIo.close();
  }

  // Fermer le serveur HTTP
  server.close(() => {
    logger.system('🌐 Serveur HTTP fermé.');

    // Fermer la connexion à la base de données
    if (mongoose.connection.readyState === 1) {
      // 1 = connecté
      mongoose.connection
        .close()
        .then(() => {
          logger.database('📦 Connexion MongoDB fermée.');
          logger.success('✅ Arrêt propre terminé.');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('❌ Erreur lors de la fermeture de MongoDB:', err);
          process.exit(1);
        });
    } else {
      logger.database('📦 MongoDB déjà déconnecté.');
      logger.success('✅ Arrêt propre terminé.');
      process.exit(0);
    }
  });

  // Si le serveur ne se ferme pas dans les 10 secondes, forcer l'arrêt
  setTimeout(() => {
    logger.error("⚠️ Fermeture forcée après délai d'attente.");
    process.exit(1);
  }, 10000);
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGHUP', gracefulShutdown);
