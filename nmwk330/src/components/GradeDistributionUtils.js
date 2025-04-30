/**
 * Calculate grade distribution for a group
 * @param {Array} students - List of all students
 * @param {Object} group - Group object with student_ids
 * @returns {Object} Distribution of grades in the format { 'A': 5, 'B+': 3, etc. }
 */
export const calculateGroupGradeDistribution = (students, sections, group) => {
  // Initialize all possible grades with zero count
  console.log("Calculating group grade distribution");
  console.log(students);
  console.log(group);
  console.log(sections);

  const distribution = {
    'A': 0, 'A-': 0, 
    'B+': 0, 'B': 0, 'B-': 0, 
    'C+': 0, 'C': 0, 'C-': 0, 
    'D+': 0, 'D': 0, 'D-': 0, 
    'F': 0, 'I': 0, 'W': 0, 'P': 0, 'NP': 0
  };
  
  if (!group || !group.sections || !Array.isArray(group.sections)) {
    return distribution;
  }

  // Fetch all the grades for each section in the group
  const groupSectionIds = group.sections.map(s => s.section_id);
  const groupSections = sections.filter(section => 
    groupSectionIds.includes(section.section_id)
  );
  
  console.log("Group sections: ", groupSections);

  // Combine all students arrays from groupSections
  const groupStudents = groupSections.flatMap(section => section.students);
  console.log("Group students: ", groupStudents);

  // Count each grade for each student in the group
  for (const student of groupStudents) {
    const grade = student.letter_grade;
    if (distribution.hasOwnProperty(grade)) {
      distribution[grade]++;
    } else {
      console.warn(`Unexpected grade encountered: ${grade}`);
    }
  }

  console.log("Grade distribution: ", distribution);
  return distribution;
};

  
  /**
   * Calculate grade distribution for a section
   * @param {Array} students - List of all students
   * @param {Object} section - Section object
   * @returns {Object} Distribution of grades in the format { 'A': 5, 'B+': 3, etc. }
   */
  export const calculateSectionGradeDistribution = (students, section) => {
    // Initialize all possible grades with zero count
    const distribution = {
      'A': 0, 'A-': 0, 
      'B+': 0, 'B': 0, 'B-': 0, 
      'C+': 0, 'C': 0, 'C-': 0, 
      'D+': 0, 'D': 0, 'D-': 0, 
      'F': 0, 'I': 0, 'W': 0, 'P': 0, 'NP': 0
    };
    
    if (!section || !section.section_name) {
      return distribution;
    }
    
    // Count grades for this specific section
    students.forEach(student => {
      if (student.grades && Array.isArray(student.grades)) {
        student.grades.forEach(grade => {
          if (
            grade.section_name === section.section_name && 
            grade.letter_grade && 
            distribution.hasOwnProperty(grade.letter_grade)
          ) {
            distribution[grade.letter_grade]++;
          }
        });
      }
    });
    
    return distribution;
  };