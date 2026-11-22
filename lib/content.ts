export const syllabus={
 Physics:{
  "Class 11":["Units and Measurements","Motion in a Straight Line","Motion in a Plane","Laws of Motion","Work, Energy and Power","System of Particles and Rotational Motion","Gravitation","Mechanical Properties of Solids","Mechanical Properties of Fluids","Thermal Properties of Matter","Thermodynamics","Kinetic Theory","Oscillations","Waves"],
  "Class 12":["Electric Charges and Fields","Electrostatic Potential and Capacitance","Current Electricity","Moving Charges and Magnetism","Magnetism and Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics and Optical Instruments","Wave Optics","Dual Nature of Radiation and Matter","Atoms","Nuclei","Semiconductor Electronics"]
 },
 Chemistry:{
  "Class 11":["Some Basic Concepts of Chemistry","Structure of Atom","Classification of Elements and Periodicity in Properties","Chemical Bonding and Molecular Structure","Chemical Thermodynamics","Equilibrium","Redox Reactions","Organic Chemistry: Some Basic Principles and Techniques","Hydrocarbons"],
  "Class 12":["Solutions","Electrochemistry","Chemical Kinetics","The d- and f-Block Elements","Coordination Compounds","Haloalkanes and Haloarenes","Alcohols, Phenols and Ethers","Aldehydes, Ketones and Carboxylic Acids","Amines","Biomolecules"]
 },
 Mathematics:{
  "Class 11":["Sets","Relations and Functions","Trigonometric Functions","Complex Numbers and Quadratic Equations","Linear Inequalities","Permutations and Combinations","Binomial Theorem","Sequences and Series","Straight Lines","Conic Sections","Introduction to Three Dimensional Geometry","Limits and Derivatives","Statistics","Probability"],
  "Class 12":["Relations and Functions","Inverse Trigonometric Functions","Matrices","Determinants","Continuity and Differentiability","Applications of Derivatives","Integrals","Applications of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Probability"]
 }
} as const;
export type Subject=keyof typeof syllabus;
export const subjects={Physics:[...syllabus.Physics["Class 11"],...syllabus.Physics["Class 12"]],Chemistry:[...syllabus.Chemistry["Class 11"],...syllabus.Chemistry["Class 12"]],Mathematics:[...syllabus.Mathematics["Class 11"],...syllabus.Mathematics["Class 12"]]} as const;
export type Question={id:string;subject:Subject;chapter:string;prompt:string;options:string[];answer:number;explanation:string};
export const questions:Question[]=[{id:'p1',subject:'Physics',chapter:'Current Electricity',prompt:'Two resistors of 3 Ω and 6 Ω are connected in parallel. What is the equivalent resistance?',options:['2 Ω','3 Ω','4.5 Ω','9 Ω'],answer:0,explanation:'1/R = 1/3 + 1/6 = 1/2, so R = 2 Ω.'},{id:'c1',subject:'Chemistry',chapter:'Structure of Atom',prompt:'What is the maximum number of electrons in the n = 2 shell?',options:['2','4','8','18'],answer:2,explanation:'2n² = 2 × 2² = 8.'},{id:'m1',subject:'Mathematics',chapter:'Matrices',prompt:'What is the determinant of [[2, 0], [0, 3]]?',options:['0','5','6','9'],answer:2,explanation:'2 × 3 − 0 × 0 = 6.'}];