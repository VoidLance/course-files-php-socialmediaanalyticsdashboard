import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getPeriodComparison, getPlatformAnalytics } from '../services/api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

function isoDate(value) {
  if (!value) {
    return '';
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }

  return d.toISOString().slice(0, 10);
}

export default function InsightsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (1000 * 60 * 60 * 24 * 30));

  const [filters, setFilters] = useState({
    from: isoDate(thirtyDaysAgo.toISOString()),
    to: isoDate(today.toISOString()),
  });
  const [platforms, setPlatforms] = useState([]);
  const [compare, setCompare] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [platformPayload, comparePayload] = await Promise.all([
        getPlatformAnalytics(filters),
        getPeriodComparison(),
      ]);

      setPlatforms(platformPayload.data || []);
      setCompare(comparePayload);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const platformChart = useMemo(() => {
    return {
      labels: platforms.map((row) => row.platform),
      datasets: [
        {
          label: 'Reach',
          data: platforms.map((row) => row.reach || 0),
          backgroundColor: '#0b7285',
        },
        {
          label: 'Engagement',
          data: platforms.map((row) => row.engagement || 0),
          backgroundColor: '#74c0fc',
        },
      ],
    };
  }, [platforms]);

  const comparisonChart = useMemo(() => {
    if (!compare) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: ['Reach', 'Engagement'],
      datasets: [
        {
          label: 'Current',
          data: [compare.current?.reach || 0, compare.current?.engagement || 0],
          borderColor: '#0b7285',
          backgroundColor: 'rgba(11, 114, 133, 0.2)',
        },
        {
          label: 'Previous',
          data: [compare.previous?.reach || 0, compare.previous?.engagement || 0],
          borderColor: '#495057',
          backgroundColor: 'rgba(73, 80, 87, 0.2)',
        },
      ],
    };
  }, [compare]);

  return (
    <section>
      <h2>Platform Insights</h2>
      <p>Compare reach and engagement by platform and across time periods.</p>

      {error ? <p className="error">{error}</p> : null}

      <article className="panel">
        <h3>Date Range</h3>
        <form className="split-grid" onSubmit={(event) => { event.preventDefault(); load(); }}>
          <label>
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            />
          </label>
          <button type="submit">Apply Range</button>
        </form>
      </article>

      <div className="split-grid">
        <article className="panel">
          <h3>Platform Performance</h3>
          <Bar data={platformChart} />
        </article>
        <article className="panel">
          <h3>Current vs Previous Period</h3>
          <Line data={comparisonChart} />
          {compare ? (
            <p className="small-meta">
              Reach delta: {compare.deltaPercent?.reach ?? 0}% | Engagement delta: {compare.deltaPercent?.engagement ?? 0}%
            </p>
          ) : null}
        </article>
      </div>

      <article className="panel">
        <h3>Audience Demographics</h3>
        {platforms.length === 0 ? <p>No platform data yet.</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>18-24</th>
                <th>25-34</th>
                <th>35-44</th>
                <th>45+</th>
                <th>Engagement Rate</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((row) => (
                <tr key={row.platform}>
                  <td>{row.platform}</td>
                  <td>{row.audience?.age_18_24 ?? 0}%</td>
                  <td>{row.audience?.age_25_34 ?? 0}%</td>
                  <td>{row.audience?.age_35_44 ?? 0}%</td>
                  <td>{row.audience?.age_45_plus ?? 0}%</td>
                  <td>{row.engagementRate ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
