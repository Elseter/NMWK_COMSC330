export const calculateAverageGPA = (students) => {
    console.log("Calculating average GPA...");
    if (!students || students.length === 0) return 0;
  
    const validGPAs = students.filter(student => student.cumulative_gpa !== null);
    if (validGPAs.length === 0) return 0;
    
    const totalGPA = validGPAs.reduce((acc, student) => acc + student.cumulative_gpa, 0);
    const averageGPA = totalGPA / validGPAs.length;
    return parseFloat(averageGPA.toFixed(2));
  };
  
  export const calculateGradeDistribution = (students) => {
    const distribution = {
      'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0,
      'F': 0, 'I': 0, 'W': 0, 'P': 0, 'NP': 0
    };
  
    if (!students) return distribution;
  
    students.forEach(student => {
      if (!student.grades) return;
  
      student.grades.forEach(grade => {
        if (grade.letter_grade && distribution[grade.letter_grade] !== undefined) {
          distribution[grade.letter_grade]++;
        }
      });
    });
  
    return distribution;
  };