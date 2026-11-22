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

  // 2. Student cannot create own admin user doc (User doc creation is admin-only via Admin SDK)
  it("FR-01/FR-03: student cannot create own admin user doc via client SDK", async () => {
    const aliceDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    // Student attempting to create a user document (even with role: admin or student)
    await assertFails(
      aliceDb.collection("users").doc("student_hacker").set({
        uid: "student_hacker",
        name: "Hacker",
        email: "hacker@msruas.ac.in",
        role: "admin",
        status: "active",
      })
    );

    // Admin can create a user document
    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();
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

  // 3. Student cannot change own role or status
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

    // Updating allowed bio fields must succeed
    await assertSucceeds(
      ownProfileRef.update({
        phone: "+919999988888",
      })
    );
  });

  // 4. Seller cannot self-approve a listing
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

  // 5. Buyer cannot edit order price or paymentStatus
  it("FR-12/FR-13: buyer/seller cannot edit order price or paymentStatus after creation", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const orderRef = aliceDb.collection("orders").doc("order_active");

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

  // 6. Order creation requires request.resource.data.price == listing price
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
        });

        // Update listing status to sold
        tx.update(listingRef, { status: "sold" });

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
        });

        tx.update(listingRef, { status: "sold" });

        tx.set(orderRef.collection("tracking").doc("trk_init"), {
          status: "created",
          note: "Duplicate order attempt",
          at: new Date(),
        });
      })
    );
  });

  // 7. Student cannot write to another user's wishlist
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

  // 8. Suspended user blocked from creating listings and buying
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
  });

  // 9. Report count increment rules & auto-hide threshold
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

  // 9.5 FR-08: student can check, create, and cannot duplicate a listing report
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

  // 10. Notifications create restricted to sender's own uid or admin
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

    // Alice creating notification for Bob with her own senderId succeeds
    await assertSucceeds(
      aliceDb.collection("notifications/student_bob/items").doc("notif_legit").set({
        id: "notif_legit",
        senderId: "student_alice",
        type: "order",
        text: "Legit order alert",
        read: false,
      })
    );
  });

  // 11. TC-09: Conversation messages visible only to participants & full chat initiation flow
  it("TC-09: conversation messages visible only to participants and allows initial buyer-seller setup", async () => {
    const aliceDb = testEnv.authenticatedContext("student_alice").firestore();
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();
    const suspendedDb = testEnv.authenticatedContext("student_suspended").firestore();

    // 1. Initial existence check on a new conversation document succeeds without null evaluation error
    const newConvRef = aliceDb.collection("conversations").doc("new_conv_listing123_alice");
    const snapBefore = await assertSucceeds(newConvRef.get());
    // Document should not exist yet
    if (snapBefore.exists) {
      throw new Error("Expected conversation not to exist before creation");
    }

    // 2. Buyer Alice initiates brand new conversation with Seller Bob
    await assertSucceeds(
      newConvRef.set({
        id: "new_conv_listing123_alice",
        listingId: "listing123",
        listingTitle: "Casio Calculator",
        participantIds: ["student_alice", "student_bob"],
        participantNames: { student_alice: "Alice", student_bob: "Bob" },
        lastMessage: "Conversation initiated",
        updatedAt: new Date(),
      })
    );

    // 3. Both Alice (buyer) and Bob (seller) can read the conversation document
    await assertSucceeds(newConvRef.get());
    await assertSucceeds(bobDb.collection("conversations").doc("new_conv_listing123_alice").get());

    // 4. Alice sends message to Bob
    await assertSucceeds(
      newConvRef.collection("messages").doc("msg_buyer_1").set({
        senderId: "student_alice",
        senderName: "Alice",
        text: "Hi Bob, is this calculator still available?",
        createdAt: new Date(),
      })
    );

    // 5. Bob sends reply to Alice
    await assertSucceeds(
      bobDb.collection("conversations/new_conv_listing123_alice/messages").doc("msg_seller_1").set({
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

    // 7. Non-participant (Suspended Sam) cannot read or write to the conversation
    await assertFails(
      suspendedDb.collection("conversations").doc("new_conv_listing123_alice").get()
    );
    await assertFails(
      suspendedDb.collection("conversations/new_conv_listing123_alice/messages").doc("msg_intruder").set({
        senderId: "student_suspended",
        text: "Intruder message",
      })
    );
  });

  // 12. Client access to otpRequests is completely denied
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
});
