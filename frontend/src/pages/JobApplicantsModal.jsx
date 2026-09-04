import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading, Modal, formatDate } from '../components/ui';

const STATUS_OPTIONS = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'REJECTED'];

export default function JobApplicantsModal({ job, onClose }) {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [scheduleFor, setScheduleFor] = useState(null);
  const [schedForm, setSchedForm] = useState({ scheduled_at: '', mode: 'Online', round_name: 'Technical', round_number: 1 });

  const [offerFor, setOfferFor] = useState(null);
  const [offerForm, setOfferForm] = useState({ package_lpa: '', role: job.title });

  const load = async () => {
    setLoading(true);
    const data = await api.get(`/applications/job/${job.id}`);
    setApplicants(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (applicationId, status) => {
    setError('');
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setNotice('Status updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/interviews', {
        application_id: scheduleFor.application_id,
        scheduled_at: new Date(schedForm.scheduled_at).toISOString(),
        mode: schedForm.mode,
        round_name: schedForm.round_name,
        round_number: parseInt(schedForm.round_number, 10),
      });
      setNotice(`Interview scheduled for ${scheduleFor.full_name}.`);
      setScheduleFor(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/offers', {
        application_id: offerFor.application_id,
        package_lpa: parseFloat(offerForm.package_lpa),
        role: offerForm.role,
      });
      setNotice(`Offer sent to ${offerFor.full_name}.`);
      setOfferFor(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={`Applicants — ${job.title}`} onClose={onClose} width={760}>
      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <Loading /> : applicants.length === 0 ? (
        <EmptyState icon="👥" title="No applicants yet" desc="Once students apply, they'll show up here." />
      ) : (
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="dtable">
            <thead>
              <tr><th>Candidate</th><th>Branch</th><th>CGPA</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.application_id}>
                  <td>
                    <div className="cell-title">{a.full_name}</div>
                    <div className="cell-sub">{a.email} · {a.roll_number}</div>
                  </td>
                  <td>{a.branch}</td>
                  <td>{a.cgpa}{a.backlogs > 0 && <span className="cell-sub"> ({a.backlogs} backlog{a.backlogs > 1 ? 's' : ''})</span>}</td>
                  <td>{formatDate(a.applied_at)}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => changeStatus(a.application_id, e.target.value)}
                      style={{ padding: '5px 8px', borderRadius: 7, border: '1.5px solid var(--border-strong)', fontSize: 12.5 }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.resume_path && <a className="btn btn-ghost btn-sm" href={api.fileUrl(a.resume_path)} target="_blank" rel="noreferrer">Resume</a>}
                      <button className="btn btn-secondary btn-sm" onClick={() => { setScheduleFor(a); setSchedForm({ scheduled_at: '', mode: 'Online', round_name: 'Technical', round_number: 1 }); }}>Interview</button>
                      <button className="btn btn-primary btn-sm" onClick={() => { setOfferFor(a); setOfferForm({ package_lpa: '', role: job.title }); }}>Offer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scheduleFor && (
        <Modal title={`Schedule interview — ${scheduleFor.full_name}`} onClose={() => setScheduleFor(null)} width={440}>
          <form id="sched-form" onSubmit={submitSchedule}>
            <div className="field"><label>Round name</label><input required value={schedForm.round_name} onChange={(e) => setSchedForm((f) => ({ ...f, round_name: e.target.value }))} /></div>
            <div className="field-row">
              <div className="field"><label>Round #</label><input type="number" min="1" value={schedForm.round_number} onChange={(e) => setSchedForm((f) => ({ ...f, round_number: e.target.value }))} /></div>
              <div className="field">
                <label>Mode</label>
                <select value={schedForm.mode} onChange={(e) => setSchedForm((f) => ({ ...f, mode: e.target.value }))}>
                  <option>Online</option><option>In-person</option><option>Telephonic</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Date &amp; time</label><input required type="datetime-local" value={schedForm.scheduled_at} onChange={(e) => setSchedForm((f) => ({ ...f, scheduled_at: e.target.value }))} /></div>
          </form>
          <div className="modal-foot">
            <button className="btn btn-secondary" onClick={() => setScheduleFor(null)}>Cancel</button>
            <button className="btn btn-primary" form="sched-form">Schedule</button>
          </div>
        </Modal>
      )}

      {offerFor && (
        <Modal title={`Extend offer — ${offerFor.full_name}`} onClose={() => setOfferFor(null)} width={420}>
          <form id="offer-form" onSubmit={submitOffer}>
            <div className="field"><label>Role</label><input required value={offerForm.role} onChange={(e) => setOfferForm((f) => ({ ...f, role: e.target.value }))} /></div>
            <div className="field"><label>Package (LPA)</label><input required type="number" step="0.1" value={offerForm.package_lpa} onChange={(e) => setOfferForm((f) => ({ ...f, package_lpa: e.target.value }))} placeholder="12.5" /></div>
          </form>
          <div className="modal-foot">
            <button className="btn btn-secondary" onClick={() => setOfferFor(null)}>Cancel</button>
            <button className="btn btn-primary" form="offer-form">Send offer</button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
