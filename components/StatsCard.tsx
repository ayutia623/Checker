'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
  className?: string;
}

export function StatsCard({ label, value, className = '' }: StatsCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border backdrop-blur-sm ${className}`}
    >
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
