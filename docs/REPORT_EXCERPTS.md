# Key Implementation Excerpts & Demonstration Screenshot Guide

**Course**: CSC203B Software Development Fundamentals  
**Project**: Campus Marketplace  
**Author**: Individual University Submission  

---

## 1. Key Code Excerpt 1: Atomic Single-Sale Transaction (`lib/orders.ts`)

*Ensures that one-of-a-kind university items can never be purchased simultaneously by two buyers. Re-reads the listing inside a Firestore atomic transaction, verifies status, updates the listing to `sold`, and creates the order and initial audit tracking record atomically.*

```typescript
// Excerpt 1: Atomic single-sale transaction in lib/orders.ts (<30 lines)
export async function createOrderTransaction(
  db: Firestore,
  orderData: Omit<Order, "id" | "createdAt">
): Promise<string> {
  const orderRef = doc(collection(db, "orders"));
  const listingRef = doc(db, "listings", orderData.listingId);

  await runTransaction(db, async (tx) => {
    const listingSnap = await tx.get(listingRef);
    if (!listingSnap.exists()) throw new Error("Listing not found");
    if (listingSnap.data().status !== "available") {
      throw new Error("This item is no longer available.");
    }
    if (listingSnap.data().sellerId === orderData.buyerId) {
      throw new Error("Sellers cannot purchase their own listing.");
    }

    // Atomically transition listing to sold
    tx.update(listingRef, { status: "sold", updatedAt: serverTimestamp() });

    // Atomically create order
    tx.set(orderRef, { ...orderData, createdAt: serverTimestamp() });

    // Add initial tracking entry
    const trackRef = doc(collection(db, `orders/${orderRef.id}/tracking`));
    tx.set(trackRef, { status: "created", note: "Order placed", at: serverTimestamp() });
  });
  return orderRef.id;
}
```

---

## 2. Key Code Excerpt 2: Server-Side Firestore Security Rule (`firestore.rules`)

*Enforces at the database engine level that no client can create an order unless the listing was `available` beforehand and is transitioned to `sold` in the exact same atomic operation (`getAfter()`), preventing race conditions and unauthorized status manipulation.*

```javascript
// Excerpt 2: Server-side order rule in firestore.rules (<30 lines)
match /orders/{orderId} {
  allow read: if isAuthenticated() && (
    resource.data.buyerId == request.auth.uid ||
    resource.data.sellerId == request.auth.uid ||
    isAdmin()
  );

  // Enforces atomic transition of listing to 'sold' via getAfter()
  allow create: if isActiveUser() &&
    request.resource.data.buyerId == request.auth.uid &&
    request.resource.data.buyerId != request.resource.data.sellerId &&
    get(/databases/$(database)/documents/listings/$(request.resource.data.listingId)).data.status == 'available' &&
    getAfter(/databases/$(database)/documents/listings/$(request.resource.data.listingId)).data.status == 'sold';

  allow update: if isActiveUser() && (
    request.auth.uid == resource.data.buyerId ||
    request.auth.uid == resource.data.sellerId ||
    isAdmin()
  );
}
```

---

## 3. Key Code Excerpt 3: Advisory Rule-Based Listing Linter (`lib/listingCheck.ts`)

*Evaluates listing submissions against category price bands and media completeness standards. Acts as an advisory engine (Mocked automated check) assisting human verifiers in the university quality queue.*

```typescript
// Excerpt 3: Rule-based automated check in lib/listingCheck.ts (<30 lines)
export function runAutomatedListingCheck(
  data: { title: string; price: number; category: ListingCategory; imageCount: number }
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const range = CATEGORY_PRICE_RANGES[data.category];

  if (!range) {
    reasons.push(`Unknown category: ${data.category}`);
  } else if (data.price < range.min) {
    reasons.push(`Price ₹${data.price} is below standard minimum (₹${range.min}) for ${data.category}.`);
  } else if (data.price > range.max) {
    reasons.push(`Price ₹${data.price} exceeds recommended ceiling (₹${range.max}) for ${data.category}.`);
  }

  if (data.imageCount < 3) {
    reasons.push(`Listing contains only ${data.imageCount} image(s); minimum 3 required.`);
  }
  if (!data.title || data.title.trim().length < 5) {
    reasons.push("Title must be at least 5 characters.");
  }

  return { passed: reasons.length === 0, reasons };
}
```

---

## 4. Screenshot Guide for University Report & Presentation

| # | Screen Name | Route | Recommended Account | Key Visual Elements to Capture |
|---|---|---|---|---|
| **1** | Landing Page & Notice Board | `/` | Unauthenticated / Any | Notice board aesthetic, warm paper background, saffron accent, category bar, active listings grid. |
| **2** | Institutional OTP Registration | `/register` | New registration | Domain restriction notice (`@msruas.ac.in`), OTP 60s countdown timer, security notice. |
| **3** | Student Marketplace Dashboard | `/dashboard` | `aarav.sharma@msruas.ac.in` | Buy/Sell mode toggle switch, active listings count, purchase history, profile banner. |
| **4** | New Listing with Client Compression | `/listings/new` | `aarav.sharma@msruas.ac.in` | 3 image thumbnails with size badges (<150KB), automated rule advice card, price bounds helper. |
| **5** | Listing Detail & Seller Contact | `/listings/[id]` | `priya.patel@msruas.ac.in` | Direct `tel:` call button, real-time "Chat with Seller" CTA, report flag button, verified badge. |
| **6** | Verifier Quality Queue | `/verifier` | `verifier@msruas.ac.in` | Green accent verifier header, automated check results box, Approve / Request Changes / Reject buttons. |
| **7** | Interactive Simulated UPI Checkout | `/checkout/[id]` | `priya.patel@msruas.ac.in` | Mocked UPI simulator modal, success/failure testing toggles, meetup spot selector. |
| **8** | Single-Sale Sold Protection | `/listings/[id]` | `rohit.kumar@msruas.ac.in` | Prominent "SOLD" banner, checkout CTA disabled, prevention of duplicate purchases. |
| **9** | Real-time Campus Chat | `/messages/[id]` | `priya.patel@msruas.ac.in` | In-app messaging interface tied to specific listing, participant-only access. |
| **10** | Printable University Invoice | `/orders/[id]/invoice` | `priya.patel@msruas.ac.in` | Formal invoice layout with order ID, date, student details, itemized total, and Print PDF button. |
| **11** | Admin Reports & Moderation | `/admin` | `admin@msruas.ac.in` | Burgundy admin theme, reported listings queue, user suspension controls, immutable audit log. |

