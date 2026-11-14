import { ListingCategory } from "@/types/listing";

export interface AcademicBenchmarkItem {
  keywords: string[];
  category: ListingCategory;
  averagePrice: number;
  fairMin: number;
  fairMax: number;
  typicalLifespanYears: number;
}

export const ACADEMIC_BENCHMARKS: AcademicBenchmarkItem[] = [
  {
    keywords: ["casio", "fx-991ex", "classwiz", "fx991", "calculator", "scientific calculator"],
    category: "Electronics & Calculators",
    averagePrice: 850,
    fairMin: 600,
    fairMax: 1100,
    typicalLifespanYears: 4,
  },
  {
    keywords: ["grewal", "higher engineering mathematics", "bs grewal", "engineering mathematics"],
    category: "Textbooks & Notes",
    averagePrice: 450,
    fairMin: 300,
    fairMax: 650,
    typicalLifespanYears: 5,
  },
  {
    keywords: ["lab coat", "apron", "white coat", "msruas crest", "embroidered crest"],
    category: "Lab Equipment & Uniforms",
    averagePrice: 240,
    fairMin: 150,
    fairMax: 350,
    typicalLifespanYears: 3,
  },
  {
    keywords: ["mini drafter", "drafter", "drawing tube", "sheet holder", "omega drafter"],
    category: "Stationery & Drafting",
    averagePrice: 380,
    fairMin: 250,
    fairMax: 550,
    typicalLifespanYears: 4,
  },
  {
    keywords: ["data structures", "karumanchi", "dsa", "algorithms made easy"],
    category: "Textbooks & Notes",
    averagePrice: 420,
    fairMin: 280,
    fairMax: 550,
    typicalLifespanYears: 4,
  },
  {
    keywords: ["morris mano", "digital logic", "computer design", "mano"],
    category: "Textbooks & Notes",
    averagePrice: 360,
    fairMin: 220,
    fairMax: 480,
    typicalLifespanYears: 5,
  },
  {
    keywords: ["kettle", "electric kettle", "pigeon", "1.5l", "hostel kettle"],
    category: "Hostel & Room Essentials",
    averagePrice: 450,
    fairMin: 300,
    fairMax: 700,
    typicalLifespanYears: 2,
  },
  {
    keywords: ["bicycle", "cycle", "hercules", "roadeo", "gear cycle", "mountain bike"],
    category: "Bicycles & Mobility",
    averagePrice: 3400,
    fairMin: 2200,
    fairMax: 5500,
    typicalLifespanYears: 3,
  },
  {
    keywords: ["multimeter", "digital multimeter", "probes", "voltage tester"],
    category: "Lab Equipment & Uniforms",
    averagePrice: 320,
    fairMin: 200,
    fairMax: 500,
    typicalLifespanYears: 3,
  },
  {
    keywords: ["microcontroller", "8051", "arduino", "breadboard", "development kit"],
    category: "Electronics & Calculators",
    averagePrice: 650,
    fairMin: 450,
    fairMax: 950,
    typicalLifespanYears: 3,
  },
  {
    keywords: ["desk lamp", "study lamp", "led lamp", "table lamp"],
    category: "Hostel & Room Essentials",
    averagePrice: 350,
    fairMin: 200,
    fairMax: 600,
    typicalLifespanYears: 3,
  },
];

export const PROHIBITED_KEYWORDS = [
  { term: "leak", reason: "Potential academic integrity breach (leaked exam/internal keys)" },
  { term: "leaked", reason: "Potential academic integrity breach (leaked exam/internal keys)" },
  { term: "exam paper", reason: "Potential examination misconduct" },
  { term: "question paper leak", reason: "Prohibited examination material" },
  { term: "1st copy", reason: "Counterfeit / unauthorized replica goods" },
  { term: "first copy", reason: "Counterfeit / unauthorized replica goods" },
  { term: "replica", reason: "Counterfeit trademark infringement" },
  { term: "fake", reason: "Non-genuine item flagged" },
  { term: "knockoff", reason: "Counterfeit goods" },
  { term: "vape", reason: "Substance policy violation on university campus" },
  { term: "tobacco", reason: "Restricted tobacco products" },
  { term: "cigarette", reason: "Restricted substance" },
  { term: "alcohol", reason: "Restricted alcoholic beverage" },
  { term: "beer", reason: "Restricted alcoholic beverage" },
  { term: "knife", reason: "Weapon safety violation" },
  { term: "blade", reason: "Sharp object / safety violation" },
  { term: "weapon", reason: "Dangerous goods violation" },
  { term: "cracked", reason: "Pirated digital license or damaged hazard" },
  { term: "pirated", reason: "Intellectual property infringement" },
  { term: "stolen", reason: "Unlawful property transaction" },
];

export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  calculator: ["calc", "casio", "scientific", "fx991", "fx-991", "classwiz", "compute"],
  textbook: ["book", "notes", "edition", "author", "syllabus", "guide", "paperback"],
  maths: ["mathematics", "calculus", "algebra", "differential", "grewal", "kreyszig"],
  drafter: ["drafting", "roller", "scale", "sheet", "drawing", "tube", "engineering drawing"],
  cycle: ["bicycle", "bike", "roadeo", "hercules", "mobility", "wheels"],
  kettle: ["boiling", "heater", "hostel", "tea", "pigeon", "electric"],
  coat: ["apron", "uniform", "lab", "white", "crest", "doctor", "labcoat"],
  lamp: ["light", "led", "desk", "table", "night", "study"],
  dsa: ["data structures", "algorithms", "karumanchi", "coding", "programming", "c++", "java"],
};

export const COURSE_AFFINITY_MAP: Record<string, ListingCategory[]> = {
  computer: ["Textbooks & Notes", "Electronics & Calculators", "Hostel & Room Essentials"],
  mechanical: ["Stationery & Drafting", "Textbooks & Notes", "Electronics & Calculators", "Bicycles & Mobility"],
  electronics: ["Electronics & Calculators", "Lab Equipment & Uniforms", "Textbooks & Notes"],
  civil: ["Stationery & Drafting", "Textbooks & Notes", "Bicycles & Mobility"],
  design: ["Stationery & Drafting", "Hostel & Room Essentials"],
  pharmacy: ["Lab Equipment & Uniforms", "Textbooks & Notes"],
  dental: ["Lab Equipment & Uniforms", "Textbooks & Notes"],
  management: ["Textbooks & Notes", "Hostel & Room Essentials"],
};

