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
import {
  createCompetitor,
  getSentimentAnalytics,
  getTrendingHashtags,
  listCompetitors,
  syncCompetitor,
} from '../services/api.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function IntelligencePage() {
  const [sentiment, setSentiment] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [error, setError] = useState('');
  const [syncingId, setSyncingId] = useState(0);
  const [form, setForm] = useState({
    name: '',
    platform: 'instagram',
    publicHandle: '',
    accessToken: '',
  });

  async function load() {
    try {
      setError('');
      const [s, h, c] = await Promise.all([
        getSentimentAnalytics(),
        getTrendingHashtags(),
        listCompetitors(),
      ]);

      setSentiment(s);
      setHashtags(h.data || []);
      setCompetitors(c.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sentimentChart = useMemo(() => ({
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [{
      label: 'Average Sentiment Score',
      data: sentiment?.trend || [],
      borderColor: '#0b7285',
      backgroundColor: 'rgba(11, 114, 133, 0.2)',
      tension: 0.25,
    }],
  }), [sentiment]);

  async function submitCompetitor(event) {
    event.preventDefault();
    try {
      setError('');
      await createCompetitor(form);
      setForm({ name: '', platform: 'instagram', publicHandle: '', accessToken: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runSync(competitorId) {
    try {
      setSyncingId(competitorId);
      setError('');
      await syncCompetitor(competitorId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingId(0);
    }
  }

  return (
    <section>
      <h2>Intelligence</h2>
      <p>Track competitors, monitor sentiment, and watch hashtag trends.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="split-grid">
        <article className="panel">
          <h3>Sentiment Over Time</h3>
          <Line data={sentimentChart} />
          {sentiment ? (
            <p className="small-meta">
              Positive: {sentiment.totals?.positive ?? 0} | Neutral: {sentiment.totals?.neutral ?? 0} | Negative: {sentiment.totals?.negative ?? 0}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <h3>Trending Hashtags</h3>
          {hashtags.length === 0 ? <p>No hashtag data yet. Sync accounts first.</p> : null}
          <ul>
            {hashtags.map((tag) => (
              <li key={tag.tag}>
                <strong>#{tag.tag}</strong> trend score: {tag.trendScore} | mentions: {tag.mentions} | engagement: {tag.engagement}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="split-grid">
        <article className="panel">
          <h3>Add Competitor</h3>
          <form className="stack" onSubmit={submitCompetitor}>
            <input
              placeholder="Competitor name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <select
              value={form.platform}
              onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
            </select>
            <input
              placeholder="Public handle"
              value={form.publicHandle}
              onChange={(event) => setForm((prev) => ({ ...prev, publicHandle: event.target.value }))}
              required
            />
            <textarea
              placeholder="Optional token for live API sync"
              value={form.accessToken}
              onChange={(event) => setForm((prev) => ({ ...prev, accessToken: event.target.value }))}
            />
            <button type="submit">Add Competitor</button>
          </form>
        </article>

        <article className="panel">
          <h3>Competitors</h3>
          {competitors.length === 0 ? <p>No competitors configured.</p> : null}
          <ul>
            {competitors.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> ({item.platform}) - {item.publicHandle}
                <div className="small-meta">status: {item.status}</div>
                {item.liveMetrics ? (
                  <div className="small-meta">
                    reach: {item.liveMetrics.reach || 0} | engagement: {item.liveMetrics.engagement || 0}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => runSync(item.id)}
                  disabled={syncingId === item.id}
                >
                  {syncingId === item.id ? 'Syncing...' : 'Sync Competitor'}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
