import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../index';
import Contributor from '../models/contributor.model';
import PackageModel from '../models/package.model';
import SubscriptionModel from '../models/subscription.model';
import { User } from '../models/user.model';

describe('Subscription Status Check', () => {
  let testUser: any;
  let testContributor: any;
  let testPackage: any;
  let authToken: string;

  beforeAll(async () => {
    // Créer un package de test
    testPackage = await PackageModel.create({
      name: 'Test Package',
      description: 'Package de test',
      price: '0',
      features: ['Feature 1', 'Feature 2'],
      duration: 30,
      durationUnit: 'days',
      autoRenewal: false,
      maxUsers: 5,
      isPopular: false,
      isFree: true,
      maxFreeTrialDuration: 30,
      isActive: true,
    });

    // Créer un contributeur de test
    testContributor = await Contributor.create({
      name: 'Test Contributor',
      email: 'test@contributor.com',
      address: {
        street: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country',
      },
      fieldOfActivity: 'TEST',
      status: 'active',
    });

    // Créer un utilisateur de test
    testUser = await User.create({
      email: 'test@user.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'user',
      contributorId: testContributor._id,
      password: 'testpassword123',
    });

    // Générer un token JWT pour l'utilisateur
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { id: testUser._id, type: 'user', role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await User.findByIdAndDelete(testUser._id);
    await Contributor.findByIdAndDelete(testContributor._id);
    await PackageModel.findByIdAndDelete(testPackage._id);
    await SubscriptionModel.deleteMany({ contributorId: testContributor._id });
    await mongoose.connection.close();
  });

  describe('GET /api/subscriptions/check-status', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/subscriptions/check-status')
        .expect(401);

      expect(response.body.message).toBe('Token manquant');
    });

    it('should return user subscription status when authenticated', async () => {
      const response = await request(app)
        .get('/api/subscriptions/check-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasContributor).toBe(true);
      expect(response.body.data.hasActiveSubscription).toBe(false);
      expect(response.body.data.user.id).toBe(testUser._id.toString());
    });

    it('should return active subscription when user has one', async () => {
      // Créer une souscription active
      const subscription = await SubscriptionModel.create({
        contributorId: testContributor._id,
        packageId: testPackage._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        status: 'active',
        paymentStatus: 'paid',
        amount: 0,
        currency: 'XOF',
        autoRenewal: false,
        isFreeTrial: true,
      });

      const response = await request(app)
        .get('/api/subscriptions/check-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasActiveSubscription).toBe(true);
      expect(response.body.data.subscription).toBeDefined();

      // Nettoyer
      await SubscriptionModel.findByIdAndDelete(subscription._id);
    });

    it('should handle user without contributor', async () => {
      // Créer un utilisateur sans contributeur
      const userWithoutContributor = await User.create({
        email: 'no-contributor@user.com',
        firstName: 'No',
        lastName: 'Contributor',
        phone: '+0987654321',
        role: 'user',
        password: 'testpassword123',
      });

      const jwt = require('jsonwebtoken');
      const tokenWithoutContributor = jwt.sign(
        { id: userWithoutContributor._id, type: 'user', role: 'user' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/subscriptions/check-status')
        .set('Authorization', `Bearer ${tokenWithoutContributor}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasContributor).toBe(false);
      expect(response.body.data.hasActiveSubscription).toBe(false);

      // Nettoyer
      await User.findByIdAndDelete(userWithoutContributor._id);
    });
  });
});
