import Head from 'next/head';
import { useState } from 'react';

type KycSubmission = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kycStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  kycSubmittedAt?: string;
  kycRejectionReason?: string;
  kycDocuments?: {
    documentFrontUrl?: string;
    documentBackUrl?: string;
    selfieUrl?: string;
  };
};

type KycReview = {
  id: string;
  previousStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  newStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  reviewNote?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
};

type KycReviewPage = {
  items: KycReview[];
  nextCursor: string | null;
};

type ReviewFilters = {
  status: '' | 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  subjectEmail: string;
  reviewerEmail: string;
  startDate: string;
  endDate: string;
};

export default function Home() {
  const [token, setToken] = useState('');
  const [apiBase, setApiBase] = useState(process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api');
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [reviewsByUser, setReviewsByUser] = useState<Record<string, KycReviewPage>>({});
  const [expandedReviewUserId, setExpandedReviewUserId] = useState<string | null>(null);
  const [loadingReviewsFor, setLoadingReviewsFor] = useState<string | null>(null);
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>({
    status: '',
    subjectEmail: '',
    reviewerEmail: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!token) {
      setError('Admin token required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/users/kyc/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to fetch submissions');
      }
      const data = await resp.json();
      setSubmissions(Array.isArray(data) ? data : []);
      setReviewsByUser({});
      setExpandedReviewUserId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: string, status: 'VERIFIED' | 'REJECTED') => {
    let reason: string | undefined;
    if (status === 'REJECTED') {
      const input = (window.prompt('Rejection reason (required):') || '').trim();
      if (!input) {
        setError('Rejection reason is required.');
        return;
      }
      reason = input;
    }
    const reviewNote = (window.prompt('Reviewer note (optional):') || '').trim() || undefined;
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/users/kyc/${userId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, rejectionReason: reason, reviewNote }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to update status');
      }
      await fetchSubmissions();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const buildReviewQuery = (cursor?: string, includePaging = true) => {
    const params = new URLSearchParams();
    if (includePaging) {
      params.set('limit', '10');
      if (cursor) params.set('cursor', cursor);
    }
    if (reviewFilters.status) params.set('status', reviewFilters.status);
    if (reviewFilters.subjectEmail.trim()) params.set('subjectEmail', reviewFilters.subjectEmail.trim());
    if (reviewFilters.reviewerEmail.trim()) params.set('reviewerEmail', reviewFilters.reviewerEmail.trim());
    if (reviewFilters.startDate) params.set('startDate', new Date(reviewFilters.startDate).toISOString());
    if (reviewFilters.endDate) params.set('endDate', new Date(reviewFilters.endDate).toISOString());
    return params.toString();
  };

  const onChangeReviewFilter = (next: Partial<ReviewFilters>) => {
    setReviewFilters((prev) => ({ ...prev, ...next }));
    setReviewsByUser({});
    setExpandedReviewUserId(null);
  };

  const toggleReviews = async (userId: string) => {
    if (expandedReviewUserId === userId) {
      setExpandedReviewUserId(null);
      return;
    }
    if (reviewsByUser[userId]) {
      setExpandedReviewUserId(userId);
      return;
    }

    setLoadingReviewsFor(userId);
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/users/kyc/${userId}/reviews?${buildReviewQuery()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to load review history');
      }
      const data = await resp.json();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      const nextCursor = typeof data?.nextCursor === 'string' ? data.nextCursor : null;
      setReviewsByUser((prev) => ({ ...prev, [userId]: { items, nextCursor } }));
      setExpandedReviewUserId(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to load review history');
    } finally {
      setLoadingReviewsFor(null);
    }
  };

  const loadMoreReviews = async (userId: string) => {
    const current = reviewsByUser[userId];
    if (!current?.nextCursor) {
      return;
    }
    setLoadingReviewsFor(userId);
    setError(null);
    try {
      const resp = await fetch(
        `${apiBase}/users/kyc/${userId}/reviews?${buildReviewQuery(current.nextCursor)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to load more review history');
      }
      const data = await resp.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const nextCursor = typeof data?.nextCursor === 'string' ? data.nextCursor : null;
      setReviewsByUser((prev) => ({
        ...prev,
        [userId]: {
          items: [...(prev[userId]?.items || []), ...items],
          nextCursor
        }
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load more review history');
    } finally {
      setLoadingReviewsFor(null);
    }
  };

  const exportReviewsCsv = async (userId: string) => {
    if (!token) {
      setError('Admin token required');
      return;
    }
    setLoadingReviewsFor(userId);
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/users/kyc/${userId}/reviews/export.csv?${buildReviewQuery()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to export CSV');
      }
      const csvText = await resp.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kyc-reviews-${userId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setLoadingReviewsFor(null);
    }
  };

  const exportAllReviewsCsv = async () => {
    if (!token) {
      setError('Admin token required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/users/kyc/reviews/export.csv?${buildReviewQuery(undefined, false)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to export all reviews CSV');
      }
      const csvText = await resp.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kyc-reviews-all-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export all reviews CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>StewiePay Admin</title>
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p style={{ color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Admin</p>
        <h1 style={{ fontSize: '2.25rem', marginTop: '0.5rem' }}>KYC Review</h1>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            placeholder="API base (e.g. http://localhost:3000/api)"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', minWidth: 320 }}
          />
          <input
            placeholder="Admin token (Bearer)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', minWidth: 360 }}
          />
          <button
            onClick={fetchSubmissions}
            style={{ padding: '0.5rem 0.75rem', background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            {loading ? 'Loading...' : 'Load submissions'}
          </button>
          <button
            onClick={exportAllReviewsCsv}
            style={{ padding: '0.5rem 0.75rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            {loading ? 'Exporting...' : 'Export all reviews CSV'}
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={reviewFilters.status}
            onChange={(e) => onChangeReviewFilter({ status: e.target.value as ReviewFilters['status'] })}
            style={{ padding: '0.5rem 0.75rem', minWidth: 170 }}
          >
            <option value="">All review statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input
            placeholder="Subject user email"
            value={reviewFilters.subjectEmail}
            onChange={(e) => onChangeReviewFilter({ subjectEmail: e.target.value })}
            style={{ padding: '0.5rem 0.75rem', minWidth: 220 }}
          />
          <input
            placeholder="Reviewer email"
            value={reviewFilters.reviewerEmail}
            onChange={(e) => onChangeReviewFilter({ reviewerEmail: e.target.value })}
            style={{ padding: '0.5rem 0.75rem', minWidth: 220 }}
          />
          <input
            type="date"
            value={reviewFilters.startDate}
            onChange={(e) => onChangeReviewFilter({ startDate: e.target.value })}
            style={{ padding: '0.5rem 0.75rem' }}
          />
          <input
            type="date"
            value={reviewFilters.endDate}
            onChange={(e) => onChangeReviewFilter({ endDate: e.target.value })}
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        {error && (
          <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>{error}</p>
        )}
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          {submissions.map((s) => (
            <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name} ({s.email})</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>
                    Status: {s.kycStatus} {s.kycSubmittedAt ? `• Submitted ${new Date(s.kycSubmittedAt).toLocaleString()}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateStatus(s.id, 'VERIFIED')}
                    style={{ padding: '0.4rem 0.7rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6 }}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => updateStatus(s.id, 'REJECTED')}
                    style={{ padding: '0.4rem 0.7rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
              {s.kycRejectionReason && (
                <div style={{ marginTop: '0.5rem', color: '#b91c1c' }}>
                  Rejection: {s.kycRejectionReason}
                </div>
              )}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleReviews(s.id)}
                    style={{ padding: '0.35rem 0.6rem', background: '#111827', color: '#fff', border: 'none', borderRadius: 6 }}
                  >
                    {loadingReviewsFor === s.id
                      ? 'Loading...'
                      : expandedReviewUserId === s.id
                        ? 'Hide review history'
                        : 'Show review history'}
                  </button>
                  <button
                    onClick={() => exportReviewsCsv(s.id)}
                    style={{ padding: '0.35rem 0.6rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6 }}
                  >
                    {loadingReviewsFor === s.id ? 'Preparing CSV...' : 'Export CSV'}
                  </button>
                </div>
              </div>
              {expandedReviewUserId === s.id && (
                <div style={{ marginTop: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem' }}>
                  {(reviewsByUser[s.id]?.items || []).length === 0 ? (
                    <p style={{ color: '#6b7280', margin: 0 }}>No review events yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      {(reviewsByUser[s.id]?.items || []).map((r) => (
                        <div key={r.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.6rem' }}>
                          <div style={{ fontWeight: 600 }}>{r.previousStatus} → {r.newStatus}</div>
                          <div style={{ color: '#6b7280', fontSize: 13 }}>
                            {new Date(r.createdAt).toLocaleString()}
                            {r.reviewer?.name ? ` • ${r.reviewer.name}` : ''}
                          </div>
                          {r.rejectionReason ? (
                            <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 4 }}>
                              Reason: {r.rejectionReason}
                            </div>
                          ) : null}
                          {r.reviewNote ? (
                            <div style={{ color: '#111827', fontSize: 13, marginTop: 4 }}>
                              Note: {r.reviewNote}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {reviewsByUser[s.id]?.nextCursor && (
                        <button
                          onClick={() => loadMoreReviews(s.id)}
                          style={{ padding: '0.35rem 0.6rem', background: '#4b5563', color: '#fff', border: 'none', borderRadius: 6, justifySelf: 'start' }}
                        >
                          {loadingReviewsFor === s.id ? 'Loading...' : 'Load more'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {s.kycDocuments?.documentFrontUrl && (
                  <a href={s.kycDocuments.documentFrontUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#111' }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>Document Front</div>
                    <img src={s.kycDocuments.documentFrontUrl} alt="Document front" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </a>
                )}
                {s.kycDocuments?.documentBackUrl && (
                  <a href={s.kycDocuments.documentBackUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#111' }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>Document Back</div>
                    <img src={s.kycDocuments.documentBackUrl} alt="Document back" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </a>
                )}
                {s.kycDocuments?.selfieUrl && (
                  <a href={s.kycDocuments.selfieUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#111' }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>Selfie</div>
                    <img src={s.kycDocuments.selfieUrl} alt="Selfie" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {!loading && submissions.length === 0 && (
            <p style={{ color: '#6b7280' }}>No submissions found.</p>
          )}
        </div>
      </main>
    </>
  );
}





















