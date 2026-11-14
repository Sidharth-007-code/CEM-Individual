import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validateListingAI } from "@/lib/ai";
import { ListingCategory, ListingCondition } from "@/types/listing";
import { getProductImageSet } from "@/lib/demoImages";

export interface PresentationDemoItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  category: ListingCategory;
  condition: ListingCondition;
  price: number;
  status: "available";
  thumbnail: string;
  images: string[];
  isPresentationDemo: boolean;
}

export const PRESENTATION_DEMO_PRODUCTS: PresentationDemoItem[] = [
  {
    id: "demo_gamepad_01",
    sellerId: "usr_student_1",
    sellerName: "Shreyas Adiga",
    sellerPhone: "+91 9876543210",
    title: "Pro Wireless Gaming Controller (Game Zone Edition)",
    description: "Custom tactile low-latency dual wireless controller with textured grips and USB-C fast charging. Perfect for hostel gaming sessions and weekend tournaments.",
    category: "Electronics & Calculators",
    condition: "like_new",
    price: 1200,
    status: "available",
    thumbnail: getProductImageSet("gamepad").thumbnail,
    images: getProductImageSet("gamepad").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_calc_02",
    sellerId: "usr_student_1",
    sellerName: "Aarav Sharma",
    sellerPhone: "+91 9876543210",
    title: "Casio fx-991EX ClassWiz High-Resolution Scientific Calculator",
    description: "Original Casio fx-991EX with high-resolution LCD display and 552 mathematical functions. Dual solar and battery power. Cleared for all RUAS mid-term exams.",
    category: "Electronics & Calculators",
    condition: "like_new",
    price: 850,
    status: "available",
    thumbnail: getProductImageSet("calc").thumbnail,
    images: getProductImageSet("calc").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_math_03",
    sellerId: "usr_student_2",
    sellerName: "Priya Patel",
    sellerPhone: "+91 9876543211",
    title: "B.S. Grewal Higher Engineering Mathematics (44th Ed.)",
    description: "Standard textbook for 1st & 2nd year engineering mathematics. Clean pages, no torn leaves, includes solved university model papers and reference formulas.",
    category: "Textbooks & Notes",
    condition: "good",
    price: 450,
    status: "available",
    thumbnail: getProductImageSet("math").thumbnail,
    images: getProductImageSet("math").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_drafter_04",
    sellerId: "usr_student_3",
    sellerName: "Rohit Kumar",
    sellerPhone: "+91 9876543212",
    title: "Rotring Rapid A3 Engineering Drafting Board & Mini Drafter",
    description: "Sturdy precision drafting machine with stainless steel scale arms and clamp. Used for mechanical and civil engineering drawing labs at Peenya Campus.",
    category: "Stationery & Drafting",
    condition: "good",
    price: 1400,
    status: "available",
    thumbnail: getProductImageSet("drafter").thumbnail,
    images: getProductImageSet("drafter").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_labcoat_05",
    sellerId: "usr_student_2",
    sellerName: "Priya Patel",
    sellerPhone: "+91 9876543211",
    title: "MSRUAS Standard White Lab Coat (Size 38) & Chemical Goggles",
    description: "Pure cotton university laboratory coat with MSRUAS insignia. Washed, starched and paired with anti-scratch safety eye goggles for Chemistry and Physics labs.",
    category: "Lab Equipment & Uniforms",
    condition: "like_new",
    price: 350,
    status: "available",
    thumbnail: getProductImageSet("labcoat").thumbnail,
    images: getProductImageSet("labcoat").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_kettle_06",
    sellerId: "usr_student_1",
    sellerName: "Aarav Sharma",
    sellerPhone: "+91 9876543210",
    title: "Prestige 1.5L Stainless Steel Auto Cut-off Electric Kettle",
    description: "Compact 1500W electric kettle with 360-degree swivel base. Tested and safe for Ganga & Kaveri hostel rooms. Boils water for tea/coffee in 2 minutes.",
    category: "Hostel & Room Essentials",
    condition: "good",
    price: 550,
    status: "available",
    thumbnail: getProductImageSet("kettle").thumbnail,
    images: getProductImageSet("kettle").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_cycle_07",
    sellerId: "usr_student_3",
    sellerName: "Rohit Kumar",
    sellerPhone: "+91 9876543212",
    title: "Hero Sprint 26T Mountain Bicycle (Campus Commuter)",
    description: "Single speed cycle with front suspension fork, dual wire brakes, and mudguards. Includes a heavy duty combination cable lock for parking at Main Gate.",
    category: "Bicycles & Mobility",
    condition: "fair",
    price: 3200,
    status: "available",
    thumbnail: getProductImageSet("cycle").thumbnail,
    images: getProductImageSet("cycle").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
  {
    id: "demo_headphones_08",
    sellerId: "usr_student_1",
    sellerName: "Shreyas Adiga",
    sellerPhone: "+91 9876543210",
    title: "Sony Noise-Cancelling Over-Ear Study Headphones",
    description: "Active noise cancellation for deep focus sessions at the campus library. 30-hour battery life with USB-C quick charge and carrying pouch included.",
    category: "Electronics & Calculators",
    condition: "like_new",
    price: 4500,
    status: "available",
    thumbnail: getProductImageSet("headphones").thumbnail,
    images: getProductImageSet("headphones").images.map((i) => i.dataUrl),
    isPresentationDemo: true,
  },
];

/**
 * Seeds or restores the 8 presentation demo products into Firestore with matching multiple gallery images.
 */
export async function populatePresentationDemoProducts(): Promise<{ count: number; success: boolean; error?: string }> {
  try {
    const batch = writeBatch(db);

    for (const item of PRESENTATION_DEMO_PRODUCTS) {
      const docRef = doc(db, "listings", item.id);
      const aiResult = validateListingAI({
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        price: item.price,
        imageCount: 3,
      });

      batch.set(
        docRef,
        {
          ...item,
          reportCount: 0,
          aiValidation: aiResult,
          aiTags: aiResult.suggestedTags,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Populate 3 distinct gallery images in the subcollection
      const imgSet = getProductImageSet(item.id);
      for (const img of imgSet.images) {
        const subDocRef = doc(db, `listings/${item.id}/images`, img.id);
        batch.set(
          subDocRef,
          {
            id: img.id,
            name: img.name,
            dataUrl: img.dataUrl,
            sizeKb: img.sizeKb,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    await batch.commit();
    return { count: PRESENTATION_DEMO_PRODUCTS.length, success: true };
  } catch (err: any) {
    console.error("[PresentationDemo] Failed to populate:", err);
    return { count: 0, success: false, error: err.message || "Failed to populate demo data" };
  }
}

/**
 * Deletes all presentation demo products from Firestore and clears their subcollections.
 */
export async function deleteAllPresentationDemoProducts(): Promise<{ deletedCount: number; success: boolean; error?: string }> {
  try {
    const listingsRef = collection(db, "listings");
    // Match by isPresentationDemo flag or by demo prefix ID
    const snap = await getDocs(listingsRef);
    const demoDocs = snap.docs.filter((d) => {
      const data = d.data();
      return data.isPresentationDemo === true || d.id.startsWith("demo_");
    });

    if (demoDocs.length === 0) {
      return { deletedCount: 0, success: true };
    }

    const batch = writeBatch(db);
    for (const d of demoDocs) {
      // Clear subcollection images
      const subSnap = await getDocs(collection(db, `listings/${d.id}/images`));
      subSnap.forEach((imgDoc) => {
        batch.delete(imgDoc.ref);
      });
      batch.delete(d.ref);
    }

    await batch.commit();
    return { deletedCount: demoDocs.length, success: true };
  } catch (err: any) {
    console.error("[PresentationDemo] Failed to delete:", err);
    return { deletedCount: 0, success: false, error: err.message || "Failed to delete demo data" };
  }
}

