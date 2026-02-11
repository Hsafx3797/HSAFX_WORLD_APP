/**
 * GPA Calculator
 * Multiple grading system support
 */

export type GradeSystem = 
  | 'us-4.0'
  | 'us-4.3' 
  | 'uk'
  | 'canada'
  | 'australia'
  | 'germany'
  | 'france'
  | 'india-10'
  | 'india-percentage'
  | 'saudi';

export interface Course {
  name: string;
  credits: number;
  grade: string | number;
  gradePoints?: number;
}

export interface GPAResult {
  gpa: number;
  totalCredits: number;
  totalGradePoints: number;
  classification: string;
  courses: (Course & { gradePoints: number })[];
  system: GradeSystem;
}

// Grade scales for different systems
const GRADE_SCALES: Record<GradeSystem, Record<string, number>> = {
  'us-4.0': {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
  },
  'us-4.3': {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
  },
  'uk': {
    'First': 4.0,
    '2:1': 3.3,
    '2:2': 2.7,
    'Third': 2.0,
    'Pass': 1.0,
    'Fail': 0.0,
  },
  'canada': {
    'A+': 4.0, 'A': 3.9, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0,
  },
  'australia': {
    'HD': 7.0, // High Distinction
    'D': 6.0,  // Distinction
    'CR': 5.0, // Credit
    'P': 4.0,  // Pass
    'F': 0.0,  // Fail
  },
  'germany': {
    '1.0': 4.0, '1.3': 3.7, '1.7': 3.3,
    '2.0': 3.0, '2.3': 2.7, '2.7': 2.3,
    '3.0': 2.0, '3.3': 1.7, '3.7': 1.3,
    '4.0': 1.0,
    '5.0': 0.0,
  },
  'france': {
    '16-20': 4.0,
    '14-16': 3.5,
    '12-14': 3.0,
    '10-12': 2.5,
    '8-10': 2.0,
    '0-8': 0.0,
  },
  'india-10': {
    'O': 10.0,
    'A+': 9.0,
    'A': 8.0,
    'B+': 7.0,
    'B': 6.0,
    'C': 5.0,
    'P': 4.0,
    'F': 0.0,
  },
  'india-percentage': {
    '90-100': 10.0,
    '80-90': 9.0,
    '70-80': 8.0,
    '60-70': 7.0,
    '50-60': 6.0,
    '40-50': 5.0,
    '0-40': 0.0,
  },
  'saudi': {
    'A+': 5.0, 'A': 4.75, 'B+': 4.5,
    'B': 4.0, 'C+': 3.5, 'C': 3.0,
    'D+': 2.5, 'D': 2.0,
    'F': 1.0,
  },
};

