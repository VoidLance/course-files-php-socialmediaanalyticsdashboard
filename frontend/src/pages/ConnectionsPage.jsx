import { useEffect, useState } from 'react';
import {
  completeOAuthConnect,
  createSocialAccount,
  createTeam,
  initOAuthConnect,
  listSocialAccounts,
  listTeams,
  refreshSocialAccountToken,
  syncSocialAccount,
} from '../services/api.js';

export default function ConnectionsPage() {
  const [teams, setTeams] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');
  const [accountForm, setAccountForm] = useState({
    teamId: '',
    platform: 'instagram',
    accountName: '',
    accountType: 'business',
    accessToken: '',
    externalAccountId: '',
  });
  const [syncingId, setSyncingId] = useState(0);
  const [refreshingId, setRefreshingId] = useState(0);
  const [oauthBusy, setOauthBusy] = useState(false);

  async function refresh() {
    try {
      setError('');
      const [teamsResult, accountsResult] = await Promise.all([listTeams(), listSocialAccounts()]);
      setTeams(teamsResult.data || []);
      setAccounts(accountsResult.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    async function completeFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || '';
      const state = params.get('state') || '';
      const errorParam = params.get('error') || '';

      if (errorParam) {
        setError(`OAuth provider returned error: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        return;
      }

      try {
        setOauthBusy(true);
        setError('');
        await completeOAuthConnect({ code, state });
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, document.title, cleanUrl);
        await refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setOauthBusy(false);
      }
    }

    completeFromQuery();
  }, []);

  async function submitTeam(event) {
    event.preventDefault();
    if (!teamName.trim()) {
      return;
    }

    try {
      await createTeam({ name: teamName.trim() });
      setTeamName('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitAccount(event) {
    event.preventDefault();
    try {
      await createSocialAccount({
        teamId: Number(accountForm.teamId),
        platform: accountForm.platform,
        accountName: accountForm.accountName,
        accountType: accountForm.accountType,
        accessToken: accountForm.accessToken,
        externalAccountId: accountForm.externalAccountId,
      });
      setAccountForm((prev) => ({
        ...prev,
        accountName: '',
        accessToken: '',
        externalAccountId: '',
      }));
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runSync(accountId) {
    setSyncingId(accountId);
    setError('');
    try {
      await syncSocialAccount(accountId);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingId(0);
    }
  }

  async function runTokenRefresh(accountId) {
    setRefreshingId(accountId);
    setError('');
    try {
      await refreshSocialAccountToken(accountId);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshingId(0);
    }
  }

  async function startOAuthConnect() {
    try {
      setOauthBusy(true);
      setError('');
      const payload = await initOAuthConnect({
        teamId: Number(accountForm.teamId),
        platform: accountForm.platform,
        accountName: accountForm.accountName,
        accountType: accountForm.accountType,
        externalAccountId: accountForm.externalAccountId,
        redirectUri: `${window.location.origin}/connections`,
      });

      if (!payload.authorizationUrl) {
        throw new Error('OAuth initialization failed: missing authorization URL');
      }

      window.location.assign(payload.authorizationUrl);
    } catch (err) {
      setError(err.message);
      setOauthBusy(false);
    }
  }

  return (
    <section>
      <h2>Teams and Platform Connections</h2>
      <p>Manage team workspaces and connect social media accounts.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="split-grid">
        <article className="panel">
          <h3>Create Team</h3>
          <form className="stack" onSubmit={submitTeam}>
            <input
              placeholder="Growth Team"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              required
            />
            <button type="submit">Create Team</button>
          </form>

          <h3>Teams</h3>
          {teams.length === 0 ? <p>No teams yet.</p> : null}
          <ul>
            {teams.map((team) => (
              <li key={team.id}>{team.name}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Connect Social Account</h3>
          <form className="stack" onSubmit={submitAccount}>
            <select
              value={accountForm.teamId}
              onChange={(event) => setAccountForm((prev) => ({ ...prev, teamId: event.target.value }))}
              required
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <select
              value={accountForm.platform}
              onChange={(event) => setAccountForm((prev) => ({ ...prev, platform: event.target.value }))}
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
            </select>

            <input
              placeholder="Account name"
              value={accountForm.accountName}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  accountName: event.target.value,
                }))
              }
              required
            />

            <input
              placeholder="Optional external account ID"
              value={accountForm.externalAccountId}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  externalAccountId: event.target.value,
                }))
              }
            />

            <textarea
              placeholder="Access token (required for live API sync)"
              value={accountForm.accessToken}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  accessToken: event.target.value,
                }))
              }
            />

            <button type="submit">Connect</button>
            <button
              type="button"
              onClick={startOAuthConnect}
              disabled={oauthBusy || !accountForm.teamId || !accountForm.accountName}
            >
              {oauthBusy ? 'Opening OAuth...' : 'Connect via OAuth'}
            </button>
          </form>

          <h3>Connected Accounts</h3>
          {accounts.length === 0 ? <p>No accounts connected.</p> : null}
          <ul>
            {accounts.map((account) => (
              <li key={account.id}>
                <div>
                  <strong>{account.platform}</strong> - {account.accountName}
                </div>
                <div className="small-meta">
                  status: {account.status}
                  {account.lastSyncAt ? ` | last sync: ${new Date(account.lastSyncAt).toLocaleString()}` : ''}
                </div>
                {account.liveMetrics ? (
                  <div className="small-meta">
                    followers: {account.liveMetrics.followers || 0} | reach: {account.liveMetrics.reach || 0} | engagement: {account.liveMetrics.engagement || 0}
                  </div>
                ) : null}
                {account.lastSyncError ? <div className="error">sync error: {account.lastSyncError}</div> : null}
                <button
                  type="button"
                  onClick={() => runSync(account.id)}
                  disabled={syncingId === account.id}
                >
                  {syncingId === account.id ? 'Syncing...' : 'Sync Live Data'}
                </button>
                <button
                  type="button"
                  onClick={() => runTokenRefresh(account.id)}
                  disabled={refreshingId === account.id}
                >
                  {refreshingId === account.id ? 'Refreshing...' : 'Refresh Token'}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
