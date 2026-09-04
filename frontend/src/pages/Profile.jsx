import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Loading, Avatar } from '../components/ui';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = async () => {
    const p = await api.get('/students/me');
    setProfile(p);
    setForm({
      branch: p.branch, graduation_year: p.graduation_year, cgpa: p.cgpa,
      backlogs: p.backlogs, phone: p.phone || '', skills: p.skills || '',
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/students/me', {
        ...form,
        graduation_year: parseInt(form.graduation_year, 10),
        cgpa: parseFloat(form.cgpa),
        backlogs: parseInt(form.backlogs, 10),
      });
      setNotice('Profile updated.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await api.uploadResume(file);
      setNotice('Resume uploaded.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      await api.uploadPhoto(file);
      await refreshUser();
      setNotice('Profile photo updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Profile &amp; resume</h2>
          <div className="desc">Keep this up to date so recruiters see the best version of you.</div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Photo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.full_name} seed={user.email} photoPath={user.photo_path} size={72} />
          <div style={{ flex: 1 }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              {uploadingPhoto ? 'Uploading…' : user.photo_path ? 'Replace photo' : 'Upload photo'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhoto} style={{ display: 'none' }} disabled={uploadingPhoto} />
            </label>
            <div className="field-hint" style={{ marginTop: 6 }}>
              JPG, PNG or WEBP. {!user.photo_path && 'Until you add one, a generated avatar is shown instead.'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">Basic information</div>
          <div className="field"><label>Full name</label><input value={user.full_name} disabled /></div>
          <div className="field"><label>Email</label><input value={user.email} disabled /></div>
          <div className="field"><label>Roll number</label><input value={profile.roll_number} disabled /></div>

          <form id="profile-form" onSubmit={save}>
            <div className="field-row">
              <div className="field"><label>Branch</label><input required value={form.branch} onChange={(e) => set('branch', e.target.value)} /></div>
              <div className="field"><label>Graduation year</label><input required type="number" value={form.graduation_year} onChange={(e) => set('graduation_year', e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>CGPA</label><input required type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} /></div>
              <div className="field"><label>Active backlogs</label><input required type="number" min="0" value={form.backlogs} onChange={(e) => set('backlogs', e.target.value)} /></div>
            </div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 90000 00000" /></div>
            <div className="field"><label>Skills (comma separated)</label><input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Python, React, SQL" /></div>
          </form>
          <button className="btn btn-primary" form="profile-form" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>

        <div className="card">
          <div className="section-title">Resume</div>
          {profile.resume_path ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--ink-50)', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 24 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div className="cell-title">Resume on file</div>
                <div className="cell-sub">Visible to recruiters when you apply</div>
              </div>
              <a className="btn btn-secondary btn-sm" href={api.fileUrl(profile.resume_path)} target="_blank" rel="noreferrer">View</a>
            </div>
          ) : (
            <div className="alert alert-info">No resume uploaded yet — recruiters can't see one until you add it.</div>
          )}
          <label className="btn btn-primary btn-block" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : profile.resume_path ? 'Replace resume (PDF/DOC)' : 'Upload resume (PDF/DOC)'}
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} style={{ display: 'none' }} disabled={uploading} />
          </label>

          <div className="divider" />
          <div className="section-title">Profile strength</div>
          <ChecklistItem done={form.cgpa > 0} label="CGPA added" />
          <ChecklistItem done={!!form.skills} label="Skills listed" />
          <ChecklistItem done={!!profile.resume_path} label="Resume uploaded" />
          <ChecklistItem done={!!form.phone} label="Phone number added" />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13.5 }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--success-bg)' : 'var(--ink-100)', color: done ? 'var(--success-fg)' : 'var(--ink-400)', fontSize: 11,
      }}>{done ? '✓' : ''}</span>
      <span style={{ color: done ? 'var(--ink-800)' : 'var(--ink-400)' }}>{label}</span>
    </div>
  );
}
