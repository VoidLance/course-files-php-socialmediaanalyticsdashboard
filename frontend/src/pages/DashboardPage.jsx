import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getOverview } from '../services/api.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const payload = await getOverview();
        setOverview(payload);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  const chartData = useMemo(() => {
    if (!overview) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: overview.trend.labels,
      datasets: [
        {
          label: 'Engagement Rate %',
          data: overview.trend.engagementRate,
          borderColor: '#0B7285',
          backgroundColor: 'rgba(11, 114, 133, 0.20)',
          tension: 0.3,
        },
      ],
    };
  }, [overview]);

  if (error) {
    return <section><p className="error">{error}</p></section>;
  }

  if (!overview) {
    return <section><p>Loading analytics...</p></section>;
  }

  return (
    <section>
      <h2>Overview Analytics</h2>
      <div className="kpi-grid">
        <article>
          <h3>Total Reach</h3>
          <p>{overview.totals.reach.toLocaleString()}</p>
        </article>
        <article>
          <h3>Engagement</h3>
          <p>{overview.totals.engagement.toLocaleString()}</p>
        </article>
        <article>
          <h3>Follower Growth</h3>
          <p>+{overview.totals.followerGrowthPercent}%</p>
        </article>
        <article>
          <h3>Connected Accounts</h3>
          <p>{overview.totals.connectedAccounts}</p>
        </article>
        <article>
          <h3>Live Synced Accounts</h3>
          <p>{overview.totals.liveSyncedAccounts ?? 0}</p>
        </article>
        <article>
          <h3>Drafts</h3>
          <p>{overview.totals.drafts}</p>
        </article>
        <article>
          <h3>Scheduled Posts</h3>
          <p>{overview.totals.scheduledPosts}</p>
        </article>
      </div>
      <div className="chart-box">
        <Line data={chartData} />
      </div>
    </section>
  );
}
