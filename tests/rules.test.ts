import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { describe, beforeAll, afterAll, beforeEach, it } from "vitest";

const PROJECT_ID = "campus-marketplace-test";
const FIRESTORE_RULES = fs.readFileSync(
  path.resolve(__dirname, "../firestore.rules"),
  "utf8"
);

describe("Firestore Security Rules Tests (CSC203B Verification)", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    // If FIRESTORE_EMULATOR_HOST is not set, default to 127.0.0.1:8080
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: FIRESTORE_RULES,
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed baseline user profiles using testEnv.withSecurityRulesDisabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Active Student Alice
      await db.collection("users").doc("student_alice").set({
        uid: "student_alice",
        name: "Alice",
        email: "alice@msruas.ac.in",
        role: "student",
        status: "active",
      });

      // Second Active Student Bob
      await db.collection("users").doc("student_bob").set({
        uid: "student_bob",
        name: "Bob",
        email: "bob@msruas.ac.in",
        role: "student",
        status: "active",
      });

      // Suspended Student
      await db.collection("users").doc("student_suspended").set({
        uid: "student_suspended",
        name: "Suspended Sam",
        email: "sam@msruas.ac.in",
        role: "student",
        status: "suspended",
      });

      // Admin Account
      await db.collection("users").doc("admin_dan").set({
        uid: "admin_dan",
        name: "Admin Dan",
        email: "admin@msruas.ac.in",
        role: "admin",
        status: "active",
      });

      // Verifier Account
      await db.collection("users").doc("verifier_val").set({
        uid: "verifier_val",
        name: "Verifier Val",
        email: "verifier@msruas.ac.in",
        role: "verifier",
        status: "active",
      });

      // Available Listing owned by Bob (Price 500)
      await db.collection("listings").doc("listing_calc").set({
        id: "listing_calc",
        sellerId: "student_bob",
        title: "Casio Calculator",
        price: 500,
        status: "available",
        category: "Electronics & Calculators",
        reportCount: 0,
      });

      // Pending Listing owned by Bob
      await db.collection("listings").doc("listing_pending").set({
        id: "listing_pending",
        sellerId: "student_bob",
        title: "Pending Morris Mano Book",
        price: 350,
        status: "pending",
        category: "Textbooks & Notes",
        reportCount: 0,
      });

      // Listing with 2 reports (ready for threshold test)
      await db.collection("listings").doc("listing_reported_2").set({
        id: "listing_reported_2",
        sellerId: "student_bob",
        title: "Controversial Notes",
        price: 150,
        status: "available",
        category: "Textbooks & Notes",
        reportCount: 2,
      });

      // Existing Confirmed Order
      await db.collection("orders").doc("order_active").set({
        id: "order_active",
        listingId: "listing_calc",
        buyerId: "student_alice",
        sellerId: "student_bob",
        price: 500,
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "confirmed",
        meetupSpot: "University Library",
        meetupTime: "4:30 PM",
      });

      // Conversation between Alice and Bob
      await db.collection("conversations").doc("conv_alice_bob").set({
        participantIds: ["student_alice", "student_bob"],
        updatedAt: new Date(),
      });

      // Admin Audit Entry
      await db.collection("auditLog").doc("audit_secret_01").set({
        actorId: "admin_dan",
        action: "privileged_system_operation",
      });
    });
  });

  // ============================================================
  // USER PROFILE TESTS
  // ============================================================

  // 1. Student cannot read or create admin auditLog
  it("TC-16: student cannot read or write administrative audit data", async () => {
    const studentDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    const auditRef = studentDb.collection("auditLog").doc("audit_secret_01");
    await assertFails(auditRef.get());

    // Student writing to auditLog must fail
    await assertFails(
      studentDb.collection("auditLog").doc("audit_tamper").set({
        actorId: "student_alice",
        action: "illegal_write",
      })
    );

    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();
    await assertSucceeds(adminDb.collection("auditLog").doc("audit_secret_01").get());
    await assertSucceeds(
      adminDb.collection("auditLog").doc("audit_admin_legit").set({
        actorId: "admin_dan",
        action: "legit_action",
      })
    );
  });

  // 2. Verified institutional student registration succeeds
  it("FR-01: verified institutional student can create profile on first login", async () => {
    // Simulate a new verified institutional student
    const newStudentDb = testEnv
      .authenticatedContext("student_new", { email_verified: true, email: "new@msruas.ac.in" })
      .firestore();

    // New student creating their own profile should succeed
    await assertSucceeds(
      newStudentDb.collection("users").doc("student_new").set({
        uid: "student_new",
        name: "New Student",
        email: "new@msruas.ac.in",
        role: "student",
        status: "active",
        phone: "",
        course: "",
        year: "",
        campus: "",
        bio: "",
      })
    );
  });

  it("FR-01: verified institutional subdomain email can create a profile", async () => {
    const subdomainDb = testEnv.authenticatedContext("student_subdomain", {
      email_verified: true,
      email: "new.student@cse.student.msruas.ac.in",
    }).firestore();

    await assertSucceeds(subdomainDb.collection("users").doc("student_subdomain").set({
      uid: "student_subdomain",
      name: "Subdomain Student",
      email: "new.student@cse.student.msruas.ac.in",
      role: "student",
      status: "active",
    }));
  });

  it("FR-01: institutional email matching follows the server's case-insensitive domain policy", async () => {
    const uppercaseDb = testEnv.authenticatedContext("student_uppercase_domain", {
      email_verified: true,
      email: "student@CSE.Student.MSRUAS.AC.IN",
    }).firestore();

    await assertSucceeds(uppercaseDb.collection("users").doc("student_uppercase_domain").set({
      uid: "student_uppercase_domain",
      name: "Uppercase Domain Student",
      email: "student@CSE.Student.MSRUAS.AC.IN",
      role: "student",
      status: "active",
    }));
  });

  // 3. Unverified email registration fails
  it("FR-01: unverified email cannot create profile", async () => {
    const unverifiedDb = testEnv
      .authenticatedContext("student_unverified", { email_verified: false, email: "unverified@msruas.ac.in" })
      .firestore();

    await assertFails(
      unverifiedDb.collection("users").doc("student_unverified").set({
        uid: "student_unverified",
        name: "Unverified",
        email: "unverified@msruas.ac.in",
        role: "student",
        status: "active",
      })
    );
  });

  // 4. Non-institutional email registration fails
  it("FR-01: non-institutional email cannot create profile", async () => {
    const nonInstitutionalDb = testEnv
      .authenticatedContext("student_gmail", { email_verified: true, email: "student@gmail.com" })
      .firestore();

    await assertFails(
      nonInstitutionalDb.collection("users").doc("student_gmail").set({
        uid: "student_gmail",
        name: "Gmail Student",
        email: "student@gmail.com",
        role: "student",
        status: "active",
      })
    );
  });

  // 5. Look-alike domain registration fails
  it("FR-01: look-alike domain cannot create profile", async () => {
    const lookalikeDb = testEnv
      .authenticatedContext("student_lookalike", { email_verified: true, email: "student@msruas.ac.in.evil.com" })
      .firestore();

    await assertFails(
      lookalikeDb.collection("users").doc("student_lookalike").set({
        uid: "student_lookalike",
        name: "Lookalike",
        email: "student@msruas.ac.in.evil.com",
        role: "student",
        status: "active",
      })
    );
  });

  it("FR-01: alternate lookalike and unrelated domains are rejected", async () => {
    for (const [uid, email] of [
      ["student_prefix_spoof", "student@evilmsruas.ac.in"],
      ["student_typo_spoof", "student@msruas-ac.in"],
      ["student_bad_subdomain_prefix", "student@-cse.msruas.ac.in"],
      ["student_bad_subdomain_suffix", "student@cse-.msruas.ac.in"],
      ["student_empty_subdomain", "student@cse..msruas.ac.in"],
      ["student_external", "student@example.org"],
    ]) {
      const db = testEnv.authenticatedContext(uid, { email_verified: true, email }).firestore();
      await assertFails(db.collection("users").doc(uid).set({
        uid, name: "Rejected", email, role: "student", status: "active",
      }));
    }
  });

  // 6. Student cannot create admin/verifier profile
  it("FR-01/FR-03: student cannot create admin or verifier profile", async () => {
    const aliceDb = testEnv
      .authenticatedContext("student_alice", { email_verified: true, email: "alice@msruas.ac.in" })
      .firestore();

    // Student attempting to create a user document with role: admin
    await assertFails(
      aliceDb.collection("users").doc("student_hacker").set({
        uid: "student_hacker",
        name: "Hacker",
        email: "hacker@msruas.ac.in",
        role: "admin",
        status: "active",
      })
    );

    // Student attempting to create a user document with role: verifier
    await assertFails(
      aliceDb.collection("users").doc("student_hacker2").set({
        uid: "student_hacker2",
        name: "Hacker2",
        email: "hacker2@msruas.ac.in",
        role: "verifier",
        status: "active",
      })
    );

    // Admin can create a user document (with proper token claims)
    const adminDb = testEnv
      .authenticatedContext("admin_dan", { email_verified: true, email: "admin@msruas.ac.in" })
      .firestore();
    await assertSucceeds(
      adminDb.collection("users").doc("student_created_by_admin").set({
        uid: "student_created_by_admin",
        name: "New Student",
        email: "newstudent@msruas.ac.in",
        role: "student",
        status: "active",
      })
    );
  });

  // 7. Student cannot escalate privileges or alter own role
  it("FR-03: student cannot escalate privileges or alter own role", async () => {
    const studentDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    const ownProfileRef = studentDb.collection("users").doc("student_alice");

    // Attempting privilege escalation to admin must fail
    await assertFails(
      ownProfileRef.update({
        role: "admin",
      })
    );

    // Attempting to change status must fail
    await assertFails(
      ownProfileRef.update({
        status: "suspended",
      })
    );

    // Attempting to change UID must fail
    await assertFails(
      ownProfileRef.update({
        uid: "student_hacker",
      })
    );

    // Attempting to change email must fail
    await assertFails(
      ownProfileRef.update({
        email: "hacker@evil.com",
      })
    );

    // Updating allowed bio fields must succeed
    await assertSucceeds(
      ownProfileRef.update({
        phone: "+919999988888",
        bio: "Updated bio",
        course: "B.Tech CS",
      })
    );
  });

  // 8. Student cannot modify another user's profile
  it("FR-03: student cannot modify another user's profile", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const bobProfileRef = aliceDb.collection("users").doc("student_bob");

    await assertFails(
      bobProfileRef.update({
        name: "Hacked Bob",
      })
    );
  });

  // ============================================================
  // LISTING TESTS
  // ============================================================

  // 9. Seller cannot self-approve a pending listing
  it("FR-07: seller cannot self-approve a pending listing; verifier required", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    // Bob (seller) trying to self-approve his own pending listing must fail
    await assertFails(
      bobDb.collection("listings").doc("listing_pending").update({
        status: "available",
      })
    );

    // Verifier approving the listing must succeed
    const verifierDb = testEnv.authenticatedContext("verifier_val").firestore();
    await assertSucceeds(
      verifierDb.collection("listings").doc("listing_pending").update({
        status: "available",
        verifierId: "verifier_val",
        verifierNote: "Approved by syllabus committee",
      })
    );
  });

  it("FR-07: verifier identity and status transitions are constrained; admin retains override", async () => {
    const verifierDb = testEnv.authenticatedContext("verifier_val").firestore();
    const pendingRef = verifierDb.collection("listings").doc("listing_pending");

    await assertFails(pendingRef.update({
      status: "available", verifierId: "admin_dan", verifierNote: "Forged attribution",
    }));
    await assertFails(verifierDb.collection("listings").doc("listing_calc").update({
      status: "rejected", verifierId: "verifier_val", verifierNote: "Invalid review of published item",
    }));
    await assertFails(pendingRef.update({
      status: "sold", verifierId: "verifier_val", verifierNote: "Invalid status",
    }));

    await assertSucceeds(pendingRef.update({
      status: "needs_changes", verifierId: "verifier_val", verifierNote: "Please revise",
    }));
    await assertSucceeds(pendingRef.update({
      status: "available", verifierId: "verifier_val", verifierNote: "Approved after revision",
    }));

    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();
    await assertSucceeds(adminDb.collection("listings").doc("listing_calc").update({
      status: "rejected", verifierId: "verifier_val", verifierNote: "Administrative override",
    }));
  });

  it("FR-05: seller edits are whitelisted and preserve draft workflow", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();
    const listingRef = bobDb.collection("listings").doc("listing_pending");

    await assertSucceeds(listingRef.update({
      title: "Updated book title",
      description: "Updated description",
      category: "Textbooks & Notes",
      condition: "Good",
      price: 325,
      thumbnail: "data:image/png;base64,example",
      status: "needs_changes",
      updatedAt: new Date(),
    }));
    await assertSucceeds(listingRef.update({ status: "pending", updatedAt: new Date() }));
    await assertSucceeds(listingRef.update({ sellerName: "Bob Updated", sellerPhone: "12345" }));

    for (const [field, value] of [
      ["sellerId", "student_alice"],
      ["verifierId", "student_bob"],
      ["verifierNote", "forged"],
      ["reportCount", 99],
      ["soldOrderId", "forged_order"],
      ["aiValidation", { overallPassed: true }],
    ] as const) {
      await assertFails(listingRef.update({ [field]: value }));
    }
    await assertFails(listingRef.update({ status: "available" }));
  });

  // 10. Seller cannot directly change available listing to sold
  it("FR-11: seller cannot directly mark available listing as sold", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    // Seller attempting to directly change status from available to sold must fail
    await assertFails(
      bobDb.collection("listings").doc("listing_calc").update({
        status: "sold",
      })
    );
  });

  it("FR-11: order and listing sale must be reciprocal writes in one atomic commit", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const orderData = {
      id: "atomic_order",
      listingId: "listing_calc",
      buyerId: "student_alice",
      sellerId: "student_bob",
      price: 500,
      status: "created",
      paymentMethod: "cash",
      paymentStatus: "pending",
      meetupSpot: "University Central Library Entrance",
      invoice: { number: "MSRUAS-2026-ATOMIC01", issuedAt: new Date().toISOString(), total: 500 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await assertFails(aliceDb.collection("orders").doc("atomic_order").set(orderData));
    await assertFails(aliceDb.collection("listings").doc("listing_calc").update({
      status: "sold", soldOrderId: "atomic_order",
    }));

    const mismatched = aliceDb.batch();
    mismatched.set(aliceDb.collection("orders").doc("atomic_order"), { ...orderData, id: "forged_order_id" });
    mismatched.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold", soldOrderId: "atomic_order",
    });
    await assertFails(mismatched.commit());

    const forgedFields = aliceDb.batch();
    forgedFields.set(aliceDb.collection("orders").doc("atomic_order"), {
      ...orderData,
      internalAdminNote: "forged",
    });
    forgedFields.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold", soldOrderId: "atomic_order",
    });
    await assertFails(forgedFields.commit());

    const valid = aliceDb.batch();
    valid.set(aliceDb.collection("orders").doc("atomic_order"), orderData);
    valid.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold", soldOrderId: "atomic_order",
    });
    await assertSucceeds(valid.commit());
  });

  // 11. Buyer cannot create order for own listing
  it("FR-11: buyer cannot create order for own listing", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    // Bob (seller) trying to buy his own listing must fail
    const badBatch = bobDb.batch();
    badBatch.set(bobDb.collection("orders").doc("order_self_buy"), {
      id: "order_self_buy",
      listingId: "listing_calc",
      buyerId: "student_bob",
      sellerId: "student_bob",
      price: 500,
      status: "created",
    });
    badBatch.update(bobDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_self_buy",
    });
    await assertFails(badBatch.commit());
  });

  // 12. Order creation requires price to match listing price
  it("FR-11: order creation requires price to match listing price", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // Available listing price is 500. Buyer attempts to create order with price 100 in batch tx
    const badBatch = aliceDb.batch();
    badBatch.set(aliceDb.collection("orders").doc("order_tampered_price"), {
      id: "order_tampered_price",
      listingId: "listing_calc",
      buyerId: "student_alice",
      sellerId: "student_bob",
      price: 100, // Tampered price! Listing is 500
      status: "created",
    });
    badBatch.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_tampered_price",
    });
    await assertFails(badBatch.commit());

    // Buyer attempts to create order with incorrect sellerId (not the listing owner)
    const wrongSellerBatch = aliceDb.batch();
    wrongSellerBatch.set(aliceDb.collection("orders").doc("order_wrong_seller"), {
      id: "order_wrong_seller",
      listingId: "listing_calc",
      buyerId: "student_alice",
      sellerId: "fake_seller", // Not the actual listing owner (student_bob)
      price: 500, // Correct price
      status: "created",
    });
    wrongSellerBatch.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_wrong_seller",
    });
    await assertFails(wrongSellerBatch.commit());

    // Correct price (500) with transaction: read listing, create order, update listing to sold, add tracking
    const orderId = "order_txn_legit_price";
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_calc");
        const listingSnap = await tx.get(listingRef);
        if (!listingSnap.exists) {
          throw new Error("Listing not found");
        }
        const listingData = listingSnap.data() as { price: number };
        const listingPrice = listingData.price;

        // Create order with the actual listing price
        const orderRef = aliceDb.collection("orders").doc(orderId);
        tx.set(orderRef, {
          id: orderId,
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: "student_bob",
          price: listingPrice, // Must match listing price (500)
          status: "created",
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        // Update listing status to sold with soldOrderId
        tx.update(listingRef, { status: "sold", soldOrderId: orderId });

        // Create initial tracking document
        tx.set(orderRef.collection("tracking").doc("trk_init"), {
          status: "created",
          note: "Initial order created with tracking",
          at: new Date(),
        });
      })
    );

    // Second transaction attempt against the same listing should fail (already sold)
    await assertFails(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_calc");
        const listingSnap = await tx.get(listingRef);
        if (!listingSnap.exists) {
          throw new Error("Listing not found");
        }
        const listingData = listingSnap.data() as { price: number };
        const listingPrice = listingData.price;

        const orderRef = aliceDb.collection("orders").doc("order_txn_duplicate");
        tx.set(orderRef, {
          id: "order_txn_duplicate",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: "student_bob",
          price: listingPrice,
          status: "created",
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_txn_duplicate" });

        tx.set(orderRef.collection("tracking").doc("trk_init"), {
          status: "created",
          note: "Duplicate order attempt",
          at: new Date(),
        });
      })
    );
  });

  // 13. Forged payment status fails
  it("FR-11: forged paymentStatus fails on order creation", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    const forgedBatch = aliceDb.batch();
    forgedBatch.set(aliceDb.collection("orders").doc("order_forged_payment"), {
      id: "order_forged_payment",
      listingId: "listing_calc",
      buyerId: "student_alice",
      sellerId: "student_bob",
      price: 500,
      status: "created",
      paymentMethod: "upi_sim",
      paymentStatus: "success", // Forged!
    });
    forgedBatch.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_forged_payment",
    });
    await assertFails(forgedBatch.commit());
  });

  // 14. Forged order status (confirmed) on create fails for cash payment
  it("FR-11: forged order status fails on creation for cash payment", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    const forgedBatch = aliceDb.batch();
    forgedBatch.set(aliceDb.collection("orders").doc("order_forged_status"), {
      id: "order_forged_status",
      listingId: "listing_calc",
      buyerId: "student_alice",
      sellerId: "student_bob",
      price: 500,
      status: "confirmed", // Forged - should only be 'created' for cash
      paymentMethod: "cash",
      paymentStatus: "pending",
    });
    forgedBatch.update(aliceDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_forged_status",
    });
    await assertFails(forgedBatch.commit());
  });

  // 15. UPI order with success payment can have confirmed status
  it("FR-11: UPI order with success payment can have confirmed status", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    const upiOrderRef = aliceDb.collection("orders").doc("order_upi_confirmed");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_reported_2");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(upiOrderRef, {
          id: "order_upi_confirmed",
          listingId: "listing_reported_2",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "confirmed", // Allowed for UPI success
          paymentMethod: "upi_sim",
          paymentStatus: "success",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_upi_confirmed" });
      })
    );
  });

  // ============================================================
  // ORDER STATUS TRANSITION TESTS
  // ============================================================

  // 15. Valid order transitions succeed
  it("FR-12/FR-13: valid order status transitions succeed", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // First create a new order with 'created' status for testing transitions
    // Use listing_reported_2 which is 'available' (not listing_pending which is 'pending')
    const createdOrderRef = aliceDb.collection("orders").doc("order_created_test");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_reported_2");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(createdOrderRef, {
          id: "order_created_test",
          listingId: "listing_reported_2",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created",
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_created_test" });

        tx.set(createdOrderRef.collection("tracking").doc("trk_init"), {
          status: "created",
          note: "Test order",
          at: new Date(),
        });
      })
    );

    // created -> confirmed
    await assertSucceeds(
      createdOrderRef.update({
        status: "confirmed",
        updatedAt: new Date(),
      })
    );

    // confirmed -> meetup_scheduled
    await assertSucceeds(
      createdOrderRef.update({
        status: "meetup_scheduled",
        meetupSpot: "Library",
        meetupTime: "5:00 PM",
        updatedAt: new Date(),
      })
    );

    // meetup_scheduled -> completed
    await assertSucceeds(
      createdOrderRef.update({
        status: "completed",
        updatedAt: new Date(),
      })
    );
  });

  // 16. Invalid order transitions fail
  it("FR-12/FR-13: invalid order status transitions fail", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // Create a test order with 'created' status, then update to 'confirmed'
    // Use listing_calc which is 'available' (we'll create a fresh order, not conflicting with order_active)
    const confirmedOrderRef = aliceDb.collection("orders").doc("order_confirmed_test");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_calc");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(confirmedOrderRef, {
          id: "order_confirmed_test",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created", // Must be 'created' for cash payment
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_confirmed_test" });
      })
    );

    // Update to 'confirmed' first
    await assertSucceeds(
      confirmedOrderRef.update({
        status: "confirmed",
        updatedAt: new Date(),
      })
    );

    // confirmed -> created (invalid backward transition)
    await assertFails(
      confirmedOrderRef.update({
        status: "created",
      })
    );

    // confirmed -> completed (skipping meetup_scheduled)
    await assertFails(
      confirmedOrderRef.update({
        status: "completed",
      })
    );

    // Create a test order with 'created' status
    // Use listing_reported_2 which is still available (not used by first order)
    const createdOrderRef2 = aliceDb.collection("orders").doc("order_created_test2");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_reported_2");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(createdOrderRef2, {
          id: "order_created_test2",
          listingId: "listing_reported_2",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created",
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_created_test2" });
      })
    );

    // created -> meetup_scheduled (skipping confirmed)
    await assertFails(
      createdOrderRef2.update({
        status: "meetup_scheduled",
      })
    );

    // created -> completed (skipping all)
    await assertFails(
      createdOrderRef2.update({
        status: "completed",
      })
    );
  });

  // 17. Buyer cannot edit order price or paymentStatus
  it("FR-12/FR-13: buyer/seller cannot edit order price or paymentStatus after creation", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // Create a test order for this test with 'created' status (cash payment)
    const testOrderRef = aliceDb.collection("orders").doc("order_price_test");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_calc");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(testOrderRef, {
          id: "order_price_test",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created", // Must be 'created' for cash payment
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_price_test" });
      })
    );

    const orderRef = aliceDb.collection("orders").doc("order_price_test");

    // First update to 'confirmed' to test further transitions
    await assertSucceeds(
      orderRef.update({
        status: "confirmed",
        updatedAt: new Date(),
      })
    );

    // Buyer attempting to reduce price must fail
    await assertFails(
      orderRef.update({
        price: 10,
      })
    );

    // Buyer attempting to mark paymentStatus as completed must fail
    await assertFails(
      orderRef.update({
        paymentStatus: "completed",
      })
    );

    // Buyer updating allowed meetup details and status must succeed
    await assertSucceeds(
      orderRef.update({
        status: "meetup_scheduled",
        meetupSpot: "Main Gate Security Desk",
        meetupTime: "5:00 PM",
      })
    );
  });

  // 18. Non-participant cannot update order
  it("FR-12/FR-13: non-participant cannot update order", async () => {
    const suspendedDb = testEnv.authenticatedContext("student_suspended").firestore();

    // Create a test order for this test
    const testOrderRef = suspendedDb.collection("orders").doc("order_suspended_test");
    await assertSucceeds(
      testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const listingRef = db.collection("listings").doc("listing_calc");
        const listingSnap = await listingRef.get();
        const listingData = listingSnap.data() as { sellerId: string; price: number };

        await db.collection("orders").doc("order_suspended_test").set({
          id: "order_suspended_test",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created", // Must be 'created' for cash payment
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        await listingRef.update({ status: "sold", soldOrderId: "order_suspended_test" });
      })
    );

    const orderRef = suspendedDb.collection("orders").doc("order_suspended_test");

    await assertFails(
      orderRef.update({
        status: "cancelled",
      })
    );
  });

  // ============================================================
  // TRACKING TESTS
  // ============================================================

  // 19. Unrelated users cannot access tracking
  it("TC-10: unrelated users cannot access order tracking", async () => {
    const suspendedDb = testEnv.authenticatedContext("student_suspended").firestore();

    // Create a test order for tracking tests
    const trackingOrderRef = suspendedDb.collection("orders").doc("order_tracking_test");
    await assertSucceeds(
      testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const listingRef = db.collection("listings").doc("listing_calc");
        const listingSnap = await listingRef.get();
        const listingData = listingSnap.data() as { sellerId: string; price: number };

        await db.collection("orders").doc("order_tracking_test").set({
          id: "order_tracking_test",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created", // Must be 'created' for cash payment
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        await listingRef.update({ status: "sold", soldOrderId: "order_tracking_test" });

        await db.collection("orders/order_tracking_test/tracking").doc("trk_init").set({
          status: "confirmed",
          note: "Initial tracking",
          at: new Date(),
        });
      })
    );

    // Non-participant cannot read tracking
    await assertFails(
      suspendedDb.collection("orders/order_tracking_test/tracking").doc("trk_init").get()
    );

    // Non-participant cannot write tracking
    await assertFails(
      suspendedDb.collection("orders/order_tracking_test/tracking").doc("trk_forge").set({
        status: "completed",
        note: "Forged tracking",
        at: new Date(),
      })
    );
  });

  // 20. Participants can access tracking
  it("TC-10: participants can access order tracking", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    // Create a test order for tracking tests
    const trackingOrderRef = aliceDb.collection("orders").doc("order_tracking_test2");
    await assertSucceeds(
      aliceDb.runTransaction(async (tx) => {
        const listingRef = aliceDb.collection("listings").doc("listing_calc");
        const listingSnap = await tx.get(listingRef);
        const listingData = listingSnap.data() as { price: number; sellerId: string };

        tx.set(trackingOrderRef, {
          id: "order_tracking_test2",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: listingData.sellerId,
          price: listingData.price,
          status: "created", // Must be 'created' for cash payment
          paymentMethod: "cash",
          paymentStatus: "pending",
        });

        tx.update(listingRef, { status: "sold", soldOrderId: "order_tracking_test2" });

        tx.set(trackingOrderRef.collection("tracking").doc("trk_init"), {
          status: "confirmed",
          note: "Initial tracking",
          at: new Date(),
        });
      })
    );

    // Buyer can read tracking
    await assertSucceeds(
      aliceDb.collection("orders/order_tracking_test2/tracking").doc("trk_init").get()
    );

    // Seller can read tracking
    await assertSucceeds(
      bobDb.collection("orders/order_tracking_test2/tracking").doc("trk_init").get()
    );

    // Buyer can create tracking
    await assertSucceeds(
      aliceDb.collection("orders/order_tracking_test2/tracking").doc("trk_new").set({
        status: "meetup_scheduled",
        note: "Meeting at library",
        at: new Date(),
      })
    );
  });

  // ============================================================
  // WISHLIST TESTS
  // ============================================================

  // 21. Student cannot write to another user's wishlist
  it("TC-08: student cannot access or write to another student's wishlist", async () => {
    const aliceDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    // Alice writing to Alice's wishlist succeeds
    await assertSucceeds(
      aliceDb.collection("wishlists/student_alice/items").doc("item_1").set({
        listingId: "listing_calc",
      })
    );

    // Alice attempting to write to Bob's wishlist fails
    await assertFails(
      aliceDb.collection("wishlists/student_bob/items").doc("item_1").set({
        listingId: "listing_calc",
      })
    );
  });

  // ============================================================
  // SUSPENDED USER TESTS
  // ============================================================

  // 22. Suspended user blocked from marketplace writes
  it("FR-03: suspended user is blocked from marketplace writes", async () => {
    const suspendedDb = testEnv
      .authenticatedContext("student_suspended")
      .firestore();

    // Suspended user cannot create listings
    await assertFails(
      suspendedDb.collection("listings").doc("lst_new").set({
        sellerId: "student_suspended",
        title: "Disallowed Book",
        price: 200,
        status: "pending",
      })
    );

    // Suspended user cannot write wishlist
    await assertFails(
      suspendedDb.collection("wishlists/student_suspended/items").doc("item_1").set({
        listingId: "listing_calc",
      })
    );

    // Suspended user cannot create orders
    const orderBatch = suspendedDb.batch();
    orderBatch.set(suspendedDb.collection("orders").doc("order_suspended"), {
      id: "order_suspended",
      listingId: "listing_calc",
      buyerId: "student_suspended",
      sellerId: "student_bob",
      price: 500,
      status: "created",
      paymentMethod: "cash",
      paymentStatus: "pending",
    });
    orderBatch.update(suspendedDb.collection("listings").doc("listing_calc"), {
      status: "sold",
      soldOrderId: "order_suspended",
    });
    await assertFails(orderBatch.commit());
  });

  // ============================================================
  // REPORT TESTS
  // ============================================================

  // 23. Report count increment rules & auto-hide threshold
  it("FR-08: report count update allows only old + 1; status transitions to hidden only when >= 3", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // 1. Trying to set status hidden when reportCount is only 1 (< 3) must fail
    await assertFails(
      aliceDb.collection("listings").doc("listing_calc").update({
        reportCount: 1,
        status: "hidden",
      })
    );

    // 2. Incrementing reportCount to 1 while keeping status available succeeds
    await assertSucceeds(
      aliceDb.collection("listings").doc("listing_calc").update({
        reportCount: 1,
        status: "available",
      })
    );

    // 3. For listing with 2 reports, incrementing reportCount to 3 and transitioning to hidden succeeds
    await assertSucceeds(
      aliceDb.collection("listings").doc("listing_reported_2").update({
        reportCount: 3,
        status: "hidden",
      })
    );
  });

  // 24. Student can check, create, and cannot duplicate a listing report
  it("FR-08: student can check, create, and cannot duplicate a listing report", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    const reportRef = aliceDb
      .collection("reports")
      .doc("listing_calc_student_alice");

    // 1. Alice can read a nonexistent report document
    const snapBefore = await assertSucceeds(reportRef.get());
    if (snapBefore.exists) {
      throw new Error("Expected report not to exist before creation");
    }

    // 2. Alice can create the report document with required fields
    await assertSucceeds(
      reportRef.set({
        id: "listing_calc_student_alice",
        listingId: "listing_calc",
        listingTitle: "Casio Calculator",
        reporterId: "student_alice",
        reporterName: "Alice",
        reason: "Misleading or fraudulent price",
        status: "open",
        createdAt: new Date(),
      })
    );

    // 3. Alice cannot create or overwrite the same report document again
    await assertFails(
      reportRef.set({
        id: "listing_calc_student_alice",
        listingId: "listing_calc",
        listingTitle: "Casio Calculator",
        reporterId: "student_alice",
        reporterName: "Alice",
        reason: "Misleading or fraudulent price",
        status: "open",
        createdAt: new Date(),
      })
    );

    // 4. Alice can increment the listing's reportCount from 0 to 1 while keeping status available
    await assertSucceeds(
      aliceDb.collection("listings").doc("listing_calc").update({
        reportCount: 1,
        status: "available",
      })
    );
  });

  // 25. Report with mismatched listing title fails
  it("FR-08: report with mismatched listing title fails", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    const reportRef = aliceDb
      .collection("reports")
      .doc("listing_calc_student_alice_2");

    await assertFails(
      reportRef.set({
        id: "listing_calc_student_alice_2",
        listingId: "listing_calc",
        listingTitle: "Wrong Title", // Mismatched!
        reporterId: "student_alice",
        reporterName: "Alice",
        reason: "Misleading or fraudulent price",
        status: "open",
        createdAt: new Date(),
      })
    );
  });

  // ============================================================
  // NOTIFICATION TESTS
  // ============================================================

  // 26. Notification creation restricted to sender's own uid or admin
  it("FR-10: notification creation restricted to sender's own uid or admin", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    // Alice creating a notification for Bob with spoofed senderId fails
    await assertFails(
      aliceDb.collection("notifications/student_bob/items").doc("notif_spoof").set({
        id: "notif_spoof",
        senderId: "impersonator",
        text: "Spoofed alert",
        read: false,
      })
    );

    // Alice creating notification for Bob with her own senderId but no orderId fails (not a valid order relationship)
    await assertFails(
      aliceDb.collection("notifications/student_bob/items").doc("notif_legit_no_order").set({
        id: "notif_legit_no_order",
        senderId: "student_alice",
        type: "order",
        text: "Legit order alert",
        read: false,
      })
    );

    // Alice creating notification for Bob with valid order relationship succeeds
    // First create an order where Alice is buyer and Bob is seller
    const orderRef = aliceDb.collection("orders").doc("order_notif_test");
    await assertSucceeds(
      testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection("orders").doc("order_notif_test").set({
          id: "order_notif_test",
          listingId: "listing_calc",
          buyerId: "student_alice",
          sellerId: "student_bob",
          price: 500,
          status: "created",
          paymentMethod: "cash",
          paymentStatus: "pending",
        });
      })
    );

    await assertSucceeds(
      aliceDb.collection("notifications/student_bob/items").doc("notif_legit_order").set({
        id: "notif_legit_order",
        senderId: "student_alice",
        type: "order",
        text: "Legit order alert",
        link: "/orders/order_notif_test",
        read: false,
        orderId: "order_notif_test",
        createdAt: new Date(),
      })
    );

    const bobDb = testEnv.authenticatedContext("student_bob").firestore();
    const recipientNotif = bobDb.collection("notifications/student_bob/items").doc("notif_legit_order");
    await assertSucceeds(recipientNotif.update({ read: true }));
    for (const [field, value] of [
      ["senderId", "student_bob"],
      ["type", "chat"],
      ["text", "Forged notification"],
      ["link", "/admin"],
      ["orderId", "other_order"],
      ["conversationId", "forged_conversation"],
      ["listingId", "forged_listing"],
      ["id", "forged_id"],
      ["createdAt", new Date()],
      ["readAt", new Date()],
    ] as const) {
      await assertFails(recipientNotif.update({ [field]: value }));
    }
    await assertFails(recipientNotif.update({ read: false }));
    await assertFails(recipientNotif.update({ read: "true" }));
    await assertSucceeds(recipientNotif.delete());
    await assertFails(bobDb.collection("notifications/student_alice/items").doc("notif_legit_order").delete());
    await assertFails(aliceDb.collection("notifications/student_bob/items").doc("notif_legit_order").update({ read: true }));

    await assertFails(aliceDb.collection("notifications/student_bob/items").doc("notif_order_extra_field").set({
      id: "notif_order_extra_field", senderId: "student_alice", type: "order",
      text: "Order alert", link: "/orders/order_notif_test", orderId: "order_notif_test",
      read: false, createdAt: new Date(), internal: "forged",
    }));

    // Invalid notification type fails
    await assertFails(
      aliceDb.collection("notifications/student_bob/items").doc("notif_bad_type").set({
        id: "notif_bad_type",
        senderId: "student_alice",
        type: "invalid_type",
        text: "Invalid type",
        read: false,
      })
    );

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("conversations").doc("listing_calc_student_alice").set({
        id: "listing_calc_student_alice",
        listingId: "listing_calc",
        listingTitle: "Casio Calculator",
        participantIds: ["student_alice", "student_bob"],
      });
    });
    await assertSucceeds(aliceDb.collection("notifications/student_bob/items").doc("notif_chat_ok").set({
      id: "notif_chat_ok", senderId: "student_alice", type: "chat", conversationId: "listing_calc_student_alice",
      text: "Message", link: "/messages/listing_calc_student_alice", read: false, createdAt: new Date(),
    }));
    await assertFails(aliceDb.collection("notifications/student_suspended/items").doc("notif_chat_wrong_recipient").set({
      id: "notif_chat_wrong_recipient", senderId: "student_alice", type: "chat",
      conversationId: "listing_calc_student_alice", text: "Message", link: "/messages/listing_calc_student_alice",
      read: false, createdAt: new Date(),
    }));
    await assertFails(aliceDb.collection("notifications/student_alice/items").doc("notif_chat_self").set({
      id: "notif_chat_self", senderId: "student_alice", type: "chat",
      conversationId: "listing_calc_student_alice", text: "Self notification",
      link: "/messages/listing_calc_student_alice", read: false, createdAt: new Date(),
    }));
    await assertFails(aliceDb.collection("notifications/student_bob/items").doc("notif_chat_spoof_sender").set({
      id: "notif_chat_spoof_sender", senderId: "student_bob", type: "chat",
      conversationId: "listing_calc_student_alice", text: "Spoofed sender",
      link: "/messages/listing_calc_student_alice", read: false, createdAt: new Date(),
    }));

    const verifierDb = testEnv.authenticatedContext("verifier_val").firestore();
    await assertSucceeds(verifierDb.collection("listings").doc("listing_pending").update({
      status: "available", verifierId: "verifier_val", verifierNote: "Approved",
    }));
    await assertSucceeds(verifierDb.collection("notifications/student_bob/items").doc("notif_verification_ok").set({
      id: "notif_verification_ok", senderId: "verifier_val", type: "verification", listingId: "listing_pending",
      text: "Approved", link: "/listings/listing_pending", read: false, createdAt: new Date(),
    }));
    await assertFails(verifierDb.collection("notifications/student_alice/items").doc("notif_verification_wrong_recipient").set({
      id: "notif_verification_wrong_recipient", senderId: "verifier_val", type: "verification", listingId: "listing_pending",
      text: "Approved", link: "/listings/listing_pending", read: false, createdAt: new Date(),
    }));
  });

  // 27. Admin can create any notification
  it("FR-10: admin can create notifications for any user", async () => {
    const adminDb = testEnv.authenticatedContext("admin_dan", { email_verified: true, email: "admin@msruas.ac.in" }).firestore();

    await assertSucceeds(
      adminDb.collection("notifications/student_bob/items").doc("notif_admin").set({
        id: "notif_admin",
        senderId: "admin_dan",
        type: "system",
        text: "Admin announcement",
        read: false,
        createdAt: new Date(),
      })
    );
  });

  // ============================================================
  // CONVERSATION & MESSAGE TESTS
  // ============================================================

  // 28. Conversation messages visible only to participants
  it("TC-09: conversation messages visible only to participants and allows initial buyer-seller setup", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();
    const suspendedDb = testEnv.authenticatedContext("student_suspended").firestore();

    // 1. Initial existence check on a new conversation document succeeds without null evaluation error
    const newConvRef = aliceDb.collection("conversations").doc("listing_calc_student_alice");
    const snapBefore = await assertSucceeds(newConvRef.get());
    // Document should not exist yet
    if (snapBefore.exists) {
      throw new Error("Expected conversation not to exist before creation");
    }

    // 2. Buyer Alice initiates brand new conversation with Seller Bob
    await assertSucceeds(
      newConvRef.set({
        id: "listing_calc_student_alice",
        listingId: "listing_calc",
        listingTitle: "Casio Calculator",
        participantIds: ["student_alice", "student_bob"],
        participantNames: { student_alice: "Alice", student_bob: "Bob" },
        lastMessage: "Conversation initiated",
        updatedAt: new Date(),
      })
    );

    await assertFails(aliceDb.collection("conversations").doc("listing_calc_student_alice_forged").set({
      id: "listing_calc_student_alice_forged",
      listingId: "listing_calc",
      listingTitle: "Casio Calculator",
      participantIds: ["student_alice", "student_suspended"],
      lastMessage: "Forged seller",
      updatedAt: new Date(),
    }));
    await assertFails(aliceDb.collection("conversations").doc("listing_calc_student_alice_extra").set({
      id: "listing_calc_student_alice_extra",
      listingId: "listing_calc",
      listingTitle: "Casio Calculator",
      participantIds: ["student_alice", "student_bob", "student_suspended"],
      lastMessage: "Extra participant",
      updatedAt: new Date(),
    }));
    await assertFails(aliceDb.collection("conversations").doc("listing_calc_student_bob_alice").set({
      id: "listing_calc_student_bob_alice",
      listingId: "listing_calc",
      listingTitle: "Casio Calculator",
      participantIds: ["student_bob", "student_alice"],
      lastMessage: "Wrong participant ordering",
      updatedAt: new Date(),
    }));

    // 3. Both Alice (buyer) and Bob (seller) can read the conversation document
    await assertSucceeds(newConvRef.get());
    await assertSucceeds(bobDb.collection("conversations").doc("listing_calc_student_alice").get());

    // 4. Alice sends message to Bob
    await assertSucceeds(
      newConvRef.collection("messages").doc("msg_buyer_1").set({
        senderId: "student_alice",
        senderName: "Alice",
        text: "Hi Bob, is this calculator still available?",
        createdAt: new Date(),
      })
    );
    await assertFails(newConvRef.collection("messages").doc("msg_extra_field").set({
      senderId: "student_alice", senderName: "Alice", text: "Spoof payload",
      createdAt: new Date(), isAdmin: true,
    }));

    // 5. Bob sends reply to Alice
    await assertSucceeds(
      bobDb.collection("conversations/listing_calc_student_alice/messages").doc("msg_seller_1").set({
        senderId: "student_bob",
        senderName: "Bob",
        text: "Yes Alice, available. Can meet at Library at 4pm.",
        createdAt: new Date(),
      })
    );

    // 6. Alice updates parent conversation lastMessage
    await assertSucceeds(
      newConvRef.update({
        lastMessage: "Yes Alice, available. Can meet at Library at 4pm.",
        updatedAt: new Date(),
      })
    );
    await assertFails(newConvRef.update({ participantIds: ["student_alice", "student_suspended"] }));
    await assertFails(newConvRef.update({ participantNames: { student_alice: "Alice", student_bob: "Forged" } }));
    await assertFails(newConvRef.update({ listingId: "listing_reported_2" }));
    await assertFails(newConvRef.update({ id: "other_id" }));
    await assertFails(newConvRef.update({ listingTitle: "Forged listing title" }));

    // 7. Non-participant (Suspended Sam) cannot read or write to the conversation
    await assertFails(
      suspendedDb.collection("conversations").doc("listing_calc_student_alice").get()
    );
    await assertFails(
      suspendedDb.collection("conversations/listing_calc_student_alice/messages").doc("msg_intruder").set({
        senderId: "student_suspended",
        text: "Intruder message",
      })
    );

    // 8. Message with spoofed senderId fails
    await assertFails(
      newConvRef.collection("messages").doc("msg_spoof").set({
        senderId: "student_suspended",
        senderName: "Impersonator",
        text: "Spoofed message",
        createdAt: new Date(),
      })
    );
  });

  // ============================================================
  // RETURNS TESTS
  // ============================================================

  // 29. Buyer can create return for own order
  it("FR-14: buyer can create return for own order", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertSucceeds(
      aliceDb.collection("returns").doc("return_1").set({
        orderId: "order_active",
        buyerId: "student_alice",
        reason: "Item not as described",
        status: "requested",
      })
    );
  });

  // 30. Non-buyer cannot create return for another's order
  it("FR-14: non-buyer cannot create return for another's order", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    await assertFails(
      bobDb.collection("returns").doc("return_forge").set({
        orderId: "order_active",
        buyerId: "student_bob", // Not the actual buyer!
        reason: "Fake return",
        status: "requested",
      })
    );
  });

  // 31. Return for non-existent order fails
  it("FR-14: return for non-existent order fails", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertFails(
      aliceDb.collection("returns").doc("return_invalid").set({
        orderId: "order_nonexistent",
        buyerId: "student_alice",
        reason: "Invalid order",
        status: "requested",
      })
    );
  });

  // ============================================================
  // OTP AND AUDIT LOG TESTS
  // ============================================================

  // 32. OTP requests completely inaccessible to client SDK
  it("FR-01: otpRequests collection is completely inaccessible to client SDK", async () => {
    const aliceDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    await assertFails(aliceDb.collection("otpRequests").doc("any_hash").get());
    await assertFails(
      aliceDb.collection("otpRequests").doc("any_hash").set({
        code: "123456",
      })
    );
  });

  // 33. Admin can read/write auditLog
  it("TC-16: admin can read and write auditLog", async () => {
    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();

    await assertSucceeds(adminDb.collection("auditLog").doc("audit_secret_01").get());
    await assertSucceeds(
      adminDb.collection("auditLog").doc("audit_new").set({
        actorId: "admin_dan",
        action: "new_operation",
      })
    );

    // Admin cannot update or delete auditLog
    await assertFails(
      adminDb.collection("auditLog").doc("audit_secret_01").update({
        action: "tampered",
      })
    );
    await assertFails(
      adminDb.collection("auditLog").doc("audit_secret_01").delete()
    );
  });

  // ============================================================
  // LISTING IMAGE TESTS
  // ============================================================

  // 34. Seller can write to own listing images
  it("FR-05: seller can write to own listing images", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();

    await assertSucceeds(
      bobDb.collection("listings/listing_calc/images").doc("img_1").set({
        url: "https://example.com/image.jpg",
      })
    );
  });

  // 35. Non-seller cannot write to listing images
  it("FR-05: non-seller cannot write to listing images", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertFails(
      aliceDb.collection("listings/listing_calc/images").doc("img_1").set({
        url: "https://example.com/image.jpg",
      })
    );
  });

  // ============================================================
  // CONSTANTS TESTS
  // ============================================================

  // 36. Authenticated users can read constants
  it("Constants: authenticated users can read constants", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertSucceeds(aliceDb.collection("constants").doc("categories").get());
  });

  // 37. Non-admin cannot write constants
  it("Constants: non-admin cannot write constants", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertFails(
      aliceDb.collection("constants").doc("categories").set({
        data: "tampered",
      })
    );
  });

  // ============================================================
  // ADMIN RESTORATION TESTS
  // ============================================================

  // 38. Admin can restore hidden listing
  it("Admin: can restore hidden listing", async () => {
    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();

    await assertSucceeds(
      adminDb.collection("listings").doc("listing_reported_2").update({
        status: "available",
        reportCount: 0,
        soldOrderId: null, // Clear soldOrderId
      })
    );
  });

  // ============================================================
  // LISTING CREATION TESTS
  // ============================================================

  // 39. Student can create draft/pending listing
  it("FR-05: student can create draft or pending listing", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertSucceeds(
      aliceDb.collection("listings").doc("listing_new_draft").set({
        id: "listing_new_draft",
        sellerId: "student_alice",
        title: "New Draft Book",
        price: 300,
        status: "draft",
        category: "Textbooks & Notes",
        reportCount: 0,
      })
    );

    await assertSucceeds(
      aliceDb.collection("listings").doc("listing_new_pending").set({
        id: "listing_new_pending",
        sellerId: "student_alice",
        title: "New Pending Book",
        price: 300,
        status: "pending",
        category: "Textbooks & Notes",
        reportCount: 0,
      })
    );
  });

  // 40. Student cannot create listing with sold status
  it("FR-05: student cannot create listing with sold status", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertFails(
      aliceDb.collection("listings").doc("listing_new_sold").set({
        id: "listing_new_sold",
        sellerId: "student_alice",
        title: "New Sold Book",
        price: 300,
        status: "sold",
        category: "Textbooks & Notes",
        reportCount: 0,
      })
    );
  });

  // 41. Student cannot create listing with verifier fields
  it("FR-05: student cannot create listing with verifier fields", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();

    await assertFails(
      aliceDb.collection("listings").doc("listing_new_verifier").set({
        id: "listing_new_verifier",
        sellerId: "student_alice",
        title: "New Verifier Book",
        price: 300,
        status: "pending",
        category: "Textbooks & Notes",
        reportCount: 0,
        verifierId: "verifier_val",
        verifierNote: "Fake verification",
      })
    );
  });
});
