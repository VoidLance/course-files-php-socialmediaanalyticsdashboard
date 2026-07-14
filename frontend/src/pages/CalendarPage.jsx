import { useEffect, useState } from 'react';
import { bulkSchedule, createDraft, listDrafts, listScheduledPosts, scheduleDraft } from '../services/api.js';

export default function CalendarPage() {
  const [drafts, setDrafts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [draftForm, setDraftForm] = useState({ title: '', content: '' });
  const [scheduleForm, setScheduleForm] = useState({ draftId: '', scheduledFor: '' });
  const [bulkForm, setBulkForm] = useState({
    rows: '1,2026-08-01T09:00\n1,2026-08-03T10:30',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      setError('');
      const [draftPayload, scheduledPayload] = await Promise.all([listDrafts(), listScheduledPosts()]);
      setDrafts(draftPayload.data || []);
      setScheduledPosts(scheduledPayload.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submitDraft(event) {
    event.preventDefault();
    try {
      setMessage('');
      await createDraft(draftForm);
      setDraftForm({ title: '', content: '' });
      setMessage('Draft saved');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitSchedule(event) {
    event.preventDefault();
    try {
      setMessage('');
      await scheduleDraft({
        draftId: Number(scheduleForm.draftId),
        scheduledFor: scheduleForm.scheduledFor,
      });
      setScheduleForm({ draftId: '', scheduledFor: '' });
      setMessage('Draft queued for publishing');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitBulkSchedule(event) {
    event.preventDefault();
    try {
      setMessage('');
      const items = bulkForm.rows
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [draftId, scheduledFor] = line.split(',').map((v) => v.trim());
          return {
            draftId: Number(draftId),
            scheduledFor,
          };
        });

      await bulkSchedule({ items });
      setMessage('Bulk schedule queued');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Content Calendar</h2>
      <p>Create drafts and queue scheduled posts across connected accounts.</p>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="ok">{message}</p> : null}

      <div className="split-grid">
        <article className="panel">
          <h3>Create Draft</h3>
          <form className="stack" onSubmit={submitDraft}>
            <input
              placeholder="Launch campaign"
              value={draftForm.title}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <textarea
              placeholder="Post content"
              value={draftForm.content}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, content: event.target.value }))}
            />
            <button type="submit">Save Draft</button>
          </form>
        </article>

        <article className="panel">
          <h3>Schedule Draft</h3>
          <form className="stack" onSubmit={submitSchedule}>
            <select
              value={scheduleForm.draftId}
              onChange={(event) => setScheduleForm((prev) => ({ ...prev, draftId: event.target.value }))}
              required
            >
              <option value="">Select draft</option>
              {drafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.title}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={scheduleForm.scheduledFor}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  scheduledFor: event.target.value,
                }))
              }
              required
            />

            <button type="submit">Queue Post</button>
          </form>

          <h3>Bulk Upload and Schedule</h3>
          <form className="stack" onSubmit={submitBulkSchedule}>
            <textarea
              placeholder="draftId,scheduledFor per line"
              value={bulkForm.rows}
              onChange={(event) => setBulkForm({ rows: event.target.value })}
              rows={5}
            />
            <button type="submit">Bulk Queue</button>
          </form>
        </article>
      </div>

      <article className="panel">
        <h3>Drafts</h3>
        {drafts.length === 0 ? <p>No drafts yet.</p> : null}
        <ul>
          {drafts.map((draft) => (
            <li key={draft.id}>{draft.title} ({draft.status})</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h3>Scheduled Posts</h3>
        {scheduledPosts.length === 0 ? <p>No scheduled posts yet.</p> : null}
        <ul>
          {scheduledPosts.map((item) => (
            <li key={item.id}>
              Draft #{item.draftId} - {item.status} - {new Date(item.scheduledFor).toLocaleString()}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
