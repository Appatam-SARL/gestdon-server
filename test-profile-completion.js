const mongoose = require('mongoose');
const Fan = require('./src/models/fan.model').default;

// Configuration de la connexion MongoDB (à adapter selon votre configuration)
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/gescom';

async function testProfileCompletion() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer un fan de test
    const testFan = new Fan({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      profile: {
        firstName: '',
        lastName: '',
        bio: '',
        avatar: '',
        coverPhoto: '',
        website: '',
      },
    });

    await testFan.save();
    console.log('✅ Fan de test créé:', testFan.username);
    console.log('📊 Statut initial du profil:', testFan.isProfileComplete);

    // Test 1: Profil incomplet
    console.log('\n🧪 Test 1: Profil incomplet');
    const profileStatus1 = await Fan.updateProfileCompletionStatus(testFan._id);
    console.log('Statut après vérification:', profileStatus1);

    const fan1 = await Fan.findById(testFan._id);
    console.log('isProfileComplete dans la base:', fan1.isProfileComplete);

    // Test 2: Ajouter firstName
    console.log('\n🧪 Test 2: Ajouter firstName');
    testFan.profile.firstName = 'John';
    await testFan.save();

    const profileStatus2 = await Fan.updateProfileCompletionStatus(testFan._id);
    console.log('Statut après ajout firstName:', profileStatus2);

    const fan2 = await Fan.findById(testFan._id);
    console.log('isProfileComplete dans la base:', fan2.isProfileComplete);

    // Test 3: Ajouter lastName
    console.log('\n🧪 Test 3: Ajouter lastName');
    testFan.profile.lastName = 'Doe';
    await testFan.save();

    const profileStatus3 = await Fan.updateProfileCompletionStatus(testFan._id);
    console.log('Statut après ajout lastName:', profileStatus3);

    const fan3 = await Fan.findById(testFan._id);
    console.log('isProfileComplete dans la base:', fan3.isProfileComplete);

    // Test 4: Ajouter avatar
    console.log('\n🧪 Test 4: Ajouter avatar');
    testFan.profile.avatar = 'https://example.com/avatar.jpg';
    await testFan.save();

    const profileStatus4 = await Fan.updateProfileCompletionStatus(testFan._id);
    console.log('Statut après ajout avatar:', profileStatus4);

    const fan4 = await Fan.findById(testFan._id);
    console.log('isProfileComplete dans la base:', fan4.isProfileComplete);

    // Test 5: Profil complet
    console.log('\n🧪 Test 5: Profil complet');
    console.log('Profil final:', {
      firstName: fan4.profile.firstName,
      lastName: fan4.profile.lastName,
      avatar: fan4.profile.avatar,
      isProfileComplete: fan4.isProfileComplete,
    });

    // Nettoyage
    await Fan.findByIdAndDelete(testFan._id);
    console.log('\n🧹 Fan de test supprimé');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testProfileCompletion();
