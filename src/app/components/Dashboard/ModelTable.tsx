/**
 * ModelTable — server component, pure HTML
 * Workers AI usage broken down by model.
 */

type Model = {
    modelId: string;
    neurons: number;
    requests: number;
  };
  
  type Props = {
    models: Model[];
  };
  
  function fmt(n: number): string {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toString();
  }
  
  function modelCost(neurons: number): number {
    // 10k neurons/day * 30 days = 300k included monthly
    const overage = Math.max(0, neurons - 300_000);
    return (overage / 1_000) * 0.011;
  }
  
  export function ModelTable({ models }: Props) {
    if (!models?.length) return null;
  
    const sorted = [...models].sort((a, b) => b.neurons - a.neurons);
    const totalNeurons = models.reduce((s, m) => s + m.neurons, 0);
  
    return (
      <div className="model-table-wrap">
        <div className="section-header">
          <h2 className="section-title">Workers AI — model breakdown</h2>
          <span className="section-meta">{fmt(totalNeurons)} total neurons</span>
        </div>
        <table className="model-table">
          <thead>
            <tr>
              <th>Model</th>
              <th className="text-right">Requests</th>
              <th className="text-right">Neurons</th>
              <th className="text-right">Share</th>
              <th className="text-right">Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const share = totalNeurons > 0
                ? Math.round((m.neurons / totalNeurons) * 100)
                : 0;
              const cost = modelCost(m.neurons);
              const isTop = i === 0;
  
              return (
                <tr key={m.modelId} className={isTop ? "model-row--top" : ""}>
                  <td className="model-id">
                    {isTop && <span className="model-top-marker">▶ </span>}
                    {m.modelId}
                  </td>
                  <td className="text-right">{fmt(m.requests)}</td>
                  <td className="text-right">{fmt(m.neurons)}</td>
                  <td className="text-right">
                    <div className="share-bar-wrap">
                      <div
                        className="share-bar"
                        style={{ width: `${share}%` }}
                      />
                      <span>{share}%</span>
                    </div>
                  </td>
                  <td className="text-right model-cost">
                    ${cost.toFixed(cost < 0.01 ? 4 : 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="table-disclaimer">
          Neurons beyond 10k/day free tier are billed at $0.011/1k.
          Monthly free allowance: ~300k neurons.
        </p>
      </div>
    );
  }