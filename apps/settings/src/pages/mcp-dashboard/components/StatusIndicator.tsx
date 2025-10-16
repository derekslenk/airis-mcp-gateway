
interface StatusIndicatorProps {
  label: string;
  count: number;
  total: number;
  color: 'blue' | 'green' | 'red' | 'gray';
}

export function StatusIndicator({ label, count, total, color }: StatusIndicatorProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="text-center">
      <div className={`inline-flex items-center px-3 py-2 rounded-lg ${getColorClasses()}`}>
        <span className="text-lg font-bold">{count}</span>
        <span className="text-sm ml-1">/ {total}</span>
      </div>
      <p className="text-xs text-gray-600 mt-1 whitespace-nowrap">{label}</p>
    </div>
  );
}
