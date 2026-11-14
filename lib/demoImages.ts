/**
 * High-Fidelity SVG Product Illustrations for Demo & Seeded Listings
 * Provides 3 distinct angle views (Front, Detail/Angle, Specs/Accessories) for every item.
 */

interface SvgOptions {
  bgColor: string;
  accentColor: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: string;
  viewAngle: string;
  details: string[];
}

function renderProductSvg(opts: SvgOptions): string {
  const { bgColor, accentColor, badge, title, subtitle, icon, viewAngle, details } = opts;

  const detailElements = details
    .map(
      (d, i) =>
        `<text x="40" y="${230 + i * 18}" font-family="monospace" font-size="11" font-weight="bold" fill="#000000" opacity="0.85">● ${d}</text>`
    )
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <pattern id="grid_${Math.abs(hashCode(title + viewAngle))}" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000000" stroke-width="0.75" opacity="0.08" />
    </pattern>
    <filter id="shadow_${Math.abs(hashCode(title + viewAngle))}" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#000000" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="600" height="450" fill="${bgColor}" />
  <rect width="600" height="450" fill="url(#grid_${Math.abs(hashCode(title + viewAngle))})" />
  <rect x="12" y="12" width="576" height="426" rx="20" fill="none" stroke="#000000" stroke-width="3" />

  <!-- Top Badges Bar -->
  <g transform="translate(30, 30)">
    <rect x="0" y="0" width="160" height="28" rx="8" fill="#000000" />
    <text x="80" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MSRUAS VERIFIED</text>
    
    <rect x="170" y="0" width="130" height="28" rx="8" fill="${accentColor}" stroke="#000000" stroke-width="2" />
    <text x="235" y="18" font-family="monospace" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">${viewAngle.toUpperCase()}</text>
  </g>

  <!-- Category Tag -->
  <g transform="translate(430, 30)">
    <rect x="0" y="0" width="140" height="28" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
    <text x="70" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#000000" text-anchor="middle">${badge.toUpperCase()}</text>
  </g>

  <!-- Product Illustration Card Center -->
  <g transform="translate(300, 155)">
    <circle cx="0" cy="0" r="70" fill="#FFFFFF" stroke="#000000" stroke-width="3.5" filter="url(#shadow_${Math.abs(hashCode(title + viewAngle))})" />
    <circle cx="0" cy="0" r="58" fill="${accentColor}" opacity="0.35" />
    <text x="0" y="18" font-family="system-ui, sans-serif" font-size="52" text-anchor="middle">${icon}</text>
  </g>

  <!-- Specs Card Bottom -->
  <g transform="translate(30, 255)">
    <rect x="0" y="0" width="540" height="150" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="2.5" filter="url(#shadow_${Math.abs(hashCode(title + viewAngle))})" />
    
    <text x="24" y="32" font-family="system-ui, sans-serif" font-size="17" font-weight="900" fill="#000000">${title}</text>
    <text x="24" y="52" font-family="monospace" font-size="11" font-weight="bold" fill="#525252">${subtitle}</text>

    <line x1="24" y1="64" x2="516" y2="64" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.3" />

    ${detailElements}

    <rect x="420" y="90" width="100" height="40" rx="10" fill="#000000" />
    <text x="470" y="114" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FFD027" text-anchor="middle">PEER READY</text>
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface ProductImageSet {
  thumbnail: string;
  images: Array<{
    id: string;
    name: string;
    dataUrl: string;
    sizeKb: number;
  }>;
}

/**
 * Returns a complete 3-image photo set for any given listing key or product type.
 */
export function getProductImageSet(key: string): ProductImageSet {
  const norm = key.toLowerCase();

  // 1. Controller / Gamepad
  if (norm.includes("gamepad") || norm.includes("controller")) {
    const img1 = renderProductSvg({
      bgColor: "#FEF9C3", // Yellow light
      accentColor: "#FFD027",
      badge: "Gaming Gear",
      title: "Pro Wireless Gaming Controller",
      subtitle: "Game Zone Edition • Low-Latency Dual Wireless",
      icon: "🎮",
      viewAngle: "Front Angle",
      details: [
        "Textured ergonomic rubber grip handles",
        "Hall-effect responsive dual analog thumbsticks",
        "Compatible with PC, Steam & Mobile",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FEF08A",
      accentColor: "#F59E0B",
      badge: "Gaming Gear",
      title: "Tactile Shoulder Triggers & D-Pad",
      subtitle: "Close-Up Control Deck & Mechanics",
      icon: "🕹️",
      viewAngle: "Bumper Controls",
      details: [
        "Micro-switch tactile bumper buttons (L1/R1, L2/R2)",
        "Type-C fast charging port (2-hr charge = 18 hrs play)",
        "Zero-drift calibrated precision sensor",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#FDE047",
      accentColor: "#10B981",
      badge: "Gaming Gear",
      title: "Controller Accessories & Travel Case",
      subtitle: "Complete Hostel Tournament Kit",
      icon: "🎒",
      viewAngle: "Case & Cables",
      details: [
        "Hard-shell ballistic nylon travel pouch included",
        "Braided 2m USB-A to USB-C charging cable",
        "Extra set of interchangeable concave thumb grips",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "front_angle.jpg", dataUrl: img1, sizeKb: 72 },
        { id: "img_2", name: "triggers_detail.jpg", dataUrl: img2, sizeKb: 78 },
        { id: "img_3", name: "case_accessories.jpg", dataUrl: img3, sizeKb: 75 },
      ],
    };
  }

  // 2. Calculator (Casio fx-991EX / ClassWiz)
  if (norm.includes("calc") || norm.includes("casio") || norm.includes("991ex")) {
    const img1 = renderProductSvg({
      bgColor: "#EDE9FE", // Purple light
      accentColor: "#A78BFA",
      badge: "Calculators",
      title: "Casio fx-991EX ClassWiz",
      subtitle: "High-Resolution Natural Textbook Display",
      icon: "🔢",
      viewAngle: "Front Face",
      details: [
        "552 Mathematical & engineering functions",
        "Dual power: Integrated solar cell & long-life LR44 battery",
        "Approved for MSRUAS mid-terms & final exams",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#DDD6FE",
      accentColor: "#8B5CF6",
      badge: "Calculators",
      title: "High-Resolution LCD Matrix Screen",
      subtitle: "Natural Display with Matrix & Integrals",
      icon: "📐",
      viewAngle: "Screen Display",
      details: [
        "Natural Textbook Display shows fractions and square roots as in books",
        "QR Code generator for smartphone curve plotting",
        "Spreadsheet and 4x4 matrix calculations active",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#C4B5FD",
      accentColor: "#10B981",
      badge: "Calculators",
      title: "Protective Hard Case & Formulas",
      subtitle: "Hard Slide-on Cover with Verification Seal",
      icon: "🛡️",
      viewAngle: "Back & Case",
      details: [
        "Original slide-on hard protective cover",
        "Quick reference scientific constants guide intact",
        "Tested keyboard contacts & pristine back serial sticker",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "calculator_front.jpg", dataUrl: img1, sizeKb: 68 },
        { id: "img_2", name: "screen_closeup.jpg", dataUrl: img2, sizeKb: 74 },
        { id: "img_3", name: "slide_case.jpg", dataUrl: img3, sizeKb: 70 },
      ],
    };
  }

  // 3. Math Textbooks (B.S. Grewal)
  if (norm.includes("math") || norm.includes("grewal")) {
    const img1 = renderProductSvg({
      bgColor: "#DCFCE7", // Mint light
      accentColor: "#86EFAC",
      badge: "Textbooks",
      title: "Higher Engineering Mathematics (44th Ed)",
      subtitle: "Dr. B.S. Grewal • Khanna Publishers",
      icon: "📚",
      viewAngle: "Front Cover",
      details: [
        "Covers complete 1st & 2nd Year RUAS engineering mathematics syllabus",
        "Differential calculus, vector algebra & transform calculus",
        "Complete condition: No missing or torn pages",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#BBF7D0",
      accentColor: "#22C55E",
      badge: "Textbooks",
      title: "Solved Model Papers & Formulas",
      subtitle: "Inside Content & Clean Notes",
      icon: "📖",
      viewAngle: "Open Pages",
      details: [
        "Includes previous 5 years solved university exam papers",
        "Light pencil reference marks on select exercise problems",
        "Binding fully intact with strong cloth spine",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#86EFAC",
      accentColor: "#FFD027",
      badge: "Textbooks",
      title: "Spine & Page Edge Condition",
      subtitle: "1300+ Pages Complete Volume",
      icon: "📑",
      viewAngle: "Spine View",
      details: [
        "Clean white paper block without water damage or stains",
        "Original edition hologram on inner title page",
        "Bookmarked with chapter formula quick sheets",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "book_cover.jpg", dataUrl: img1, sizeKb: 75 },
        { id: "img_2", name: "open_pages.jpg", dataUrl: img2, sizeKb: 80 },
        { id: "img_3", name: "spine_condition.jpg", dataUrl: img3, sizeKb: 72 },
      ],
    };
  }

  // 4. Data Structures Book (Karumanchi)
  if (norm.includes("data structures") || norm.includes("karumanchi") || norm.includes("book_02")) {
    const img1 = renderProductSvg({
      bgColor: "#CCFBF1", // Teal light
      accentColor: "#5EEAD4",
      badge: "Textbooks",
      title: "Data Structures & Algorithms Made Easy",
      subtitle: "Narasimha Karumanchi • Coding Placement Guide",
      icon: "💻",
      viewAngle: "Front Cover",
      details: [
        "The standard reference for technical coding interviews & placement prep",
        "Covers Arrays, Linked Lists, Stacks, Trees, Graphs & Dynamic Programming",
        "All code solutions in C/C++ with Big-O complexity analysis",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#99F6E4",
      accentColor: "#14B8A6",
      badge: "Textbooks",
      title: "Algorithm Diagrams & Problem Sets",
      subtitle: "Interview Question Chapters",
      icon: "🌳",
      viewAngle: "Inside Pages",
      details: [
        "Step-by-step memory diagrams for recursion & pointer manipulation",
        "Multiple complexity solution comparison per problem",
        "No ink highlighter bleed; excellent condition",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#5EEAD4",
      accentColor: "#FFD027",
      badge: "Textbooks",
      title: "Cheat Sheets & Complexity Tables",
      subtitle: "Back Cover & Summary Cards",
      icon: "📊",
      viewAngle: "Cheat Sheets",
      details: [
        "Includes pull-out Big-O algorithm complexity cheat sheet",
        "Sorting & searching decision flowchart on rear endpapers",
        "Original publisher edition with verified ISBN",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "karumanchi_cover.jpg", dataUrl: img1, sizeKb: 74 },
        { id: "img_2", name: "algorithm_diagrams.jpg", dataUrl: img2, sizeKb: 79 },
        { id: "img_3", name: "cheatsheet_back.jpg", dataUrl: img3, sizeKb: 73 },
      ],
    };
  }

  // 5. Drafting Board / Drafter (Rotring / Omega)
  if (norm.includes("draft") || norm.includes("rotring") || norm.includes("board")) {
    const img1 = renderProductSvg({
      bgColor: "#FFE4E6", // Rose light
      accentColor: "#FDA4AF",
      badge: "Drafting Gear",
      title: "Rotring Rapid A3 Drafting Board",
      subtitle: "Precision Engineering Drawing Machine",
      icon: "📐",
      viewAngle: "Board Overview",
      details: [
        "A3 size drafting board with parallel guide track and locking brake",
        "Dual magnetic clamping strips with paper corner clip",
        "Used for Engineering Graphics lab at Peenya & Mathikere campuses",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FECDD3",
      accentColor: "#FB7185",
      badge: "Drafting Gear",
      title: "360° Mini Drafter & Steel Arms",
      subtitle: "Adjustable Protractor Head",
      icon: "📏",
      viewAngle: "Drafter Head",
      details: [
        "Precision circular protractor head with locking knob",
        "Stainless steel scale arms with mm/inch laser-etched markings",
        "Smooth gliding mechanism without backlash or slack",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#FDA4AF",
      accentColor: "#10B981",
      badge: "Drafting Gear",
      title: "Waterproof Sheet Tube & Set Squares",
      subtitle: "Complete Engineering Drawing Kit",
      icon: "🧰",
      viewAngle: "Tube & Tools",
      details: [
        "Expandable waterproof plastic sheet holder tube with carry strap",
        "30°/60° and 45° acrylic set-squares and French curves included",
        "Original heavy-duty table clamp bracket",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "drafting_board.jpg", dataUrl: img1, sizeKb: 76 },
        { id: "img_2", name: "drafter_head.jpg", dataUrl: img2, sizeKb: 81 },
        { id: "img_3", name: "sheet_tube.jpg", dataUrl: img3, sizeKb: 75 },
      ],
    };
  }

  // 6. Lab Coat & Goggles
  if (norm.includes("coat") || norm.includes("lab") || norm.includes("goggles")) {
    const img1 = renderProductSvg({
      bgColor: "#F0F9FF", // Sky light
      accentColor: "#BAE6FD",
      badge: "Uniform & Safety",
      title: "MSRUAS Official White Lab Coat",
      subtitle: "Pure Cotton • Required for Chemistry & Biology Labs",
      icon: "🥼",
      viewAngle: "Coat Front",
      details: [
        "Standard university specification white laboratory apron",
        "100% heavy-duty washable drill cotton with heat-pressed collar",
        "Washed, starched, and sanitized; ready for immediate lab use",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#E0F2FE",
      accentColor: "#38BDF8",
      badge: "Uniform & Safety",
      title: "Embroidered MSRUAS Pocket Crest",
      subtitle: "Official Department Insignia Detail",
      icon: "🏷️",
      viewAngle: "Pocket Crest",
      details: [
        "Gold and blue embroidered university crest on chest pocket",
        "Deep reinforced twin waist pockets for pens and spatulas",
        "Full set of durable, scratch-resistant front buttons",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#BAE6FD",
      accentColor: "#FFD027",
      badge: "Uniform & Safety",
      title: "Anti-Scratch Chemical Splash Goggles",
      subtitle: "Certified Eye Protection Gear",
      icon: "🥽",
      viewAngle: "Eye Goggles",
      details: [
        "Polycarbonate clear anti-fog safety lenses",
        "Soft PVC frame with indirect ventilation ports",
        "Adjustable elastic head strap fits comfortably over eyeglasses",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "labcoat_front.jpg", dataUrl: img1, sizeKb: 71 },
        { id: "img_2", name: "crest_detail.jpg", dataUrl: img2, sizeKb: 77 },
        { id: "img_3", name: "safety_goggles.jpg", dataUrl: img3, sizeKb: 73 },
      ],
    };
  }

  // 7. Electric Kettle
  if (norm.includes("kettle") || norm.includes("prestige") || norm.includes("pigeon")) {
    const img1 = renderProductSvg({
      bgColor: "#FEF3C7", // Amber light
      accentColor: "#FDE68A",
      badge: "Hostel Essentials",
      title: "1.5L Stainless Steel Electric Kettle",
      subtitle: "1500W Fast Boil • Auto Cut-Off Protection",
      icon: "☕",
      viewAngle: "Kettle Body",
      details: [
        "Food-grade 304 stainless steel interior chamber",
        "Boils 1.5L water in under 3 minutes for noodles, tea & coffee",
        "Concealed heating element prevents mineral limescale buildup",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FDE68A",
      accentColor: "#F59E0B",
      badge: "Hostel Essentials",
      title: "Wide Mouth & Filter Spout",
      subtitle: "Easy Clean Interior & Pour Spout",
      icon: "🫖",
      viewAngle: "Spout & Interior",
      details: [
        "One-touch spring-assisted lid release button",
        "Fine stainless steel spout mesh filters all impurities",
        "Cool-touch heat-insulated ergonomic handle with LED switch",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#FCD34D",
      accentColor: "#10B981",
      badge: "Hostel Essentials",
      title: "360° Swivel Base & Safety Cut-off",
      subtitle: "Hostel Approved Electrical Compliance",
      icon: "⚡",
      viewAngle: "Power Base",
      details: [
        "Cordless 360-degree swivel power base with cord wrap storage",
        "Automatic boil-dry shutoff mechanism for hostel room safety",
        "ISI certified heavy-duty 3-pin plug and grounded cord",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "kettle_body.jpg", dataUrl: img1, sizeKb: 73 },
        { id: "img_2", name: "kettle_interior.jpg", dataUrl: img2, sizeKb: 76 },
        { id: "img_3", name: "power_base.jpg", dataUrl: img3, sizeKb: 72 },
      ],
    };
  }

  // 8. Mountain Bicycle
  if (norm.includes("cycle") || norm.includes("bicycle") || norm.includes("hercules") || norm.includes("hero")) {
    const img1 = renderProductSvg({
      bgColor: "#E0E7FF", // Indigo light
      accentColor: "#C7D2FE",
      badge: "Campus Mobility",
      title: "Mountain Bicycle (Campus Commuter)",
      subtitle: "21-Speed Gears • Front Suspension Fork",
      icon: "🚲",
      viewAngle: "Side Profile",
      details: [
        "Lightweight high-tensile steel frame with sport geometry",
        "Front suspension shock absorbers for smooth riding over speed bumps",
        "Ideal for daily commute between hostels and academic blocks",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#C7D2FE",
      accentColor: "#6366F1",
      badge: "Campus Mobility",
      title: "Shimano Gear Shifters & Dual Brakes",
      subtitle: "Cockpit & Derailleur Controls",
      icon: "⚙️",
      viewAngle: "Gears & Brakes",
      details: [
        "Smooth index thumb shifters with 3x7 gear configuration",
        "Front and rear mechanical disc brakes with fresh brake pads",
        "Ergonomic rubber handgrips and safety bell installed",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#A5B4FC",
      accentColor: "#FFD027",
      badge: "Campus Mobility",
      title: "Heavy Combination Lock & Gate Pass",
      subtitle: "Parking Security Accessories",
      icon: "🔒",
      viewAngle: "Lock & Stand",
      details: [
        "Includes heavy-duty 5-digit resettable braided steel cable lock",
        "Sturdy steel side stand and front/rear splash mudguards",
        "Verified campus parking sticker for security gate clearance",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "bike_profile.jpg", dataUrl: img1, sizeKb: 77 },
        { id: "img_2", name: "bike_gears.jpg", dataUrl: img2, sizeKb: 82 },
        { id: "img_3", name: "bike_lock.jpg", dataUrl: img3, sizeKb: 78 },
      ],
    };
  }

  // 9. Noise-Cancelling Headphones
  if (norm.includes("headphone") || norm.includes("sony")) {
    const img1 = renderProductSvg({
      bgColor: "#FCE7F3", // Pink light
      accentColor: "#FBCFE8",
      badge: "Audio Gear",
      title: "Sony Noise-Cancelling Headphones",
      subtitle: "Active Noise Cancellation • 30-Hr Battery Life",
      icon: "🎧",
      viewAngle: "Headset Front",
      details: [
        "Digital Active Noise Cancellation eliminates library background noise",
        "Ultra-soft pressure-relieving foam earpads for long study sessions",
        "High-resolution 40mm audio drivers with balanced acoustic tuning",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FBCFE8",
      accentColor: "#EC4899",
      badge: "Audio Gear",
      title: "Touch Sensor & Mic Controls",
      subtitle: "Built-in Mic for Online Lectures",
      icon: "🎙️",
      viewAngle: "Controls & Mics",
      details: [
        "Touch sensor panel on right cup to pause, play and change tracks",
        "Dual beamforming microphones for crystal-clear Zoom viva calls",
        "USB-C quick charge: 10 mins charge provides 5 hours playback",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#F472B6",
      accentColor: "#10B981",
      badge: "Audio Gear",
      title: "Foldable Design & Travel Case",
      subtitle: "Complete Carrying Accessories",
      icon: "🧳",
      viewAngle: "Case & Cables",
      details: [
        "Swivel-foldable earcups fit inside hard zipper travel case",
        "Includes 3.5mm gold-plated auxiliary cable for wired lab sessions",
        "Original USB charging cable and airplane adapter included",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "headphones_front.jpg", dataUrl: img1, sizeKb: 74 },
        { id: "img_2", name: "touch_controls.jpg", dataUrl: img2, sizeKb: 79 },
        { id: "img_3", name: "carrying_case.jpg", dataUrl: img3, sizeKb: 75 },
      ],
    };
  }

  // 10. Study Lamp
  if (norm.includes("lamp") || norm.includes("led")) {
    const img1 = renderProductSvg({
      bgColor: "#FEF9C3",
      accentColor: "#FEF08A",
      badge: "Room Essentials",
      title: "LED Desk Study Lamp with USB",
      subtitle: "Eye-Care Diffused Light • 3 Brightness Levels",
      icon: "💡",
      viewAngle: "Lamp Upright",
      details: [
        "Flicker-free diffused warm LED light prevents study eye strain",
        "Flexible 360-degree silicone gooseneck adjusts to any angle",
        "Built-in organizer base holds pens, rulers, and sticky notes",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FEF08A",
      accentColor: "#F59E0B",
      badge: "Room Essentials",
      title: "Touch Dimming & Color Modes",
      subtitle: "Warm, Natural & Cool Color Temps",
      icon: "✨",
      viewAngle: "Lighting Modes",
      details: [
        "Touch-sensitive brightness slider with smooth continuous dimming",
        "3 color temperature settings (3000K warm, 4500K reading, 6000K study)",
        "Memory function restores your previous brightness setting automatically",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#FDE047",
      accentColor: "#10B981",
      badge: "Room Essentials",
      title: "USB Output Port & Phone Stand",
      subtitle: "Convenient Desk Charging Station",
      icon: "🔌",
      viewAngle: "Base & Charger",
      details: [
        "Rear 5V/2A USB output port charges phone while studying",
        "Integrated front lip serves as hands-free phone/tablet video stand",
        "Weighted non-slip rubber base stays firm on hostel study desks",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "lamp_front.jpg", dataUrl: img1, sizeKb: 72 },
        { id: "img_2", name: "lamp_modes.jpg", dataUrl: img2, sizeKb: 77 },
        { id: "img_3", name: "lamp_base.jpg", dataUrl: img3, sizeKb: 73 },
      ],
    };
  }

  // 11. Multimeter
  if (norm.includes("multimeter") || norm.includes("meter")) {
    const img1 = renderProductSvg({
      bgColor: "#FEF3C7",
      accentColor: "#FDE68A",
      badge: "Lab Instruments",
      title: "Digital Multimeter with Test Probes",
      subtitle: "Autoranging DMM • AC/DC Volts, Amps & Ohms",
      icon: "⚡",
      viewAngle: "Instrument Front",
      details: [
        "Large high-contrast 2000-count digital LCD with bright backlight",
        "Measures AC/DC voltage, DC current, resistance, diode & continuity",
        "Protective thick yellow shock-absorbing rubber bumper holster",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#FDE68A",
      accentColor: "#F59E0B",
      badge: "Lab Instruments",
      title: "Gold-Plated Needle Probes & Leads",
      subtitle: "Heavy-Duty Insulated Test Wires",
      icon: "🔌",
      viewAngle: "Probes & Leads",
      details: [
        "CAT III 600V safety rated high-flexibility silicone leads",
        "Sharp needle-point tips for breadboard and SMD circuit testing",
        "Snap-on alligator clips included for hands-free circuit measurements",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#FCD34D",
      accentColor: "#10B981",
      badge: "Lab Instruments",
      title: "Transistor Socket & Kickstand",
      subtitle: "hFE Testing & Benchtop Stand",
      icon: "📟",
      viewAngle: "Stand & Socket",
      details: [
        "Front hFE socket tests NPN and PNP transistor gain factors",
        "Built-in audible continuity beeper with fast response time",
        "Fold-out rear kickstand allows easy hands-free viewing on lab benches",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "multimeter_front.jpg", dataUrl: img1, sizeKb: 73 },
        { id: "img_2", name: "test_leads.jpg", dataUrl: img2, sizeKb: 76 },
        { id: "img_3", name: "bench_stand.jpg", dataUrl: img3, sizeKb: 72 },
      ],
    };
  }

  // 12. Microcontroller 8051 Kit
  if (norm.includes("micro") || norm.includes("8051")) {
    const img1 = renderProductSvg({
      bgColor: "#E0F2FE",
      accentColor: "#BAE6FD",
      badge: "Hardware Kits",
      title: "Microcontroller 8051 Development Kit",
      subtitle: "AT89S52 Trainer Board • 4th Sem ECE/CSE Labs",
      icon: "🖲️",
      viewAngle: "Board Overview",
      details: [
        "Onboard 40-pin ZIF socket holding AT89S52 microcontroller",
        "11.0592 MHz crystal oscillator for standard serial baud rates",
        "8 status LEDs, 4 tactile pushbuttons & power supply regulator",
      ],
    });
    const img2 = renderProductSvg({
      bgColor: "#BAE6FD",
      accentColor: "#38BDF8",
      badge: "Hardware Kits",
      title: "Breadboard & 50+ Jumper Wires",
      subtitle: "Interfacing & Prototyping Module",
      icon: "🧵",
      viewAngle: "Breadboard & Wire",
      details: [
        "840-tie point solderless white breadboard for custom circuits",
        "Bundle of 50 male-to-male and male-to-female multicolor jumper wires",
        "Dual 7-segment LED display and buzzer interfacing modules",
      ],
    });
    const img3 = renderProductSvg({
      bgColor: "#7DD3FC",
      accentColor: "#FFD027",
      badge: "Hardware Kits",
      title: "USB Programmer & Component Box",
      subtitle: "Complete Hardware Experimenter Kit",
      icon: "📦",
      viewAngle: "Kit Box & Cable",
      details: [
        "USBasp ISP programmer cable connects directly to PC laptops",
        "Drivers and sample Keil uVision C code tutorial on USB",
        "Divided translucent plastic component organizer box",
      ],
    });

    return {
      thumbnail: img1,
      images: [
        { id: "img_1", name: "8051_board.jpg", dataUrl: img1, sizeKb: 75 },
        { id: "img_2", name: "breadboard_wires.jpg", dataUrl: img2, sizeKb: 80 },
        { id: "img_3", name: "programmer_box.jpg", dataUrl: img3, sizeKb: 76 },
      ],
    };
  }

  // Default Fallback
  const defaultTitle = key.replace(/^(demo_|lst_)/, "").replace(/_/g, " ").toUpperCase();
  const def1 = renderProductSvg({
    bgColor: "#FEF9C3",
    accentColor: "#FFD027",
    badge: "Verified Item",
    title: defaultTitle,
    subtitle: "MSRUAS Verified Student Peer Listing",
    icon: "📦",
    viewAngle: "Primary View",
    details: [
      "Physical item inspected for peer exchange compliance",
      "Fair-trade academic price evaluated by AI and verifier",
      "Ready for safe handover at designated campus meetup spots",
    ],
  });
  const def2 = renderProductSvg({
    bgColor: "#EDE9FE",
    accentColor: "#A78BFA",
    badge: "Verified Item",
    title: defaultTitle + " Detail",
    subtitle: "Material & Usability Verification",
    icon: "🔍",
    viewAngle: "Detail Angle",
    details: [
      "Clean item condition matching seller description",
      "All essential parts, accessories, and cords verified",
      "CCTV-monitored campus exchange spot recommended",
    ],
  });
  const def3 = renderProductSvg({
    bgColor: "#DCFCE7",
    accentColor: "#86EFAC",
    badge: "Verified Item",
    title: defaultTitle + " Package",
    subtitle: "Included Accessories & Invoicing",
    icon: "📋",
    viewAngle: "Kit & Record",
    details: [
      "Single-sale exclusive student academic exchange",
      "Official printable university invoice generated upon checkout",
      "Zero platform fees or intermediary deductions",
    ],
  });

  return {
    thumbnail: def1,
    images: [
      { id: "img_1", name: "item_view1.jpg", dataUrl: def1, sizeKb: 70 },
      { id: "img_2", name: "item_view2.jpg", dataUrl: def2, sizeKb: 75 },
      { id: "img_3", name: "item_view3.jpg", dataUrl: def3, sizeKb: 72 },
    ],
  };
}
