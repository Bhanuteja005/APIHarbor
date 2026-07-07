"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface UsageChartProps {
    series: { label: string; requests: number }[];
}

const UsageChart = ({ series }: UsageChartProps) => {
    return (
        <div className="rounded-2xl bg-card p-6">
            <h2 className="text-2xl font-semibold">
                Usage Analytics
            </h2>
            <div className="mt-2 flex justify-end pr-2">
                <div className="flex items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
                    Total
                </div>
            </div>
            <div className="mt-2 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            stroke="hsl(var(--border))"
                            strokeWidth={1}
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={12}
                            interval="preserveStartEnd"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            width={52}
                            allowDecimals={false}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-lg">
                                        <p className="text-sm font-semibold">{label}</p>
                                        <div className="mt-2 flex items-center justify-between gap-x-6 text-sm">
                                            <div className="flex items-center gap-x-2">
                                                <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
                                                <span className="text-muted-foreground">total_requests</span>
                                            </div>
                                            <span className="font-medium">
                                                {Number(payload[0].value).toLocaleString("en-US")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="linear"
                            dataKey="requests"
                            stroke="hsl(var(--foreground))"
                            strokeWidth={1.5}
                            fill="url(#usageFill)"
                            activeDot={{
                                r: 4,
                                fill: "hsl(var(--foreground))",
                                stroke: "hsl(var(--card))",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UsageChart;