const CLASSIFICATIONS: Record<GradeSystem, { min: number; label: string }[]> = {
  'us-4.0': [
    { min: 3.9, label: 'Summa Cum Laude' },
    { min: 3.7, label: 'Magna Cum Laude' },
    { min: 3.5, label: 'Cum Laude' },
    { min: 3.0, label: "Dean's List" },
    { min: 2.0, label: 'Good Standing' },
    { min: 0, label: 'Academic Probation' },
  ],
  'us-4.3': [
    { min: 4.0, label: 'Summa Cum Laude' },
    { min: 3.7, label: 'Magna Cum Laude' },
    { min: 3.5, label: 'Cum Laude' },
    { min: 3.0, label: "Dean's List" },
    { min: 2.0, label: 'Good Standing' },
    { min: 0, label: 'Academic Probation' },
  ],
  'uk': [
    { min: 3.7, label: 'First Class Honours' },
    { min: 3.0, label: 'Upper Second Class (2:1)' },
    { min: 2.3, label: 'Lower Second Class (2:2)' },
    { min: 1.7, label: 'Third Class' },
    { min: 1.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
  'canada': [
    { min: 3.7, label: 'Distinction' },
    { min: 3.0, label: 'First Class' },
    { min: 2.3, label: 'Second Class' },
    { min: 2.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
  'australia': [
    { min: 6.5, label: 'High Distinction' },
    { min: 5.5, label: 'Distinction' },
    { min: 4.5, label: 'Credit' },
    { min: 4.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
  'germany': [
    { min: 3.7, label: 'Sehr gut (Very Good)' },
    { min: 2.7, label: 'Gut (Good)' },
    { min: 1.7, label: 'Befriedigend (Satisfactory)' },
    { min: 1.0, label: 'Ausreichend (Sufficient)' },
    { min: 0, label: 'Mangelhaft (Poor)' },
  ],
  'france': [
    { min: 3.5, label: 'Très Bien (Very Good)' },
    { min: 3.0, label: 'Bien (Good)' },
    { min: 2.5, label: 'Assez Bien (Fairly Good)' },
    { min: 2.0, label: 'Passable (Satisfactory)' },
    { min: 0, label: 'Insuffisant (Insufficient)' },
  ],
  'india-10': [
    { min: 9.0, label: 'Outstanding' },
    { min: 8.0, label: 'Excellent' },
    { min: 7.0, label: 'Very Good' },
    { min: 6.0, label: 'Good' },
    { min: 5.0, label: 'Average' },
    { min: 4.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
  'india-percentage': [
    { min: 9.0, label: 'Outstanding' },
    { min: 8.0, label: 'Excellent' },
    { min: 7.0, label: 'Very Good' },
    { min: 6.0, label: 'Good' },
    { min: 5.0, label: 'Average' },
    { min: 4.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
  'saudi': [
    { min: 4.5, label: 'Excellent' },
    { min: 3.75, label: 'Very Good' },
    { min: 2.75, label: 'Good' },
    { min: 2.0, label: 'Pass' },
    { min: 0, label: 'Fail' },
  ],
};

function getGradePoints(grade: string | number, system: GradeSystem): number {
  const scale = GRADE_SCALES[system];
  
  if (typeof grade === 'number') {
    // Handle percentage-based systems
    if (system === 'india-percentage') {
      if (grade >= 90) return 10.0;
      if (grade >= 80) return 9.0;
      if (grade >= 70) return 8.0;
      if (grade >= 60) return 7.0;
      if (grade >= 50) return 6.0;
      if (grade >= 40) return 5.0;
      return 0.0;
    }
    
    if (system === 'france') {
      if (grade >= 16) return 4.0;
      if (grade >= 14) return 3.5;
      if (grade >= 12) return 3.0;
      if (grade >= 10) return 2.5;
      if (grade >= 8) return 2.0;
      return 0.0;
    }
    
    // German grades are numeric
    if (system === 'germany') {
      const numGrade = grade.toFixed(1);
      return scale[numGrade] ?? 0;
    }
    
    return grade;
  }
  
  const upperGrade = grade.toUpperCase();
  return scale[upperGrade] ?? scale[grade] ?? 0;
}

function getClassification(gpa: number, system: GradeSystem): string {
  const classifications = CLASSIFICATIONS[system];
  
  for (const classification of classifications) {
    if (gpa >= classification.min) {
      return classification.label;
    }
  }
  
  return 'Unclassified';
}

export function calculateGPA(
  courses: Course[],
  system: GradeSystem = 'us-4.0'
): GPAResult {
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  const processedCourses = courses.map(course => {
    const gradePoints = getGradePoints(course.grade, system);
    const weightedPoints = gradePoints * course.credits;
    
    totalCredits += course.credits;
    totalGradePoints += weightedPoints;
    
    return {
      ...course,
      gradePoints,
    };
  });
  
  const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  const classification = getClassification(gpa, system);
  
  return {
    gpa: Math.round(gpa * 1000) / 1000,
    totalCredits,
    totalGradePoints: Math.round(totalGradePoints * 1000) / 1000,
    classification,
    courses: processedCourses,
    system,
  };
}

export function calculateCGPA(
  semesters: { courses: Course[]; system?: GradeSystem }[],
  defaultSystem: GradeSystem = 'us-4.0'
): {
  cgpa: number;
  totalCredits: number;
  semesterResults: GPAResult[];
  classification: string;
} {
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  const semesterResults = semesters.map(semester => {
    const result = calculateGPA(semester.courses, semester.system || defaultSystem);
    totalCredits += result.totalCredits;
    totalGradePoints += result.totalGradePoints;
    return result;
  });
  
  const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  const classification = getClassification(cgpa, defaultSystem);
  
  return {
    cgpa: Math.round(cgpa * 1000) / 1000,
    totalCredits,
    semesterResults,
    classification,
  };
}

export function convertGPA(
  gpa: number,
  fromSystem: GradeSystem,
  toSystem: GradeSystem
): { convertedGPA: number; approximateGrade: string } {
  // Get max GPA for both systems
  const fromScale = GRADE_SCALES[fromSystem];
  const toScale = GRADE_SCALES[toSystem];
  
  const fromMax = Math.max(...Object.values(fromScale));
  const toMax = Math.max(...Object.values(toScale));
  
  // Simple linear conversion
  const percentage = gpa / fromMax;
  const convertedGPA = percentage * toMax;
  
  // Find approximate grade
  let approximateGrade = '';
  let closestDiff = Infinity;
  
  for (const [grade, points] of Object.entries(toScale)) {
    const diff = Math.abs(points - convertedGPA);
    if (diff < closestDiff) {
      closestDiff = diff;
      approximateGrade = grade;
    }
  }
  
  return {
    convertedGPA: Math.round(convertedGPA * 100) / 100,
    approximateGrade,
  };
}

export function getRequiredGPA(
  targetCGPA: number,
  currentCGPA: number,
  completedCredits: number,
  remainingCredits: number
): { requiredGPA: number; achievable: boolean } {
  const targetTotalPoints = targetCGPA * (completedCredits + remainingCredits);
  const currentTotalPoints = currentCGPA * completedCredits;
  const requiredPoints = targetTotalPoints - currentTotalPoints;
  const requiredGPA = requiredPoints / remainingCredits;
  
  return {
    requiredGPA: Math.round(requiredGPA * 1000) / 1000,
    achievable: requiredGPA <= 4.0 && requiredGPA >= 0,
  };
}

export function getGradeScale(system: GradeSystem): { grade: string; points: number }[] {
  const scale = GRADE_SCALES[system];
  
  return Object.entries(scale)
    .map(([grade, points]) => ({ grade, points }))
    .sort((a, b) => b.points - a.points);
}

export function getSupportedSystems(): { id: GradeSystem; name: string; country: string }[] {
  return [
    { id: 'us-4.0', name: '4.0 Scale', country: 'United States' },
    { id: 'us-4.3', name: '4.3 Scale', country: 'United States' },
    { id: 'uk', name: 'UK Honours System', country: 'United Kingdom' },
    { id: 'canada', name: 'Canadian Scale', country: 'Canada' },
    { id: 'australia', name: '7-Point Scale', country: 'Australia' },
    { id: 'germany', name: 'German 1-5 Scale', country: 'Germany' },
    { id: 'france', name: 'French 0-20 Scale', country: 'France' },
    { id: 'india-10', name: '10-Point CGPA', country: 'India' },
    { id: 'india-percentage', name: 'Percentage System', country: 'India' },
    { id: 'saudi', name: '5.0 Scale', country: 'Saudi Arabia' },
  ];
}
