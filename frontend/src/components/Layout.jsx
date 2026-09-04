import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Avatar, timeAgo } from './ui';

const NAV = {
  STUDENT: [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/jobs', label: 'Browse Jobs', icon: '💼' },
    { to: '/applications', label: 'My Applications', icon: '📄' },
    { to: '/interviews', label: 'Interviews & Offers', icon: '🎯' },
    { to: '/announcements', label: 'Announcements', icon: '📢' },
    { to: '/profile', label: 'Profile & Resume', icon: '👤' },
  ],
  RECRUITER: [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/jobs', label: 'My Job Postings', icon: '💼' },
    { to: '/company', label: 'Company Profile', icon: '🏢' },
    { to: '/announcements', label: 'Announcements', icon: '📢' },
  ],
  PLACEMENT_OFFICER: [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/students', label: 'Students', icon: '🎓' },
    { to: '/companies', label: 'Companies', icon: '🏢' },
    { to: '/jobs', label: 'All Jobs', icon: '💼' },
    { to: '/offers', label: 'Offers', icon: '🎉' },
    { to: '/announcements', label: 'Announcements', icon: '📢' },
  ],
  FACULTY: [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/students', label: 'Students', icon: '🎓' },
    { to: '/announcements', label: 'Announcements', icon: '📢' },
  ],
};

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'My Applications',
  '/interviews': 'Interviews & Offers',
  '/announcements': 'Announcements',
  '/profile': 'Profile & Resume',
  '/company': 'Company Profile',
  '/students': 'Students',
  '/companies': 'Companies',
  '/offers': 'Offers',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const accountRef = useRef(null);
  const notifRef = useRef(null);

  const links = NAV[user.role] || [];
  const unread = notifs.filter((n) => !n.is_read).length;

  const loadNotifs = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifs(data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openNotifs = async () => {
    setAccountOpen(false);
    setNotifOpen((o) => !o);
    if (!notifOpen && unread > 0) {
      await api.put('/notifications/read-all');
      setTimeout(loadNotifs, 300);
    }
  };

  const title = PAGE_TITLES[location.pathname] || 'CampusFlow';

  const sidebarContent = (
    <>
      <div className="brand">
        <span className="logo-icon">CF</span>
        CampusFlow
      </div>
      <div className="side-section-label">Menu</div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
        >
          <span className="ic">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
      <div className="sidebar-footer">
        <div className="side-user-text">
          <div className="name">{user.full_name}</div>
          <div className="role">{roleLabel(user.role)}</div>
        </div>
        <button className="btn btn-secondary btn-block btn-sm" onClick={logout}>Sign out</button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* Desktop / tablet sidebar */}
      <aside className="sidebar sidebar-desktop">{sidebarContent}</aside>

      {/* Mobile drawer + backdrop */}
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
      <aside className={`sidebar sidebar-drawer${drawerOpen ? ' open' : ''}`}>{sidebarContent}</aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <div>
              <h1>{title}</h1>
              <div className="sub">{greeting()}, {user.full_name.split(' ')[0]} 👋</div>
            </div>
          </div>
          <div className="topbar-actions">
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={openNotifs}>
                🔔
                {unread > 0 && <span className="dot-badge" />}
              </button>
              {notifOpen && (
                <div className="notif-panel">
                  {notifs.length === 0 ? (
                    <div className="notif-item">You're all caught up — no notifications yet.</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className={`notif-item${n.is_read ? '' : ' unread'}`}>
                        <div className="n-title">{n.title}</div>
                        <div>{n.body}</div>
                        <div className="n-time">{timeAgo(n.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Primary account menu — click the avatar to sign out from here too */}
            <div ref={accountRef} style={{ position: 'relative' }}>
              <button
                className="account-trigger"
                onClick={() => { setNotifOpen(false); setAccountOpen((o) => !o); }}
                aria-label="Account menu"
              >
                <Avatar name={user.full_name} seed={user.email} photoPath={user.photo_path} size={34} />
              </button>
              {accountOpen && (
                <div className="account-panel">
                  <div className="account-panel-head">
                    <Avatar name={user.full_name} seed={user.email} photoPath={user.photo_path} size={40} />
                    <div>
                      <div className="name">{user.full_name}</div>
                      <div className="role">{roleLabel(user.role)}</div>
                    </div>
                  </div>
                  <div className="account-panel-email">{user.email}</div>
                  {user.role === 'STUDENT' && (
                    <button className="account-panel-item" onClick={() => { setAccountOpen(false); navigate('/profile'); }}>
                      👤 View profile
                    </button>
                  )}
                  <button className="account-panel-item danger" onClick={logout}>
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}

function roleLabel(role) {
  return {
    STUDENT: 'Student',
    FACULTY: 'Faculty',
    PLACEMENT_OFFICER: 'Placement Officer',
    RECRUITER: 'Recruiter',
  }[role] || role;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
