import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const GradeDistributionChart = ({ data, title }) => {
  // Sort grades in a logical order
  const gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'];

  // Filter out grades with zero count and sort them
  const sortedData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort(([gradeA], [gradeB]) => {
      return gradeOrder.indexOf(gradeA) - gradeOrder.indexOf(gradeB);
    })
    .map(([grade, count]) => ({ grade, count }));

  // Pick colors based on grade types
  const getBarColor = (grade) => {
    if (grade === 'A' || grade === 'A-') return '#4CAF50';
    if (grade.startsWith('B')) return '#8BC34A';
    if (grade.startsWith('C')) return '#FFC107';
    if (grade.startsWith('D')) return '#FF9800';
    if (grade === 'F') return '#F44336';
    if (grade === 'I') return '#9C27B0';
    if (grade === 'W') return '#607D8B';
    if (grade === 'P') return '#2196F3';
    if (grade === 'NP') return '#795548';
    return '#9E9E9E'; // Default
  };

  return (
    <div className="grade-chart">
      <h4>{title}</h4>
      {sortedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [`${value} student${value !== 1 ? 's' : ''}`, 'Count']}
              labelFormatter={(grade) => `Grade: ${grade}`}
            />
            <Legend />
            <Bar
              dataKey="count"
              name="Students"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.grade)}
                />
              ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="no-data-message">No grade data available</div>
      )}
    </div>
  );
};

export default GradeDistributionChart;