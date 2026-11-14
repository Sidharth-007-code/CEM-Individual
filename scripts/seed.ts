/**
 * Campus Marketplace - Firebase Emulator Database Seeder
 * Run with: npm run seed
 * Provisions: 1 Admin, 1 Verifier, 3 Students, 12 realistic listings, sample orders, reports, and audit log.
 */

import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { validateListingAI } from "../lib/ai";

// Parse .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "campus-marketplace-46e4d";

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  console.log(`[Seed] Operating against LOCAL EMULATOR (${projectId})`);
} else {
  // Clear any emulator host env vars to connect to live Google Cloud
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  console.log(`[Seed] Operating against LIVE GOOGLE CLOUD (${projectId})`);
}

if (!admin.apps.length) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!isEmulator && privateKey && clientEmail) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    admin.initializeApp({
      projectId,
    });
  }
}

const auth = admin.auth();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// SVG placeholder data URLs for realistic offline seed imagery
function createPlaceholderImage(text: string, bgColor = "#EFECE1", textColor = "#0F1E36"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="${bgColor}"/>
    <rect x="20" y="20" width="560" height="410" fill="none" stroke="${textColor}" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
    <text x="300" y="210" font-family="serif" font-size="24" font-weight="bold" fill="${textColor}" text-anchor="middle">${text}</text>
    <text x="300" y="250" font-family="sans-serif" font-size="14" fill="${textColor}" opacity="0.7" text-anchor="middle">MSRUAS Campus Marketplace Verified</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function seed() {
  console.log("🌱 Starting Campus Marketplace emulator seeding...");

  // 1. Seed Accounts
  const accounts = [
    {
      uid: "usr_admin",
      email: "admin@msruas.ac.in",
      password: "CampusAdmin@2024",
      displayName: "Dean of Student Affairs",
      role: "admin",
      status: "active",
      course: "Academic Administration",
      year: "Faculty / Dean",
      phone: "+919800000001",
      campus: "Gnanagangothri Campus (Mathikere)",
      bio: "Dean of Student Affairs & Academic Platform Moderator.",
      avatarId: "avatar-rocket",
    },
    {
      uid: "usr_verifier",
      email: "verifier@msruas.ac.in",
      password: "CampusVerifier@2024",
      displayName: "Quality Verifier (Student Council)",
      role: "verifier",
      status: "active",
      course: "MSRUAS Verifier Desk",
      year: "Final Year Representative",
      phone: "+919800000002",
      campus: "Gnanagangothri Campus (Mathikere)",
      bio: "Student Council Academic Quality & Safety Verifier.",
      avatarId: "avatar-grad",
    },
    {
      uid: "usr_student_1",
      email: "aarav.sharma@msruas.ac.in",
      password: "StudentPass@2024",
      displayName: "Aarav Sharma",
      role: "student",
      status: "active",
      course: "B.Tech - Computer Science & Engineering",
      year: "4th Year (Senior)",
      phone: "+919876543210",
      personalEmail: "aarav.personal@gmail.com",
      campus: "Ganga Boys Hostel",
      bio: "Final year CSE student. Selling senior textbooks, Casio calculators, and lab gear.",
      avatarId: "avatar-code",
    },
    {
      uid: "usr_student_2",
      email: "priya.patel@msruas.ac.in",
      password: "StudentPass@2024",
      displayName: "Priya Patel",
      role: "student",
      status: "active",
      course: "B.Tech - Electronics & Communication",
      year: "3rd Year (Junior)",
      phone: "+919876543211",
      personalEmail: "priya.personal@gmail.com",
      campus: "Kaveri Girls Hostel",
      bio: "3rd Year ECE. Looking for peer buyers for lab equipment and semester notes.",
      avatarId: "avatar-science",
    },
    {
      uid: "usr_student_3",
      email: "rohit.kumar@msruas.ac.in",
      password: "StudentPass@2024",
      displayName: "Rohit Kumar",
      role: "student",
      status: "active",
      course: "B.Tech - Mechanical & Aerospace Engineering",
      year: "2nd Year (Sophomore)",
      phone: "+919876543212",
      personalEmail: "rohit.personal@gmail.com",
      campus: "Peenya Campus (Ramaiah Technology)",
      bio: "2nd Year Mechanical Engineering. Hosteler and robotics maker.",
      avatarId: "avatar-robot",
    },
  ];

  for (const acc of accounts) {
    try {
      await auth.createUser({
        uid: acc.uid,
        email: acc.email,
        password: acc.password,
        displayName: acc.displayName,
        emailVerified: true,
      });
      console.log(`  ✓ Auth user created: ${acc.email}`);
    } catch (e: any) {
      if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
        console.log(`  - Auth user exists: ${acc.email}`);
      } else {
        console.error(`  ✗ Error creating auth user ${acc.email}:`, e.message);
      }
    }

    // Upsert Firestore users/{uid}
    await db.collection("users").doc(acc.uid).set(
      {
        uid: acc.uid,
        email: acc.email,
        name: acc.displayName,
        role: acc.role,
        status: acc.status,
        course: acc.course,
        year: acc.year,
        phone: acc.phone,
        campus: acc.campus || "",
        bio: acc.bio || "",
        avatarId: acc.avatarId || "",
        personalEmail: acc.personalEmail || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // 2. Seed 12 Realistic University Listings
  const listingsData = [
    {
      id: "lst_calc_01",
      sellerId: "usr_student_1",
      sellerName: "Aarav Sharma",
      sellerPhone: "+919876543210",
      title: "Casio fx-991EX ClassWiz Scientific Calculator",
      description: "Original Casio fx-991EX in mint condition with box and warranty card. Solar cell and battery functional. Cleared for university mid-term exams.",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 950,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Original serial verified. Fair student price.",
    },
    {
      id: "lst_book_01",
      sellerId: "usr_student_1",
      sellerName: "Aarav Sharma",
      sellerPhone: "+919876543210",
      title: "Higher Engineering Mathematics by B.S. Grewal (44th Ed)",
      description: "Standard engineering mathematics textbook covering differential calculus, Laplace transforms, and linear algebra. Clean pages without markings.",
      category: "Textbooks & Notes",
      condition: "good",
      price: 450,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Verified 44th edition, complete syllabus chapters.",
    },
    {
      id: "lst_coat_01",
      sellerId: "usr_student_2",
      sellerName: "Priya Patel",
      sellerPhone: "+919876543211",
      title: "White Lab Coat with MSRUAS Embroidered Crest (Size M)",
      description: "Required for chemistry and biology laboratories. 100% thick white cotton with official university embroidered pocket crest. Freshly laundered.",
      category: "Lab Equipment & Uniforms",
      condition: "good",
      price: 320,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Official crest confirmed.",
    },
    {
      id: "lst_cycle_01",
      sellerId: "usr_student_3",
      sellerName: "Rohit Kumar",
      sellerPhone: "+919876543212",
      title: "Hercules Roadeo 21-Speed Mountain Bicycle",
      description: "Serviced last month with new front brake pads and front suspension. Includes heavy brass combination lock and campus parking sticker.",
      category: "Bicycles & Mobility",
      condition: "good",
      price: 4200,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Bicycle inspection confirmed with campus security gate pass.",
    },
    {
      id: "lst_micro_01",
      sellerId: "usr_student_2",
      sellerName: "Priya Patel",
      sellerPhone: "+919876543211",
      title: "Microcontroller 8051 Development Kit with Breadboard",
      description: "Complete electronics hardware kit with 8051 board, USB programmer cable, 50 jumper wires, and 7-segment LED display. Used for 4th sem lab.",
      category: "Electronics & Calculators",
      condition: "good",
      price: 1200,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Hardware kit functional.",
    },
    {
      id: "lst_book_02",
      sellerId: "usr_student_1",
      sellerName: "Aarav Sharma",
      sellerPhone: "+919876543210",
      title: "Data Structures & Algorithms Made Easy (Narasimha Karumanchi)",
      description: "Must-have placement preparation textbook. Covers trees, graphs, dynamic programming, and sorting with C/C++ examples.",
      category: "Textbooks & Notes",
      condition: "like_new",
      price: 380,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Condition pristine.",
    },
    {
      id: "lst_kettle_01",
      sellerId: "usr_student_3",
      sellerName: "Rohit Kumar",
      sellerPhone: "+919876543212",
      title: "Pigeon 1.5L Stainless Steel Electric Kettle for Hostel",
      description: "Instant boiling kettle with auto cut-off. Ideal for hostel late-night study tea, noodles, and coffee. Clean heating element.",
      category: "Hostel & Room Essentials",
      condition: "good",
      price: 480,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Meets electrical safety check.",
    },
    {
      id: "lst_draft_01",
      sellerId: "usr_student_3",
      sellerName: "Rohit Kumar",
      sellerPhone: "+919876543212",
      title: "Omega Engineering Mini Drafter & Drawing Sheet Tube",
      description: "Complete 1st year engineering graphics drawing set. Includes smooth mini drafter with clamp, steel ruler, and water-resistant expandable sheet tube.",
      category: "Stationery & Drafting",
      condition: "good",
      price: 260,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "All clamp dials intact.",
    },
    {
      id: "lst_lamp_01",
      sellerId: "usr_student_2",
      sellerName: "Priya Patel",
      sellerPhone: "+919876543211",
      title: "LED Desk Study Lamp with 3 Brightness Levels & USB Port",
      description: "Flexible gooseneck study lamp with warm white LED light and built-in pen holder. Plugs into USB or phone adapter.",
      category: "Hostel & Room Essentials",
      condition: "like_new",
      price: 350,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Working condition confirmed.",
    },
    {
      id: "lst_meter_pending",
      sellerId: "usr_student_1",
      sellerName: "Aarav Sharma",
      sellerPhone: "+919876543210",
      title: "Digital Multimeter with Test Probes & Transistor Tester",
      description: "Automotive and laboratory digital multimeter. Needs verifier approval in queue before appearing on board.",
      category: "Lab Equipment & Uniforms",
      condition: "good",
      price: 400,
      status: "pending", // Pending in verifier queue
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
    },
    {
      id: "lst_book_sold",
      sellerId: "usr_student_2",
      sellerName: "Priya Patel",
      sellerPhone: "+919876543211",
      title: "Digital Logic & Computer Design by M. Morris Mano",
      description: "Boolean algebra, combinational circuits, and sequential memory. Already sold to Rohit Kumar in sample order.",
      category: "Textbooks & Notes",
      condition: "good",
      price: 320,
      status: "sold", // Sold test case
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      verifierId: "usr_verifier",
      verifierNote: "Approved and previously traded.",
    },
    {
      id: "demo_gamepad_01",
      sellerId: "usr_student_1",
      sellerName: "Shreyas Adiga",
      sellerPhone: "+919876543210",
      title: "Pro Wireless Gaming Controller (Game Zone Edition)",
      description: "Custom tactile low-latency dual wireless controller with textured grips and USB-C fast charging. Perfect for hostel gaming sessions and weekend tournaments.",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 1200,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      isPresentationDemo: true,
      verifierId: "usr_verifier",
      verifierNote: "Presentation demo gear verified.",
    },
    {
      id: "demo_headphones_08",
      sellerId: "usr_student_1",
      sellerName: "Shreyas Adiga",
      sellerPhone: "+919876543210",
      title: "Sony Noise-Cancelling Over-Ear Study Headphones",
      description: "Active noise cancellation for deep focus sessions at the campus library. 30-hour battery life with USB-C quick charge and carrying pouch included.",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 4500,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      isPresentationDemo: true,
      verifierId: "usr_verifier",
      verifierNote: "Presentation demo gear verified.",
    },
    {
      id: "demo_rotring_04",
      sellerId: "usr_student_3",
      sellerName: "Rohit Kumar",
      sellerPhone: "+919876543212",
      title: "Rotring Rapid A3 Engineering Drafting Board & Mini Drafter",
      description: "Sturdy precision drafting machine with stainless steel scale arms and clamp. Used for mechanical and civil engineering drawing labs at Peenya Campus.",
      category: "Stationery & Drafting",
      condition: "good",
      price: 1400,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      isPresentationDemo: true,
      verifierId: "usr_verifier",
      verifierNote: "Presentation demo gear verified.",
    },
    {
      id: "demo_kettle_06",
      sellerId: "usr_student_1",
      sellerName: "Aarav Sharma",
      sellerPhone: "+919876543210",
      title: "Prestige 1.5L Stainless Steel Auto Cut-off Electric Kettle",
      description: "Compact 1500W electric kettle with 360-degree swivel base. Tested and safe for Ganga & Kaveri hostel rooms. Boils water for tea/coffee in 2 minutes.",
      category: "Hostel & Room Essentials",
      condition: "good",
      price: 550,
      status: "available",
      reportCount: 0,
      checkResult: { passed: true, reasons: [] },
      isPresentationDemo: true,
      verifierId: "usr_verifier",
      verifierNote: "Presentation demo gear verified.",
    },
    {
      id: "lst_spam_hidden",
      sellerId: "usr_student_3",
      sellerName: "Rohit Kumar",
      sellerPhone: "+919876543212",
      title: "Unverified Luxury Smartwatch Replica",
      description: "Non-academic accessory flagged by multiple students for fraudulent pricing.",
      category: "Electronics & Calculators",
      condition: "fair",
      price: 2500,
      status: "hidden", // Auto-hidden after 3 reports
      reportCount: 3,
      checkResult: {
        passed: false,
        reasons: ["Non-academic accessory. Potential counterfeit."],
      },
    },
  ];

  for (const item of listingsData) {
    const thumb = createPlaceholderImage(item.title);
    const listingRef = db.collection("listings").doc(item.id);

    // Compute AI validation evaluation
    const aiRes = validateListingAI({
      title: item.title,
      description: item.description,
      category: item.category as any,
      condition: item.condition as any,
      price: item.price,
      imageCount: 3,
    });

    await listingRef.set({
      ...item,
      aiValidation: aiRes,
      aiTags: aiRes.suggestedTags,
      thumbnail: thumb,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Subcollection images
    for (let i = 1; i <= 3; i++) {
      const imgRef = listingRef.collection("images").doc(`img_${i}`);
      await imgRef.set({
        id: `img_${i}`,
        dataUrl: thumb,
        sizeKb: 65 + i * 10,
        name: `photo_${i}.jpg`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`  ✓ Listing created: ${item.title} (${item.status})`);
  }

  // 3. Seed Sample Orders
  const sampleOrder = {
    id: "ord_demo_101",
    listingId: "lst_book_sold",
    listingTitle: "Digital Logic & Computer Design by M. Morris Mano",
    buyerId: "usr_student_3",
    buyerName: "Rohit Kumar",
    sellerId: "usr_student_2",
    sellerName: "Priya Patel",
    price: 320,
    paymentMethod: "upi_sim",
    paymentStatus: "success",
    status: "completed",
    meetupSpot: "Main Campus Canteen (GF)",
    meetupTime: "Completed yesterday at 4:30 PM",
    invoice: {
      number: `MSRUAS-${new Date().getFullYear()}-DEMO101`,
      issuedAt: new Date().toISOString(),
      total: 320,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("orders").doc(sampleOrder.id).set(sampleOrder);
  await db
    .collection("orders")
    .doc(sampleOrder.id)
    .collection("tracking")
    .doc("trk_1")
    .set({
      status: "completed",
      note: "Item inspected and physically handed over at Main Campus Canteen (GF).",
      at: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log(`  ✓ Sample order created: ${sampleOrder.id}`);

  // 4. Seed Reports
  await db.collection("reports").doc("lst_spam_hidden_usr_student_1").set({
    id: "lst_spam_hidden_usr_student_1",
    listingId: "lst_spam_hidden",
    listingTitle: "Unverified Luxury Smartwatch Replica",
    reporterId: "usr_student_1",
    reporterName: "Aarav Sharma",
    reason: "Counterfeit or unauthorized item - Not permitted on student notice board",
    status: "open",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 5. Seed Audit Log
  await db.collection("auditLog").doc("aud_init_01").set({
    actorId: "usr_admin",
    actorEmail: "admin@msruas.ac.in",
    action: "system_database_seeded",
    targetId: "global_catalog",
    details: { totalListings: 12, mode: "emulator_environment" },
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeding completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed script error:", e);
    process.exit(1);
  });

