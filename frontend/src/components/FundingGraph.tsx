import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from './ui/animated-card';

interface FundingData {
  date: string;
  amount: number;
}

interface FundingGraphProps {
  data: FundingData[];
  className?: string;
}

const FundingGraph = ({ data, className = '' }: FundingGraphProps) => {
  const { chartData, maxValue, totalFunding } = useMemo(() => {
    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    // Map data to last 7 days
    const chartData = last7Days.map(date => {
      const dayData = data.find(d => d.date === date);
      return {
        date,
        amount: dayData ? dayData.amount : 0,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      };
    });

    const maxValue = Math.max(...chartData.map(d => d.amount), 1); // At least 1 to avoid division by 0
    const totalFunding = chartData.reduce((sum, d) => sum + d.amount, 0);

    return { chartData, maxValue, totalFunding };
  }, [data]);

  const chartHeight = 120;
  const chartWidth = 280;
  const padding = 20;

  return (
    <AnimatedCard className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Funding Received</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{totalFunding.toFixed(2)} SOL</p>
            <p className="text-xs text-muted-foreground">Total received</p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg
            width={chartWidth}
            height={chartHeight + 40}
            className="w-full"
            viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          >
            {/* Grid lines */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <line
                key={index}
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={chartWidth - padding}
                y2={padding + ratio * chartHeight}
                stroke="rgb(75, 85, 99)"
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="2,2"
              />
            ))}

            {/* Bars */}
            {chartData.map((point, index) => {
              const barWidth = (chartWidth - padding * 2) / chartData.length * 0.8;
              const barX = padding + (chartWidth - padding * 2) / chartData.length * index + barWidth * 0.1;
              const barHeight = (point.amount / maxValue) * chartHeight;
              const barY = chartHeight + padding - barHeight;

              return (
                <motion.g key={point.date}>
                  {/* Bar */}
                  <motion.rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#barGradient)"
                    rx="4"
                    ry="4"
                    initial={{ height: 0, y: chartHeight + padding }}
                    animate={{ height: barHeight, y: barY }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  />
                  
                  {/* Glow effect for active bars */}
                  {point.amount > 0 && (
                    <motion.rect
                      x={barX - 2}
                      y={barY - 2}
                      width={barWidth + 4}
                      height={barHeight + 4}
                      fill="none"
                      stroke="rgb(99, 102, 241)"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                      rx="6"
                      ry="6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: point.amount > 0 ? 1 : 0 }}
                      transition={{ delay: index * 0.1 + 0.8 }}
                    />
                  )}

                  {/* Value label on hover */}
                  {point.amount > 0 && (
                    <motion.text
                      x={barX + barWidth / 2}
                      y={barY - 8}
                      textAnchor="middle"
                      className="text-xs fill-primary font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 1 }}
                    >
                      {point.amount.toFixed(1)}
                    </motion.text>
                  )}

                  {/* Day label */}
                  <text
                    x={barX + barWidth / 2}
                    y={chartHeight + padding + 16}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {point.label}
                  </text>
                </motion.g>
              );
            })}

            {/* Area under curve for visual appeal */}
            {totalFunding > 0 && (
              <motion.path
                d={`
                  M ${padding} ${chartHeight + padding}
                  ${chartData.map((point, index) => {
                    const x = padding + (chartWidth - padding * 2) / chartData.length * index + 
                             ((chartWidth - padding * 2) / chartData.length * 0.8) / 2;
                    const y = chartHeight + padding - (point.amount / maxValue) * chartHeight;
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  L ${chartWidth - padding} ${chartHeight + padding}
                  Z
                `}
                fill="url(#chartGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            )}
          </svg>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-400">
              {Math.max(...chartData.map(d => d.amount)).toFixed(2)} SOL
            </p>
            <p className="text-xs text-muted-foreground">Peak day</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-400">
              {(totalFunding / 7).toFixed(2)} SOL
            </p>
            <p className="text-xs text-muted-foreground">Daily avg</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-400">
              {chartData.filter(d => d.amount > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Active days</p>
          </div>
        </div>

        {/* Trend indicator */}
        {totalFunding > 0 && (
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Funding activity detected
          </motion.div>
        )}
      </div>
    </AnimatedCard>
  );
};

export default FundingGraph;
