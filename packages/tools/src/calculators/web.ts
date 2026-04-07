/**
 * Web Calculators
 * Only contains calculateGpa â€” all other calculators have canonical implementations
 * in their dedicated files (health.ts, islamic.ts, financial.ts, etc.).
 */

// GPA Calculator (reference: docs/example/GPA_CALCULATOR.md)
export interface GradeEntry {
  course: string;
  grade: string;
  credits: number;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

export function calculateGpa(grades: GradeEntry[]): {
  gpa: number;
  totalCredits: number;
  totalPoints: number;
  letterGrade: string;
} {
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const entry of grades) {
    const gradePoint = GRADE_POINTS[entry.grade.toUpperCase()];
    if (gradePoint !== undefined) {
      totalPoints += gradePoint * entry.credits;
      totalCredits += entry.credits;
    }
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  let letterGrade = 'F';
  if (gpa >= 3.7) letterGrade = 'A';
  else if (gpa >= 3.3) letterGrade = 'A-';
  else if (gpa >= 3.0) letterGrade = 'B+';
  else if (gpa >= 2.7) letterGrade = 'B';
  else if (gpa >= 2.3) letterGrade = 'B-';
  else if (gpa >= 2.0) letterGrade = 'C+';
  else if (gpa >= 1.7) letterGrade = 'C';
  else if (gpa >= 1.3) letterGrade = 'C-';
  else if (gpa >= 1.0) letterGrade = 'D';
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade,
  };
}

