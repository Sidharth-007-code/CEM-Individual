const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Parse .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'campus-marketplace-46e4d';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  projectId,
});

const db = admin.firestore();

// 2. Realistic photo mapping
const REAL_IMAGE_MAP = {
  'demo_gamepad_01': '/images/products/gaming_controller.jpg',
  'demo_headphones_08': '/images/products/headphones.jpg',
  'demo_kettle_06': '/images/products/electric_kettle.jpg',
  'demo_rotring_04': '/images/products/mini_drafter.jpg',
  'lst_book_01': '/images/products/grewal_textbook.jpg',
  'lst_book_02': '/images/products/dsa_textbook.jpg',
  'lst_book_sold': '/images/products/morris_mano_textbook.jpg',
  'lst_calc_01': '/images/products/casio_calculator.jpg',
  'lst_coat_01': '/images/products/lab_coat.jpg',
  'lst_cycle_01': '/images/products/bicycle.jpg',
  'lst_draft_01': '/images/products/mini_drafter.jpg',
  'lst_kettle_01': '/images/products/electric_kettle.jpg',
  'lst_lamp_01': '/images/products/study_lamp.jpg',
  'lst_meter_pending': '/images/products/multimeter.jpg',
  'lst_micro_01': '/images/products/microcontroller_kit.jpg',
  'lst_spam_hidden': '/images/products/gaming_controller.jpg',
  'mMqtEo862WyQijkyVdiu': '/images/products/casio_calculator.jpg',
};

function getPhotoForListing(id, title) {
  if (REAL_IMAGE_MAP[id]) return REAL_IMAGE_MAP[id];
  const t = (title || '').toLowerCase();
  if (t.includes('calc') || t.includes('casio')) return '/images/products/casio_calculator.jpg';
  if (t.includes('grewal') || t.includes('math')) return '/images/products/grewal_textbook.jpg';
  if (t.includes('data struct') || t.includes('karumanchi') || t.includes('algorithm')) return '/images/products/dsa_textbook.jpg';
  if (t.includes('morris') || t.includes('mano') || t.includes('logic')) return '/images/products/morris_mano_textbook.jpg';
  if (t.includes('draft') || t.includes('rotring') || t.includes('omega')) return '/images/products/mini_drafter.jpg';
  if (t.includes('coat') || t.includes('lab') || t.includes('goggle')) return '/images/products/lab_coat.jpg';
  if (t.includes('kettle') || t.includes('pigeon') || t.includes('prestige')) return '/images/products/electric_kettle.jpg';
  if (t.includes('cycle') || t.includes('bicycle') || t.includes('bike') || t.includes('hercules')) return '/images/products/bicycle.jpg';
  if (t.includes('headphone') || t.includes('sony')) return '/images/products/headphones.jpg';
  if (t.includes('lamp') || t.includes('light')) return '/images/products/study_lamp.jpg';
  if (t.includes('multimeter') || t.includes('meter')) return '/images/products/multimeter.jpg';
  if (t.includes('8051') || t.includes('microcontroller')) return '/images/products/microcontroller_kit.jpg';
  if (t.includes('gamepad') || t.includes('controller')) return '/images/products/gaming_controller.jpg';
  return '/images/products/casio_calculator.jpg';
}

async function run() {
  console.log('🔄 Upgrading all Firestore listings with photorealistic photography...');
  const snap = await db.collection('listings').get();
  console.log(`Found ${snap.size} listings in Firestore.`);

  let updatedCount = 0;
  for (const docSnap of snap.docs) {
    const listingId = docSnap.id;
    const data = docSnap.data();
    const photoUrl = getPhotoForListing(listingId, data.title);

    // 1. Update listing document with photorealistic thumbnail and images array
    await docSnap.ref.update({
      thumbnail: photoUrl,
      images: [photoUrl, photoUrl, photoUrl],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Update subcollection 'images' documents
    const imagesSnap = await docSnap.ref.collection('images').get();
    if (imagesSnap.empty) {
      // Create 3 subcollection image records
      const views = ['Primary Product Shot', 'Detail & Usability View', 'Specifications & Condition'];
      for (let i = 0; i < 3; i++) {
        await docSnap.ref.collection('images').doc(`img_${i + 1}`).set({
          id: `img_${i + 1}`,
          name: `${listingId}_angle_${i + 1}.jpg`,
          dataUrl: photoUrl,
          sizeKb: 750,
          viewName: views[i],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      for (const imgDoc of imagesSnap.docs) {
        await imgDoc.ref.update({
          dataUrl: photoUrl,
          sizeKb: 750,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    console.log(`  ✓ Updated ${listingId} (${data.title.substring(0, 35)}...) -> ${photoUrl}`);
    updatedCount++;
  }

  console.log(`\n🎉 Successfully upgraded ${updatedCount} listings to real photorealistic photography!`);
  process.exit(0);
}

run().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
