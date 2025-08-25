import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number;
  height?: number;
  title?: string;
  valueLabel?: string;
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  width = 400, 
  height = 300, 
  title,
  valueLabel = "SOL"
}) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width, height }}>
        <div className="text-muted-foreground text-sm">No data available</div>
        {title && <h4 className="text-lg font-semibold text-foreground mt-2">{title}</h4>}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;

  return (
    <div className="flex flex-col items-center space-y-4">
      {title && <h4 className="text-lg font-semibold text-foreground">{title}</h4>}
      
      <div className="relative">
        <svg width={width} height={height} className="bg-muted/5 rounded-lg">
          {/* Background grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + chartHeight - (chartHeight * ratio);
            return (
              <g key={index}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  opacity="0.2"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
                >
                  {(maxValue * ratio).toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + (index * chartWidth) / data.length + barSpacing / 2;
            const y = padding + chartHeight - barHeight;
            
            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || `hsl(${(index * 60) % 360}, 70%, 50%)`}
                  rx="4"
                  className="transition-opacity hover:opacity-80"
                />
                
                {/* Value label on bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs font-medium fill-foreground"
                >
                  {item.value.toFixed(1)}
                </text>
                
                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                  style={{ maxWidth: barWidth }}
                >
                  {item.label.length > 8 ? `${item.label.slice(0, 8)}...` : item.label}
                </text>
              </g>
            );
          })}
          
          {/* Y-axis label */}
          <text
            x={15}
            y={padding + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${padding + chartHeight / 2})`}
            className="text-xs fill-muted-foreground font-medium"
          >
            {valueLabel}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default BarChart;
