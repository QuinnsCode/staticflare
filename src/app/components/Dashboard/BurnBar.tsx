"use client";
/**
 * BurnBar — server component, pure HTML output
 * Shows MTD spend vs projected vs budget. No client JS needed.
 */

type Props = {
    current: number;
    projected: number;
    budget: number;
    dayOfMonth: number;
    daysInMonth: number;
  };
  
export function BurnBar({ current, projected, budget, dayOfMonth, daysInMonth }: Props) {
    const projectedPct = Math.min((projected / budget) * 100, 150);
    const currentPct = Math.min((current / budget) * 100, 150);
    const overBudget = projected > budget;
    const pctOfBudget = Math.round((projected / budget) * 100);

    const color =
        pctOfBudget >= 100 ? "var(--red)" :
        pctOfBudget >= 75  ? "var(--amber)" :
        pctOfBudget >= 50  ? "var(--yellow)" :
                            "var(--green)";

    const label =
        pctOfBudget >= 100 ? "🚨 OVER BUDGET" :
        pctOfBudget >= 75  ? "⚠ DANGER ZONE" :
        pctOfBudget >= 50  ? "◈ WARNING" :
                            "◆ ON TRACK";

    return (
        <div className="burn-bar-wrap">
            <div className="burn-bar-header">
                <div className="burn-bar-left">
                <span className="burn-label" style={{ color }}>
                    {label}
                </span>
                <span className="burn-projection">
                    ${projected.toFixed(2)} projected
                </span>
                </div>
                <div className="burn-bar-right">
                <span className="burn-budget">
                    ${current.toFixed(2)} / ${budget} budget
                </span>
                <span className="burn-days">
                    day {dayOfMonth} of {daysInMonth}
                </span>
                </div>
            </div>

            {/* Track */}
            <div className="burn-track">
                {/* Projected fill (lighter) */}
                <div
                className="burn-fill-projected"
                style={{ width: `${Math.min(projectedPct, 100)}%`, background: `${color}30` }}
                />
                {/* Current MTD fill (solid) */}
                <div
                className="burn-fill-current"
                style={{
                    width: `${Math.min(currentPct, 100)}%`,
                    background: color,
                }}
                />
                {/* Budget line */}
                <div className="burn-budget-line" />
            </div>

            {/* Legend */}
            <div className="burn-legend">
                <span style={{ color }}>█ MTD ${current.toFixed(2)}</span>
                <span style={{ color: `${color}80` }}>█ Projected ${projected.toFixed(2)}</span>
                {overBudget && (
                <span style={{ color: "var(--red)", fontWeight: 700 }}>
                    +${(projected - budget).toFixed(2)} over budget
                </span>
                )}
            </div>
        </div>
    );
}