import React from 'react';
import { Video as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}) => {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-[10px] sm:text-xs text-green-600 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color} flex-shrink-0`}>
          <Icon size={20} className="text-white sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;