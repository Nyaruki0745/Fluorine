import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/')
  }

  return (
    <header className="header">
      <Link to="/" className="header-logo">議論ボード</Link>
      <div className="header-spacer" />
      {user ? (
        <>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.displayName}</span>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">ダッシュボード</Link>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>ログアウト</button>
        </>
      ) : (
        <>
          <Link to="/join" className="btn btn-ghost btn-sm">プロジェクトに参加</Link>
          <Link to="/login" className="btn btn-primary btn-sm">ログイン</Link>
        </>
      )}
    </header>
  )
}
