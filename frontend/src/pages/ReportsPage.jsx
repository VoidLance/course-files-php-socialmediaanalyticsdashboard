import { useEffect, useState } from 'react';
import {
  evaluateAlerts,
  exportReport,
  listNotifications,
  listReports,
  requestReport,
} from '../services/api.js';

function decodeBase64(contentBase64) {
  try {
    return atob(contentBase64 || '');
  } catch (_err) {
    return '';
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [format, setFormat] = useState('pdf');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      setError('');
      const [reportData, notificationData] = await Promise.all([
        listReports(),
        listNotifications(),
      ]);
      setReports(reportData.data || []);
      setNotifications(notificationData.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createReport(event) {
    event.preventDefault();
    try {
      setMessage('');
      await requestReport({ format });
      setMessage('Report queued');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runAlertEvaluation() {
    try {
      setMessage('');
      const result = await evaluateAlerts();
      setMessage(`Alert evaluation completed: ${result.triggeredCount || 0} triggered`);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runExport(reportId) {
    try {
      const payload = await exportReport({ reportId });
      const text = decodeBase64(payload.contentBase64 || '');
      const blob = new Blob([text], { type: payload.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payload.fileName || `report-${reportId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage(`Downloaded ${payload.fileName}`);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Reports and Alerts</h2>
      <p>Generate reports, export in multiple formats, and review alert notifications.</p>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="ok">{message}</p> : null}

      <div className="split-grid">
        <article className="panel">
          <h3>Generate Report</h3>
          <form className="stack" onSubmit={createReport}>
            <select value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </select>
            <button type="submit">Queue Report</button>
          </form>
          <button type="button" onClick={runAlertEvaluation}>Evaluate Alerts</button>
        </article>

        <article className="panel">
          <h3>Reports</h3>
          {reports.length === 0 ? <p>No reports yet.</p> : null}
          <ul>
            {reports.map((report) => (
              <li key={report.id}>
                Report #{report.id} ({report.format}) - {report.status}
                <button type="button" onClick={() => runExport(report.id)}>Export</button>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="panel">
        <h3>Notifications</h3>
        {notifications.length === 0 ? <p>No notifications yet.</p> : null}
        <ul>
          {notifications.map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong>
              <div>{note.message}</div>
              <div className="small-meta">{new Date(note.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
