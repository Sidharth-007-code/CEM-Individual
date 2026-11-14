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
  isPresentationDemo: boolean;
}

// Helper to generate clean SVG base64 illustrations for demo items
function makeDemoSvg(bg: string, label: string, iconSymbol: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <rect width="400" height="300" fill="${bg}" />
    <rect x="20" y="20" width="360" height="260" rx="16" fill="none" stroke="#000000" stroke-width="4" stroke-dasharray="8 8" opacity="0.4" />
    <circle cx="200" cy="130" r="55" fill="#FFFFFF" stroke="#000000" stroke-width="4" />
    <text x="200" y="145" font-family="system-ui, sans-serif" font-size="44" text-anchor="middle">${iconSymbol}</text>
    <rect x="60" y="215" width="280" height="40" rx="10" fill="#000000" />
    <text x="200" y="240" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${label.toUpperCase()}</text>
    <rect x="290" y="35" width="80" height="24" rx="6" fill="#FFD027" stroke="#000000" stroke-width="2" />
    <text x="330" y="51" font-family="monospace" font-size="10" font-weight="bold" fill="#000000" text-anchor="middle">DEMO GEAR</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
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
    thumbnail: makeDemoSvg("#FFD027", "Game Zone Controller", "🎮"),
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
    thumbnail: makeDemoSvg("#DDD6FE", "Casio fx-991EX", "🔢"),
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
    thumbnail: makeDemoSvg("#86EFAC", "B.S. Grewal Math", "📚"),
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
    thumbnail: makeDemoSvg("#FDA4AF", "A3 Drafting Board", "📐"),
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
    thumbnail: makeDemoSvg("#E0F2FE", "Lab Coat & Goggles", "🥼"),
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
    thumbnail: makeDemoSvg("#FDE68A", "Electric Kettle", "☕"),
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
    thumbnail: makeDemoSvg("#C7D2FE", "Campus Bicycle", "🚲"),
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
    thumbnail: makeDemoSvg("#FBCFE8", "Study Headphones", "🎧"),
    isPresentationDemo: true,
  },
];

/**
 * Seeds or restores the 8 presentation demo products into Firestore.
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
    }

    await batch.commit();
    return { count: PRESENTATION_DEMO_PRODUCTS.length, success: true };
  } catch (err: any) {
    console.error("[PresentationDemo] Failed to populate:", err);
    return { count: 0, success: false, error: err.message || "Failed to populate demo data" };
  }
}

/**
 * Deletes all presentation demo products from Firestore.
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
    demoDocs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
    return { deletedCount: demoDocs.length, success: true };
  } catch (err: any) {
    console.error("[PresentationDemo] Failed to delete:", err);
    return { deletedCount: 0, success: false, error: err.message || "Failed to delete demo data" };
  }
}

