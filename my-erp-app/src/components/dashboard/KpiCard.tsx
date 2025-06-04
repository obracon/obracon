// src/components/dashboard/KpiCard.tsx
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral'; // Optional: to show a small trend indicator
  trendValue?: string; // Optional: e.g., "+5% vs last month"
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  target,
  description,
  trend,
  trendValue
}) => {
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className="bg-white p-5 shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-md font-semibold text-gray-600">{title}</h3>
        {/* Optional: Icon could go here */}
      </div>
      <p className="text-4xl font-bold text-gray-800">
        {value}
        {unit && <span className="text-xl font-medium text-gray-500 ml-1">{unit}</span>}
      </p>
      {target && (
        <p className="text-sm text-gray-500 mt-1">
          Meta: {target} {unit}
        </p>
      )}
      {trend && trendValue && (
        <p className={`text-sm ${trendColor} mt-1`}>
          {trendArrow} {trendValue}
        </p>
      )}
      {description && <p className="text-xs text-gray-400 mt-3">{description}</p>}
    </div>
  );
};

export default KpiCard;
