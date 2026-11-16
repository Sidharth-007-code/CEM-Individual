const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

(async () => {
  const rules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: 'campus-marketplace-test-order',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });

  // Setup admin context to seed users and listing
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('users').doc('student_alice').set({
      uid: 'student_alice',
      email: 'alice@msruas.ac.in',
      role: 'student',
      status: 'active',
    });
    await db.collection('users').doc('student_bob').set({
      uid: 'student_bob',
      email: 'bob@msruas.ac.in',
      role: 'student',
      status: 'active',
    });
    await db.collection('listings').doc('listing_calc').set({
      id: 'listing_calc',
      sellerId: 'student_bob',
      title: 'Casio fx-991EX',
      price: 950,
      status: 'available',
      reportCount: 0,
    });
  });

  const aliceDb = testEnv.authenticatedContext('student_alice').firestore();

  console.log('Testing createOrderTransaction atomic batch with tracking subcollection...');
  const batch = aliceDb.batch();

  const listingRef = aliceDb.collection('listings').doc('listing_calc');
  batch.update(listingRef, {
    status: 'sold',
    updatedAt: new Date(),
  });

  const orderRef = aliceDb.collection('orders').doc('order_123');
  batch.set(orderRef, {
    id: 'order_123',
    listingId: 'listing_calc',
    listingTitle: 'Casio fx-991EX',
    buyerId: 'student_alice',
    buyerName: 'Alice',
    sellerId: 'student_bob',
    sellerName: 'Bob',
    price: 950,
    paymentMethod: 'upi_sim',
    paymentStatus: 'success',
    status: 'confirmed',
    meetupSpot: 'Library',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const trackRef = orderRef.collection('tracking').doc('track_1');
  batch.set(trackRef, {
    status: 'confirmed',
    note: 'Simulated UPI payment verified successfully.',
    at: new Date(),
  });

  try {
    await batch.commit();
    console.log('BATCH COMMITTED SUCCESSFULLY!');
  } catch (err) {
    console.error('BATCH COMMIT FAILED:', err.message);
  }

  await testEnv.cleanup();
})();
