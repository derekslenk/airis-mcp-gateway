import type { MCPServer } from '../../../lib/api';

interface StatusIndicatorProps {
  servers: MCPServer[];
}

export function StatusIndicator({ servers }: StatusIndicatorProps) {
  const activeCount = servers.filter(s => s.enabled).length;
  const totalCount = servers.length;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`}></div>
        <span className="text-white font-medium">{activeCount}</span>
        <span className="text-white/70 text-sm">/ {totalCount}</span>
      </div>
      <span className="text-white/70 text-sm">Active</span>
    </div>
  );
}
