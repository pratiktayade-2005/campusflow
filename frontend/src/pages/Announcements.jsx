import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { EmptyState, Loading, Modal, timeAgo, Avatar } from '../components/ui';

const CAN_POST = ['PLACEMENT_OFFICER', 'FACULTY'];

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: '🌐' },
  { value: 'STUDENT', label: 'Students', icon: '🎓' },
  { value: 'FACULTY', label: 'Faculty', icon: '📘' },
  { value: 'RECRUITER', label: 'Recruiters', icon: '🏢' },
];

function audienceLabel(audienceStr) {
  const roles = audienceStr.split(',').map((s) => s.trim()).filter(Boolean);
  if (roles.includes('ALL')) return 'Everyone';
  return roles
    .map((r) => AUDIENCE_OPTIONS.find((o) => o.value === r)?.label || r)
    .join(' + ');
}

export default function Announcements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audiences: ['ALL'] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setItems(await api.get('/announcements'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleAudience = (value) => {
    setForm((f) => {
      if (value === 'ALL') return { ...f, audiences: ['ALL'] };
      let next = f.audiences.includes(value)
        ? f.audiences.filter((a) => a !== value)
        : [...f.audiences.filter((a) => a !== 'ALL'), value];
      if (next.length === 0) next = ['ALL'];
      return { ...f, audiences: next };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/announcements', form);
      setCreateOpen(false);
      setForm({ title: '', body: '', audiences: ['ALL'] });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.del(`/announcements/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Announcements</h2>
          <div className="desc">Updates from the placement cell and faculty.</div>
        </div>
        {CAN_POST.includes(user.role) && (
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ New announcement</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <Loading /> : items.length === 0 ? (
        <EmptyState icon="📢" title="No announcements yet" desc="Check back soon for updates." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
          {items.map((a) => (
            <div className="card" key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={a.author_name} seed={a.author_id} size={36} />
                  <div>
                    <div className="cell-title">{a.title}</div>
                    <div className="cell-sub">{a.author_name} · {timeAgo(a.created_at)} · <span className="badge badge-neutral" style={{ marginLeft: 2 }}>{audienceLabel(a.audience)}</span></div>
                  </div>
                </div>
                {a.author_id === user.id && (
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(a.id)}>Delete</button>
                )}
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal title="New announcement" onClose={() => setCreateOpen(false)} width={520}>
          <form id="ann-form" onSubmit={submit}>
            <div className="field"><label>Title</label><input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Placement drive update" /></div>
            <div className="field"><label>Message</label><textarea required rows={4} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Share the details…" /></div>
            <div className="field">
              <label>Audience — pick one or more</label>
              <div className="audience-grid">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const active = form.audiences.includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      className={`audience-option${active ? ' active' : ''}`}
                      onClick={() => toggleAudience(opt.value)}
                    >
                      <span>{opt.icon} {opt.label}</span>
                      {active && <span className="audience-check">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="field-hint">Selecting "Everyone" clears other choices; picking a specific role clears "Everyone".</div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </form>
          <div className="modal-foot">
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="ann-form" disabled={saving}>{saving ? 'Posting…' : 'Post announcement'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
