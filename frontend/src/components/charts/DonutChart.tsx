import React from 'react';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  title?: string;
  innerRadius?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  size = 180, 
  title,
  innerRadius = 0.6 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-24 h-24 rounded-full border-4 border-muted/20 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No data</span>
        </div>
        {title && <h4 className="text-sm font-medium text-foreground mt-2">{title}</h4>}
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  const outerRadius = size / 2 - 10;
  const innerRadiusValue = outerRadius * innerRadius;
  
  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const largeArcFlag = angle > 180 ? 1 : 0;
    const centerX = size / 2;
    const centerY = size / 2;

    // Outer arc points
    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

    // Inner arc points
    const x3 = centerX + innerRadiusValue * Math.cos(endAngleRad);
    const y3 = centerY + innerRadiusValue * Math.sin(endAngleRad);
    const x4 = centerX + innerRadiusValue * Math.cos(startAngleRad);
    const y4 = centerY + innerRadiusValue * Math.sin(startAngleRad);

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadiusValue} ${innerRadiusValue} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    return (
      <path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="hsl(var(--background))"
        strokeWidth="2"
        className="transition-all hover:opacity-80 cursor-pointer"
      />
    );
  });

  return (
    <div className="flex flex-col items-center space-y-3">
      {title && <h4 className="text-lg font-semibold text-foreground">{title}</h4>}
      
      <div className="relative">
        <svg width={size} height={size} className="transform">
          {slices}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{data.length}</div>
            <div className="text-xs text-muted-foreground">Campaigns</div>
          </div>
        </div>
      </div>

      {/* Compact legend */}
      <div className="grid grid-cols-1 gap-1 text-xs max-w-xs">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
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

export default DonutChart;
