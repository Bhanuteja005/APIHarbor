"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const SLICE_OPACITIES = [0.75, 0.35, 0.2, 0.1];

interface PerformanceCardProps {
    breakdown: { name: string; value: number }[];
}

const PerformanceCard = ({ breakdown }: PerformanceCardProps) => {

    const hasData = breakdown.some((slice) => slice.value > 0);
    const data = hasData ? breakdown.filter((slice) => slice.value > 0) : [{ name: "No keys yet", value: 1 }];

    return (
        <div className="flex flex-col rounded-2xl bg-card p-5">
            <p className="text-center text-sm font-medium">
                Overall Performance
            </p>
            <div className="mx-auto mt-4 h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length || !hasData) return null;
                                return (
                                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                                        <span className="font-medium">{payload[0].name}</span>
                                        <span className="ml-2 text-muted-foreground">{payload[0].value} keys</span>
                                    </div>
                                );
                            }}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            startAngle={90}
                            endAngle={-270}
                            outerRadius="100%"
                            stroke="hsl(var(--card))"
                            strokeWidth={1}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill="hsl(var(--foreground))"
                                    fillOpacity={hasData ? SLICE_OPACITIES[index % SLICE_OPACITIES.length] : 0.08}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-6 text-justify text-xs leading-relaxed text-muted-foreground">
                Total key health, across all providers. Hover over
                to get more details on key performance.
            </p>
        </div>
    );
};

export default PerformanceCard;
