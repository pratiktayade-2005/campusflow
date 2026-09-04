import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading, Modal, formatDate } from '../components/ui';
import JobApplicantsModal from './JobApplicantsModal';

const EMPTY_JOB = {
  title: '', description: '', job_type: 'Full-time', package_lpa: '', location: '',
  min_cgpa: '0', max_backlogs: '0', allowed_branches: '', openings: '1', deadline: '',
};

export default function Jobs() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [saving, setSaving] = useState(false);

  const [detailJob, setDetailJob] = useState(null);
  const [applicantsJob, setApplicantsJob] = useState(null);

  const load = async () => {
    setLoading(true);
    const endpoint = user.role === 'RECRUITER' ? '/jobs/mine' : '/jobs';
    const data = await api.get(endpoint);
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
        min_cgpa: parseFloat(form.min_cgpa || '0'),
        max_backlogs: parseInt(form.max_backlogs || '0', 10),
        openings: parseInt(form.openings || '1', 10),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      await api.post('/jobs', payload);
      setCreateOpen(false);
      setForm(EMPTY_JOB);
      setNotice('Job posted successfully.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (job) => {
    await api.put(`/jobs/${job.id}/status`, { status: job.status === 'OPEN' ? 'CLOSED' : 'OPEN' });
    load();
  };

  const apply = async (job) => {
    setError('');
    try {
      await api.post(`/applications/${job.id}`, {});
      setNotice(`Applied to ${job.title} at ${job.company_name}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const visibleJobs = jobs
    .filter((j) => (search ? j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name?.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((j) => {
      if (filter === 'ALL') return true;
      if (filter === 'ELIGIBLE') return j.eligible;
      if (filter === 'OPEN') return j.status === 'OPEN';
      if (filter === 'CLOSED') return j.status === 'CLOSED';
      return true;
    });

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>{user.role === 'RECRUITER' ? 'My job postings' : user.role === 'PLACEMENT_OFFICER' ? 'All jobs' : 'Browse jobs'}</h2>
          <div className="desc">
            {user.role === 'RECRUITER' && 'Post new roles and manage applicants for your company.'}
            {user.role === 'STUDENT' && 'Explore open roles matched to your eligibility.'}
            {user.role === 'PLACEMENT_OFFICER' && 'Overview of every job posted on the platform.'}
          </div>
        </div>
        {user.role === 'RECRUITER' && (
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Post a job</button>
        )}
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ maxWidth: 320 }}>
          🔎<input placeholder="Search by role or company…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pill-filter">
          <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>All</button>
          {user.role === 'STUDENT' && <button className={filter === 'ELIGIBLE' ? 'active' : ''} onClick={() => setFilter('ELIGIBLE')}>Eligible for me</button>}
          <button className={filter === 'OPEN' ? 'active' : ''} onClick={() => setFilter('OPEN')}>Open</button>
          <button className={filter === 'CLOSED' ? 'active' : ''} onClick={() => setFilter('CLOSED')}>Closed</button>
        </div>
      </div>

      {loading ? <Loading /> : visibleJobs.length === 0 ? (
        <EmptyState icon="💼" title="No jobs found" desc="Try a different search or filter." />
      ) : (
        <div className="grid grid-2">
          {visibleJobs.map((job) => (
            <div className="job-card" key={job.id}>
              <div className="job-card-head">
                <div style={{ display: 'flex', gap: 12 }}>
                  {job.company_logo_path ? (
                    <img src={api.fileUrl(job.company_logo_path)} alt={job.company_name} className="company-mark-img" />
                  ) : (
                    <div className="company-mark">{job.company_name?.slice(0, 2).toUpperCase()}</div>
                  )}
                  <div>
                    <h3>{job.title}</h3>
                    <div className="company-name">{job.company_name}</div>
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="job-meta">
                <span>📍 {job.location || 'Flexible'}</span>
                <span>🗂 {job.job_type}</span>
                <span>👥 {job.applicant_count} applicant{job.applicant_count === 1 ? '' : 's'}</span>
                {job.deadline && <span>⏰ Apply by {formatDate(job.deadline)}</span>}
                {job.deadline && job.status === 'OPEN' && <DeadlineChip deadline={job.deadline} />}
              </div>
              {user.role === 'STUDENT' && (
                <div className="job-meta">
                  <span>Min CGPA {job.min_cgpa}</span>
                  <span>Max backlogs {job.max_backlogs}</span>
                  {job.eligible === false && <span style={{ color: 'var(--danger-fg)', fontWeight: 600 }}>Not eligible</span>}
                </div>
              )}
              <div className="job-card-foot">
                <div className="pkg-tag">{job.package_lpa ? `₹${job.package_lpa} LPA` : 'Not disclosed'}<small style={{ display: 'block' }}>Package</small></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setDetailJob(job)}>Details</button>
                  {user.role === 'STUDENT' && (
                    job.already_applied
                      ? <button className="btn btn-secondary btn-sm" disabled>Applied ✓</button>
                      : <button className="btn btn-primary btn-sm" disabled={!job.eligible || job.status !== 'OPEN'} onClick={() => apply(job)}>Apply now</button>
                  )}
                  {user.role === 'RECRUITER' && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => setApplicantsJob(job)}>Applicants</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(job)}>{job.status === 'OPEN' ? 'Close' : 'Reopen'}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailJob && (
        <Modal title={detailJob.title} onClose={() => setDetailJob(null)} width={560}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <StatusBadge status={detailJob.status} />
            <span className="badge badge-neutral">{detailJob.job_type}</span>
          </div>
          <p style={{ color: 'var(--ink-600)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
            {detailJob.description || 'No description provided.'}
          </p>
          <div className="grid grid-2">
            <div><div className="cell-sub">Company</div><div className="cell-title">{detailJob.company_name}</div></div>
            <div><div className="cell-sub">Location</div><div className="cell-title">{detailJob.location || '—'}</div></div>
            <div><div className="cell-sub">Package</div><div className="cell-title">{detailJob.package_lpa ? `₹${detailJob.package_lpa} LPA` : '—'}</div></div>
            <div><div className="cell-sub">Openings</div><div className="cell-title">{detailJob.openings}</div></div>
            <div><div className="cell-sub">Min CGPA</div><div className="cell-title">{detailJob.min_cgpa}</div></div>
            <div><div className="cell-sub">Max backlogs</div><div className="cell-title">{detailJob.max_backlogs}</div></div>
            <div><div className="cell-sub">Eligible branches</div><div className="cell-title">{detailJob.allowed_branches || 'All branches'}</div></div>
            <div><div className="cell-sub">Deadline</div><div className="cell-title">{formatDate(detailJob.deadline)}</div></div>
          </div>
        </Modal>
      )}

      {createOpen && (
        <Modal title="Post a new job" onClose={() => setCreateOpen(false)} width={560}>
          <form id="job-form" onSubmit={submitJob}>
            <div className="field"><label>Job title</label><input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Software Engineer" /></div>
            <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Role responsibilities, tech stack, etc." /></div>
            <div className="field-row">
              <div className="field">
                <label>Job type</label>
                <select value={form.job_type} onChange={(e) => set('job_type', e.target.value)}>
                  <option>Full-time</option><option>Internship</option>
                </select>
              </div>
              <div className="field"><label>Package (LPA)</label><input type="number" step="0.1" value={form.package_lpa} onChange={(e) => set('package_lpa', e.target.value)} placeholder="12.5" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Location</label><input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru / Remote" /></div>
              <div className="field"><label>Openings</label><input type="number" min="1" value={form.openings} onChange={(e) => set('openings', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Minimum CGPA</label><input type="number" step="0.1" value={form.min_cgpa} onChange={(e) => set('min_cgpa', e.target.value)} /></div>
              <div className="field"><label>Max backlogs allowed</label><input type="number" min="0" value={form.max_backlogs} onChange={(e) => set('max_backlogs', e.target.value)} /></div>
            </div>
            <div className="field"><label>Allowed branches (comma separated, leave blank for all)</label><input value={form.allowed_branches} onChange={(e) => set('allowed_branches', e.target.value)} placeholder="Computer Science, Electronics" /></div>
            <div className="field"><label>Application deadline</label><input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
            {error && <div className="alert alert-error">{error}</div>}
          </form>
          <div className="modal-foot" style={{ marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="job-form" disabled={saving}>{saving ? 'Posting…' : 'Post job'}</button>
          </div>
        </Modal>
      )}

      {applicantsJob && (
        <JobApplicantsModal job={applicantsJob} onClose={() => { setApplicantsJob(null); load(); }} />
      )}
    </div>
  );
}

function DeadlineChip({ deadline }) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return <span className="badge badge-neutral">Deadline passed</span>;
  if (days === 0) return <span className="badge badge-danger">Closes today</span>;
  if (days <= 3) return <span className="badge badge-danger">{days} day{days === 1 ? '' : 's'} left</span>;
  if (days <= 7) return <span className="badge badge-warning">{days} days left</span>;
  return <span className="badge badge-neutral">{days} days left</span>;
}
