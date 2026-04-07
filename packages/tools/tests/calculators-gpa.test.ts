import { describe, it, expect } from 'vitest';
import {
  calculateGPA,
  calculateCGPA,
  convertGPA,
  getRequiredGPA,
  getGradeScale,
  getSupportedSystems,
} from '../src/specialized/gpa-calculator';
import type { Course, GradeSystem } from '../src/specialized/gpa-calculator';

describe('GPA Calculator', () => {
  describe('getSupportedSystems', () => {
    it('returns 10 grading systems', () => {
      const systems = getSupportedSystems();
      expect(systems).toHaveLength(10);
    });

    it('includes US 4.0 system', () => {
      const systems = getSupportedSystems();
      expect(systems.find(s => s.id === 'us-4.0')).toBeDefined();
    });

    it('includes Saudi system', () => {
      const systems = getSupportedSystems();
      const saudi = systems.find(s => s.id === 'saudi');
      expect(saudi).toBeDefined();
      expect(saudi!.country).toBe('Saudi Arabia');
    });

    it('each system has id, name, and country', () => {
      for (const sys of getSupportedSystems()) {
        expect(sys.id).toBeTruthy();
        expect(sys.name).toBeTruthy();
        expect(sys.country).toBeTruthy();
      }
    });
  });

  describe('getGradeScale', () => {
    it('returns grades sorted by points descending', () => {
      const scale = getGradeScale('us-4.0');
      for (let i = 1; i < scale.length; i++) {
        expect(scale[i - 1].points).toBeGreaterThanOrEqual(scale[i].points);
      }
    });

    it('us-4.0 has A+ at 4.0 and F at 0', () => {
      const scale = getGradeScale('us-4.0');
      expect(scale[0].grade).toBe('A+');
      expect(scale[0].points).toBe(4.0);
      expect(scale[scale.length - 1].grade).toBe('F');
      expect(scale[scale.length - 1].points).toBe(0);
    });

    it('us-4.3 has A+ at 4.3', () => {
      const scale = getGradeScale('us-4.3');
      expect(scale[0].points).toBe(4.3);
    });

    it('australia uses 7-point scale', () => {
      const scale = getGradeScale('australia');
      expect(scale[0].points).toBe(7.0);
      expect(scale[0].grade).toBe('HD');
    });

    it('saudi uses 5.0 scale', () => {
      const scale = getGradeScale('saudi');
      expect(scale[0].points).toBe(5.0);
    });

    it('india-10 has O at 10.0', () => {
      const scale = getGradeScale('india-10');
      expect(scale[0].points).toBe(10.0);
      expect(scale[0].grade).toBe('O');
    });
  });

  describe('calculateGPA – US 4.0', () => {
    const courses: Course[] = [
      { name: 'Math', credits: 3, grade: 'A' },
      { name: 'English', credits: 3, grade: 'B' },
      { name: 'Science', credits: 4, grade: 'A-' },
    ];

    it('computes weighted average correctly', () => {
      const result = calculateGPA(courses, 'us-4.0');
      // (4.0*3 + 3.0*3 + 3.7*4) / (3+3+4) = (12+9+14.8)/10 = 35.8/10 = 3.58
      expect(result.gpa).toBeCloseTo(3.58, 1);
    });

    it('returns total credits', () => {
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.totalCredits).toBe(10);
    });

    it('sets system in result', () => {
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.system).toBe('us-4.0');
    });

    it('provides classification', () => {
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.classification).toBeTruthy();
    });

    it('includes processed courses with grade points', () => {
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.courses).toHaveLength(3);
      expect(result.courses[0].gradePoints).toBe(4.0);
      expect(result.courses[1].gradePoints).toBe(3.0);
      expect(result.courses[2].gradePoints).toBe(3.7);
    });

    it('A+ and A both map to 4.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A+' },
        { name: 'Y', credits: 3, grade: 'A' },
      ], 'us-4.0');
      expect(result.gpa).toBe(4.0);
    });

    it('F grade is 0.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'F' },
      ], 'us-4.0');
      expect(result.gpa).toBe(0);
    });

    it('handles empty courses', () => {
      const result = calculateGPA([], 'us-4.0');
      expect(result.gpa).toBe(0);
      expect(result.totalCredits).toBe(0);
    });
  });

  describe('calculateGPA – US 4.3', () => {
    it('A+ is 4.3 in 4.3 scale', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A+' },
      ], 'us-4.3');
      expect(result.gpa).toBe(4.3);
    });
  });

  describe('calculateGPA – UK', () => {
    it('maps UK classification grades', () => {
      const result = calculateGPA([
        { name: 'Module A', credits: 30, grade: 'First' },
        { name: 'Module B', credits: 30, grade: '2:1' },
      ], 'uk');
      // (4.0*30 + 3.3*30) / 60 = 220/60 ≈ 3.65
      expect(result.gpa).toBeCloseTo(3.65, 1);
    });
  });

  describe('calculateGPA – Australia', () => {
    it('HD is 7.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'HD' },
      ], 'australia');
      expect(result.gpa).toBe(7.0);
    });

    it('P is 4.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'P' },
      ], 'australia');
      expect(result.gpa).toBe(4.0);
    });
  });

  describe('calculateGPA – Germany', () => {
    it('handles numeric grade keys', () => {
      const result = calculateGPA([
        { name: 'X', credits: 5, grade: 1.0 },
      ], 'germany');
      expect(result.gpa).toBe(4.0);
    });

    it('5.0 maps to 0 (fail)', () => {
      const result = calculateGPA([
        { name: 'X', credits: 5, grade: 5.0 },
      ], 'germany');
      expect(result.gpa).toBe(0);
    });
  });

  describe('calculateGPA – France (numeric input)', () => {
    it('score of 18 maps to top tier', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 18 },
      ], 'france');
      expect(result.gpa).toBe(4.0);
    });

    it('score of 9 maps to second-lowest tier', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 9 },
      ], 'france');
      expect(result.gpa).toBe(2.0);
    });

    it('score of 5 maps to lowest tier', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 5 },
      ], 'france');
      expect(result.gpa).toBe(0);
    });
  });

  describe('calculateGPA – India 10-point', () => {
    it('O grade is 10.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'O' },
      ], 'india-10');
      expect(result.gpa).toBe(10.0);
    });

    it('P grade is 4.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'P' },
      ], 'india-10');
      expect(result.gpa).toBe(4.0);
    });
  });

  describe('calculateGPA – India percentage', () => {
    it('92% maps to 10.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 92 },
      ], 'india-percentage');
      expect(result.gpa).toBe(10.0);
    });

    it('75% maps to 8.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 75 },
      ], 'india-percentage');
      expect(result.gpa).toBe(8.0);
    });

    it('35% maps to 0.0 (fail)', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 35 },
      ], 'india-percentage');
      expect(result.gpa).toBe(0);
    });
  });

  describe('calculateGPA – Saudi', () => {
    it('A+ is 5.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A+' },
      ], 'saudi');
      expect(result.gpa).toBe(5.0);
    });

    it('C is 3.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'C' },
      ], 'saudi');
      expect(result.gpa).toBe(3.0);
    });

    it('F is 1.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'F' },
      ], 'saudi');
      expect(result.gpa).toBe(1.0);
    });
  });

  describe('Classifications', () => {
    it('US 4.0 perfect GPA → Summa Cum Laude', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A+' },
      ], 'us-4.0');
      expect(result.classification).toBe('Summa Cum Laude');
    });

    it('US 4.0 low GPA → Academic Probation', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'D' },
      ], 'us-4.0');
      expect(result.classification).toBe('Academic Probation');
    });

    it('UK First at 4.0', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'First' },
      ], 'uk');
      expect(result.classification).toBe('First Class Honours');
    });

    it('Australia HD classification', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'HD' },
      ], 'australia');
      expect(result.classification).toBe('High Distinction');
    });

    it('Saudi excellent classification', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A+' },
      ], 'saudi');
      expect(result.classification).toBe('Excellent');
    });
  });

  describe('calculateCGPA', () => {
    it('calculates cumulative GPA across semesters', () => {
      const result = calculateCGPA([
        {
          courses: [
            { name: 'Math', credits: 3, grade: 'A' },
            { name: 'Eng', credits: 3, grade: 'B' },
          ],
        },
        {
          courses: [
            { name: 'Phys', credits: 4, grade: 'A-' },
            { name: 'Chem', credits: 3, grade: 'B+' },
          ],
        },
      ], 'us-4.0');
      expect(result.totalCredits).toBe(13);
      expect(result.cgpa).toBeGreaterThan(0);
      expect(result.semesterResults).toHaveLength(2);
    });

    it('returns 0 for empty semesters', () => {
      const result = calculateCGPA([], 'us-4.0');
      expect(result.cgpa).toBe(0);
      expect(result.totalCredits).toBe(0);
    });

    it('single semester CGPA equals semester GPA', () => {
      const courses: Course[] = [
        { name: 'X', credits: 3, grade: 'A' },
        { name: 'Y', credits: 3, grade: 'B' },
      ];
      const cgpaResult = calculateCGPA([{ courses }], 'us-4.0');
      const gpaResult = calculateGPA(courses, 'us-4.0');
      expect(cgpaResult.cgpa).toBeCloseTo(gpaResult.gpa);
    });

    it('provides classification for CGPA', () => {
      const result = calculateCGPA([
        {
          courses: [{ name: 'X', credits: 3, grade: 'A' }],
        },
      ], 'us-4.0');
      expect(result.classification).toBeTruthy();
    });

    it('allows different systems per semester', () => {
      const result = calculateCGPA([
        {
          courses: [{ name: 'X', credits: 3, grade: 'A' }],
          system: 'us-4.0',
        },
        {
          courses: [{ name: 'Y', credits: 3, grade: 'A+' }],
          system: 'us-4.3',
        },
      ], 'us-4.0');
      // First: 4.0, Second: 4.3 → avg = 4.15
      expect(result.cgpa).toBeCloseTo(4.15, 1);
    });
  });

  describe('convertGPA', () => {
    it('converts US 4.0 to Saudi 5.0 scale', () => {
      const result = convertGPA(4.0, 'us-4.0', 'saudi');
      expect(result.convertedGPA).toBe(5.0);
      expect(result.approximateGrade).toBeTruthy();
    });

    it('converts US 4.0 to Australia 7.0 scale', () => {
      const result = convertGPA(4.0, 'us-4.0', 'australia');
      expect(result.convertedGPA).toBe(7.0);
    });

    it('converts 0 GPA to 0 in any system', () => {
      const result = convertGPA(0, 'us-4.0', 'saudi');
      expect(result.convertedGPA).toBe(0);
    });

    it('provides approximate grade string', () => {
      const result = convertGPA(3.5, 'us-4.0', 'us-4.0');
      expect(result.approximateGrade).toBeTruthy();
    });

    it('linear scaling: half of max → half of target max', () => {
      const result = convertGPA(2.0, 'us-4.0', 'india-10');
      // 2.0/4.0 = 50% → 50% of 10 = 5.0
      expect(result.convertedGPA).toBe(5.0);
    });
  });

  describe('getRequiredGPA', () => {
    it('calculates required GPA to reach target', () => {
      const result = getRequiredGPA(3.5, 3.0, 60, 30);
      // Need: 3.5*90 - 3.0*60 = 315 - 180 = 135. 135/30 = 4.5
      expect(result.requiredGPA).toBeCloseTo(4.5);
    });

    it('marks as achievable when required <= 4.0', () => {
      const result = getRequiredGPA(3.2, 3.0, 60, 30);
      // 3.2*90 - 3.0*60 = 288-180 = 108. 108/30 = 3.6
      expect(result.achievable).toBe(true);
      expect(result.requiredGPA).toBeCloseTo(3.6);
    });

    it('marks as not achievable when required > 4.0', () => {
      const result = getRequiredGPA(3.5, 3.0, 60, 30);
      expect(result.requiredGPA).toBeCloseTo(4.5);
      expect(result.achievable).toBe(false);
    });

    it('marks as not achievable when required is negative', () => {
      const result = getRequiredGPA(2.0, 4.0, 90, 10);
      // 2.0*100 - 4.0*90 = 200-360 = -160. -160/10 = -16
      expect(result.requiredGPA).toBeLessThan(0);
      expect(result.achievable).toBe(false);
    });

    it('exactly achievable at 4.0', () => {
      // target=3.5, current=3.0, completed=60, remaining=60
      // 3.5*120 - 3.0*60 = 420-180 = 240, 240/60 = 4.0
      const result = getRequiredGPA(3.5, 3.0, 60, 60);
      expect(result.requiredGPA).toBeCloseTo(4.0);
      expect(result.achievable).toBe(true);
    });
  });

  describe('Grade case insensitivity', () => {
    it('accepts lowercase grades', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'a' },
      ], 'us-4.0');
      expect(result.gpa).toBe(4.0);
    });

    it('accepts mixed-case grades', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'b+' },
      ], 'us-4.0');
      expect(result.gpa).toBe(3.3);
    });
  });

  describe('Edge cases', () => {
    it('single credit course', () => {
      const result = calculateGPA([
        { name: 'Lab', credits: 1, grade: 'A' },
      ], 'us-4.0');
      expect(result.gpa).toBe(4.0);
      expect(result.totalCredits).toBe(1);
    });

    it('all F grades', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'F' },
        { name: 'Y', credits: 3, grade: 'F' },
        { name: 'Z', credits: 3, grade: 'F' },
      ], 'us-4.0');
      expect(result.gpa).toBe(0);
    });

    it('defaults to us-4.0 system', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'A' },
      ]);
      expect(result.system).toBe('us-4.0');
      expect(result.gpa).toBe(4.0);
    });

    it('unknown grade returns 0 points', () => {
      const result = calculateGPA([
        { name: 'X', credits: 3, grade: 'Z' },
      ], 'us-4.0');
      expect(result.gpa).toBe(0);
    });

    it('many courses weighted correctly', () => {
      const courses: Course[] = [];
      for (let i = 0; i < 20; i++) {
        courses.push({ name: `Course ${i}`, credits: 3, grade: 'B' });
      }
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.gpa).toBe(3.0);
      expect(result.totalCredits).toBe(60);
    });
  });
});
