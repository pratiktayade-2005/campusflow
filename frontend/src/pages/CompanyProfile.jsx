import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, Loading } from '../components/ui';

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', website: '', location: '', industry: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = async () => {
    try {
      const c = await api.get('/companies/mine');
      setCompany(c);
      setForm({ name: c.name, description: c.description || '', website: c.website || '', location: c.location || '', industry: c.industry || '' });
    } catch (e) {
      setCompany(null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/companies/mine', form);
      setNotice('Company profile updated.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    setError('');
    try {
      await api.uploadCompanyLogo(file);
      setNotice('Company logo updated.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <Loading />;

  if (!company) {
    return (
      <div className="alert alert-info">
        No company profile found. This is usually created automatically at registration — contact your placement cell if it's missing.
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Company profile</h2>
          <div className="desc">This is what students and the placement cell see about your company.</div>
        </div>
        <StatusBadge status={company.status} />
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 620, marginBottom: 20 }}>
        <div className="section-title">Logo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {company.logo_path ? (
            <img
              src={api.fileUrl(company.logo_path)}
              alt={company.name}
              style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', background: 'var(--ink-50)', border: '1px solid var(--border)' }}
            />
          ) : (
            <div className="company-mark" style={{ width: 64, height: 64, fontSize: 20 }}>
              {company.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              {uploadingLogo ? 'Uploading…' : company.logo_path ? 'Replace logo' : 'Upload logo'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleLogo} style={{ display: 'none' }} disabled={uploadingLogo} />
            </label>
            <div className="field-hint" style={{ marginTop: 6 }}>
              JPG, PNG or WEBP. {!company.logo_path && 'Until you add one, your initials are shown on job listings.'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        <form onSubmit={save}>
          <div className="field"><label>Company name</label><input required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does your company do?" /></div>
          <div className="field-row">
            <div className="field"><label>Website</label><input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" /></div>
            <div className="field"><label>Industry</label><input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="IT Services" /></div>
          </div>
          <div className="field"><label>Headquarters / location</label><input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru, India" /></div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  );
}
