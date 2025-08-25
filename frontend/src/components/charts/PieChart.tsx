import React from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 200, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-32 h-32 rounded-full border-4 border-muted/20 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No data</span>
        </div>
        {title && <h4 className="text-sm font-medium text-foreground mt-2">{title}</h4>}
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  
  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const largeArcFlag = angle > 180 ? 1 : 0;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return (
      <path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="hsl(var(--background))"
        strokeWidth="2"
        className="transition-opacity hover:opacity-80"
      />
    );
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      {title && <h4 className="text-lg font-semibold text-foreground">{title}</h4>}
      
      <div className="relative">
        <svg width={size} height={size} className="transform">
          {slices}
        </svg>
        
        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{total.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">SOL</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 max-w-xs">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 truncate text-foreground">{item.label}</div>
              <div className="text-muted-foreground">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;
