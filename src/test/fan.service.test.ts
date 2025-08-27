// import mongoose from 'mongoose';
// import { FanService } from '../services/fan.service';
// import Fan from '../models/fan.model';

// describe('FanService', () => {
//   beforeAll(async () => {
//     // Connexion à la base de test
//     await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test');
//   });

//   afterAll(async () => {
//     // Fermeture de la connexion
//     await mongoose.connection.close();
//   });

//   beforeEach(async () => {
//     // Nettoyer la base de données avant chaque test
//     await Fan.deleteMany({});
//   });

//   describe('createFan', () => {
//     it('should create a new fan successfully', async () => {
//       const fanData = {
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password123',
//         phoneNumber: '+1234567890',
//       };

//       const fan = await FanService.createFan(fanData);

//       expect(fan).toBeDefined();
//       expect(fan.username).toBe(fanData.username);
//       expect(fan.email).toBe(fanData.email.toLowerCase());
//       expect(fan.phoneNumber).toBe(fanData.phoneNumber);
//       expect(fan.password).not.toBe(fanData.password); // Le mot de passe doit être hashé
//       expect(fan.isProfileComplete).toBe(false);
//     });

//     it('should throw error if email already exists', async () => {
//       const fanData1 = {
//         username: 'user1',
//         email: 'test@example.com',
//         password: 'password123',
//       };

//       const fanData2 = {
//         username: 'user2',
//         email: 'test@example.com',
//         password: 'password456',
//       };

//       await FanService.createFan(fanData1);

//       await expect(FanService.createFan(fanData2)).rejects.toThrow(
//         'Un utilisateur avec cet email, username ou numéro de téléphone existe déjà'
//       );
//     });

//     it('should throw error if username already exists', async () => {
//       const fanData1 = {
//         username: 'testuser',
//         email: 'user1@example.com',
//         password: 'password123',
//       };

//       const fanData2 = {
//         username: 'testuser',
//         email: 'user2@example.com',
//         password: 'password456',
//       };

//       await FanService.createFan(fanData1);

//       await expect(FanService.createFan(fanData2)).rejects.toThrow(
//         'Un utilisateur avec cet email, username ou numéro de téléphone existe déjà'
//       );
//     });
//   });

//   describe('authenticateFan', () => {
//     beforeEach(async () => {
//       // Créer un fan pour les tests d'authentification
//       await FanService.createFan({
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password123',
//         phoneNumber: '+1234567890',
//       });
//     });

//     it('should authenticate fan with email successfully', async () => {
//       const result = await FanService.authenticateFan('test@example.com', 'password123');

//       expect(result.fan).toBeDefined();
//       expect(result.token).toBeDefined();
//       expect(result.fan.username).toBe('testuser');
//     });

//     it('should authenticate fan with phone number successfully', async () => {
//       const result = await FanService.authenticateFan('+1234567890', 'password123');

//       expect(result.fan).toBeDefined();
//       expect(result.token).toBeDefined();
//       expect(result.fan.username).toBe('testuser');
//     });

//     it('should throw error for invalid password', async () => {
//       await expect(
//         FanService.authenticateFan('test@example.com', 'wrongpassword')
//       ).rejects.toThrow('Identifiants invalides');
//     });

//     it('should throw error for non-existent email', async () => {
//       await expect(
//         FanService.authenticateFan('nonexistent@example.com', 'password123')
//       ).rejects.toThrow('Identifiants invalides');
//     });
//   });

//   describe('updateProfile', () => {
//     let fan: any;

//     beforeEach(async () => {
//       fan = await FanService.createFan({
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password123',
//       });
//     });

//     it('should update profile successfully', async () => {
//       const profileData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         bio: 'Test bio',
//         avatar: 'https://example.com/avatar.jpg',
//       };

//       const updatedFan = await FanService.updateProfile(fan._id.toString(), profileData);

//       expect(updatedFan.profile.firstName).toBe(profileData.firstName);
//       expect(updatedFan.profile.lastName).toBe(profileData.lastName);
//       expect(updatedFan.profile.bio).toBe(profileData.bio);
//       expect(updatedFan.profile.avatar).toBe(profileData.avatar);
//       expect(updatedFan.isProfileComplete).toBe(true);
//     });

//     it('should throw error for non-existent fan', async () => {
//       const fakeId = new mongoose.Types.ObjectId().toString();
//       const profileData = { firstName: 'John' };

//       await expect(
//         FanService.updateProfile(fakeId, profileData)
//       ).rejects.toThrow('Fan non trouvé');
//     });
//   });

//   describe('getProfile', () => {
//     let fan: any;

//     beforeEach(async () => {
//       fan = await FanService.createFan({
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password123',
//       });
//     });

//     it('should return fan profile without password', async () => {
//       const profile = await FanService.getProfile(fan._id.toString());

//       expect(profile).toBeDefined();
//       expect(profile.username).toBe('testuser');
//       expect(profile.email).toBe('test@example.com');
//       expect(profile.password).toBeUndefined();
//     });

//     it('should throw error for non-existent fan', async () => {
//       const fakeId = new mongoose.Types.ObjectId().toString();

//       await expect(FanService.getProfile(fakeId)).rejects.toThrow('Fan non trouvé');
//     });
//   });

//   describe('followFan', () => {
//     let fan1: any;
//     let fan2: any;

//     beforeEach(async () => {
//       fan1 = await FanService.createFan({
//         username: 'user1',
//         email: 'user1@example.com',
//         password: 'password123',
//       });

//       fan2 = await FanService.createFan({
//         username: 'user2',
//         email: 'user2@example.com',
//         password: 'password123',
//       });
//     });

//     it('should follow fan successfully', async () => {
//       await FanService.followFan(fan1._id.toString(), fan2._id.toString());

//       const updatedFan1 = await Fan.findById(fan1._id);
//       const updatedFan2 = await Fan.findById(fan2._id);

//       expect(updatedFan1.following).toContainEqual(fan2._id);
//       expect(updatedFan2.followers).toContainEqual(fan1._id);
//     });

//     it('should throw error when trying to follow self', async () => {
//       await expect(
//         FanService.followFan(fan1._id.toString(), fan1._id.toString())
//       ).rejects.toThrow('Vous ne pouvez pas vous suivre vous-même');
//     });

//     it('should throw error when already following', async () => {
//       await FanService.followFan(fan1._id.toString(), fan2._id.toString());

//       await expect(
//         FanService.followFan(fan1._id.toString(), fan2._id.toString())
//       ).rejects.toThrow('Vous suivez déjà ce fan');
//     });
//   });

//   describe('searchFans', () => {
//     beforeEach(async () => {
//       await FanService.createFan({
//         username: 'john_doe',
//         email: 'john@example.com',
//         password: 'password123',
//       });

//       await FanService.createFan({
//         username: 'jane_smith',
//         email: 'jane@example.com',
//         password: 'password123',
//       });
//     });

//     it('should search fans by username', async () => {
//       const results = await FanService.searchFans('john');

//       expect(results).toHaveLength(1);
//       expect(results[0].username).toBe('john_doe');
//     });

//     it('should return empty array for no matches', async () => {
//       const results = await FanService.searchFans('nonexistent');

//       expect(results).toHaveLength(0);
//     });
//   });
// });
