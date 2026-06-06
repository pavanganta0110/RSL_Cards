import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  label: string;
  value: number;
}

interface CardPilotChartsProps {
  type: 'valuation' | 'profit' | 'sports' | 'grades';
  data: ChartData[];
}

export default function CardPilotCharts({ type, data }: CardPilotChartsProps) {
  if (!data || data.length === 0) return null;

  const getChartTitle = () => {
    switch (type) {
      case 'valuation': return 'Inventory Value Trend';
      case 'profit': return 'Monthly Net Profit Summary';
      case 'sports': return 'Inventory Count by Sport';
      case 'grades': return 'Inventory Count by Grade';
      default: return 'Performance Chart';
    }
  };

  const isTrend = type === 'valuation';

  return (
    <div className="p-4 rounded-xl bg-surface border border-border space-y-4">
      <div className="text-white font-bold text-sm tracking-wide">{getChartTitle()}</div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {isTrend ? (
            <AreaChart data={data}>
              <XAxis dataKey="label" stroke="#777777" fontSize={10} tickLine={false} />
              <YAxis stroke="#777777" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2D3139' }} />
              <Area type="monotone" dataKey="value" stroke="#0057FF" strokeWidth={2} fill="rgba(0, 87, 255, 0.1)" />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="label" stroke="#777777" fontSize={10} tickLine={false} />
              <YAxis stroke="#777777" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2D3139' }} />
              <Bar dataKey="value" fill="#00C853" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
