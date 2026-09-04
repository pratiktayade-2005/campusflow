import { useState } from 'react';
import { api } from '../api';

function apiFileUrl(path) {
  return api.fileUrl(path);
}

export function StatCard({ icon, label, value, tint = 'brand' }) {
  const tints = {
    brand: { bg: 'var(--brand-50)', fg: 'var(--brand-700)' },
    success: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
    warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
    info: { bg: 'var(--info-bg)', fg: 'var(--info-fg)' },
    violet: { bg: 'var(--violet-bg)', fg: 'var(--violet-fg)' },
  };
  const t = tints[tint] || tints.brand;
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <div className="stat-icon" style={{ background: t.bg, color: t.fg }}>{icon}</div>
      </div>
      <div>
        <div className="value">{value}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  APPLIED: { cls: 'badge-info', label: 'Applied' },
  UNDER_REVIEW: { cls: 'badge-warning', label: 'Under Review' },
  SHORTLISTED: { cls: 'badge-violet', label: 'Shortlisted' },
  INTERVIEWING: { cls: 'badge-warning', label: 'Interviewing' },
  OFFERED: { cls: 'badge-success', label: 'Offered' },
  ACCEPTED: { cls: 'badge-success', label: 'Accepted' },
  DECLINED: { cls: 'badge-danger', label: 'Declined' },
  REJECTED: { cls: 'badge-danger', label: 'Rejected' },
  WITHDRAWN: { cls: 'badge-neutral', label: 'Withdrawn' },
  OPEN: { cls: 'badge-success', label: 'Open' },
  CLOSED: { cls: 'badge-neutral', label: 'Closed' },
  APPROVED: { cls: 'badge-success', label: 'Approved' },
  PENDING: { cls: 'badge-warning', label: 'Pending' },
  SCHEDULED: { cls: 'badge-info', label: 'Scheduled' },
  COMPLETED: { cls: 'badge-success', label: 'Completed' },
  CANCELLED: { cls: 'badge-neutral', label: 'Cancelled' },
  PASS: { cls: 'badge-success', label: 'Pass' },
  FAIL: { cls: 'badge-danger', label: 'Fail' },
};

export function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}><span className="badge-dot" />{s.label}</span>;
}

export function EmptyState({ icon = '📭', title, desc }) {
  return (
    <div className="empty-state">
      <div className="e-icon">{icon}</div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
    </div>
  );
}

export function Loading({ text = 'Loading…' }) {
  return <div className="loading-block"><span className="spinner" />{text}</div>;
}

export function Modal({ title, onClose, children, footer, width }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

// Deterministic, unique-looking avatar per person: generated from their name/email
// via DiceBear (no signup, no storage, purely a client-side <img> request), with a
// graceful fallback to a colored initials badge if the request fails (e.g. offline).
const AVATAR_PALETTE = ['4f46e5', '7c3aed', '0f9d58', 'd0342c', 'b7791f', '2563eb', 'db2777', '0891b2'];

function colorForSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function Avatar({ name = '', seed, photoPath, size = 36, className = '', style = {} }) {
  const [failed, setFailed] = useState(false);
  const key = seed || name || 'user';
  const bg = colorForSeed(key);

  const realSrc = photoPath ? apiFileUrl(photoPath) : null;
  const src = realSrc || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(key)}&backgroundColor=${bg}&fontWeight=700&fontSize=42`;

  if (failed) {
    return (
      <div
        className={`avatar ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.36, background: `#${bg}`, ...style }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`avatar-img ${className}`}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, ...style }}
    />
  );
}
