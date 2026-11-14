import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { describe, beforeAll, afterAll, beforeEach, it, expect } from "vitest";

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

      // Active Student
      await db.collection("users").doc("student_alice").set({
        uid: "student_alice",
        name: "Alice",
        email: "alice@msruas.ac.in",
        role: "student",
        status: "active",
      });

      // Second Active Student
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

      // Available Listing owned by Bob
      await db.collection("listings").doc("listing_calc").set({
        id: "listing_calc",
        sellerId: "student_bob",
        title: "Casio Calculator",
        price: 500,
        status: "available",
        category: "Electronics & Calculators",
        reportCount: 0,
      });

      // Admin Audit Entry
      await db.collection("auditLog").doc("audit_secret_01").set({
        actorId: "admin_dan",
        action: "privileged_system_operation",
      });
    });
  });

  // 1. Student cannot read admin auditLog
  it("TC-16: student cannot read administrative audit data", async () => {
    const studentDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    const auditRef = studentDb.collection("auditLog").doc("audit_secret_01");
    await assertFails(auditRef.get());

    const adminDb = testEnv.authenticatedContext("admin_dan").firestore();
    await assertSucceeds(adminDb.collection("auditLog").doc("audit_secret_01").get());
  });

  // 2. Student cannot change own role or status
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

  // 3. Student cannot write to another user's wishlist
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

  // 4. Suspended user blocked from creating listings and buying
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

  // 5. Rule enforcing transactional order creation (must mark listing sold)
  it("TC-10: order creation rejected if listing is not atomically marked sold (getAfter)", async () => {
    const aliceDb = testEnv
      .authenticatedContext("student_alice")
      .firestore();

    // Attempting to create order WITHOUT marking the listing sold in batch/transaction must fail
    const orderRef = aliceDb.collection("orders").doc("order_bad");

    await assertFails(
      orderRef.set({
        id: "order_bad",
        listingId: "listing_calc",
        buyerId: "student_alice",
        sellerId: "student_bob",
        price: 500,
        status: "created",
      })
    );
  });

  // 6. Seller cannot purchase own listing
  it("FR-11: seller is blocked from purchasing their own listing", async () => {
    const bobDb = testEnv.authenticatedContext("student_bob").firestore();
    const orderRef = bobDb.collection("orders").doc("order_self");

    await assertFails(
      orderRef.set({
        id: "order_self",
        listingId: "listing_calc",
        buyerId: "student_bob",
        sellerId: "student_bob",
        price: 500,
        status: "created",
      })
    );
  });

  // 7. Client access to otpRequests is completely denied
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

