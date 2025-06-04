// src/components/dashboard/KpiChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { KpiHistoricalData } from '../../services/dashboardService'; // Import type

interface KpiChartProps {
  data: KpiHistoricalData[]; // Expecting the raw historical data
  kpiName: string;
  targetValue?: number | null;
}

const KpiChart: React.FC<KpiChartProps> = ({ data, kpiName, targetValue }) => {
  if (!data || data.length === 0) {
    return (
        <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-200 text-center text-gray-500 min-h-[300px] flex items-center justify-center">
            <p>Não há dados históricos para exibir para "{kpiName}".</p>
        </div>
    );
  }

  // Format data for Recharts: needs a 'name' for XAxis and the value key.
  // Assuming record_date is a string like 'YYYY-MM-DD'
  const chartData = data
    .map(item => ({
      // Ensure date parsing is robust, might need a library like date-fns if dates are complex
      name: new Date(item.record_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: '2-digit' }),
      value: item.value,
      // Original date for sorting, if needed, though data should ideally come sorted or be sortable if dates are complex
      originalDate: new Date(item.record_date + 'T00:00:00')
    }))
    // Sort by date to ensure the line chart connects points in chronological order
    .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

  return (
    <div className="bg-white p-4 pt-6 shadow-lg rounded-xl border-gray-200 h-96"> {/* Increased height, added pt-6 */}
      <h4 className="text-lg font-semibold mb-4 text-center text-gray-700">{kpiName} - Histórico</h4>
      <ResponsiveContainer width="100%" height="85%"> {/* Adjusted height for title */}
        <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 5, bottom: 20 }} // Adjusted bottom margin for XAxis labels
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
          <XAxis
            dataKey="name"
            stroke="#666"
            tick={{ fontSize: 10 }}
            angle={-30} // Angle labels if they overlap
            textAnchor="end" // Anchor angled labels correctly
            interval="preserveStartEnd" // Show first and last tick
          />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.toLocaleString('pt-BR')} // Format Y-axis numbers
          />
          <Tooltip
            formatter={(value: number, name: string) => [value.toLocaleString('pt-BR'), name]}
            labelFormatter={(label: string) => `Data: ${label}`}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px',  border: '1px solid #ccc' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6" // Blue color
            strokeWidth={2}
            activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2, fill: '#3b82f6' }}
            dot={{ r: 3, strokeWidth: 0, fill: '#3b82f6' }}
            name={kpiName}
          />
          {targetValue !== null && targetValue !== undefined && (
            <ReferenceLine
                y={targetValue}
                label={{
                    value: `Meta: ${targetValue.toLocaleString('pt-BR')}`,
                    position: 'insideTopRight',
                    fill: '#e74c3c',
                    fontSize: 10,
                    dy: 10, // Offset to avoid overlap with chart line
                    dx: -10
                }}
                stroke="#e74c3c"
                strokeDasharray="5 5"
                strokeWidth={1.5}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KpiChart;
