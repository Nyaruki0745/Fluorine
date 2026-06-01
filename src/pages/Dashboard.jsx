import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createProject, getUserProjects } from '../lib/firestore'
import Header from '../components/Header'

const DEFAULT_GUEST_PERMS = { canCreateThread: true, canComment: true, canChangeStatus: false }
const DEFAULT_MEMBER_PERMS = { canCreateThread: true, canComment: true, canChangeStatus: false, canManageMembers: false }

export default function Dashboard() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [guestPerms, setGuestPerms] = useState(DEFAULT_GUEST_PERMS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { nav('/login'); return }
    const unsub = getUserProjects(user.uid, setProjects)
    return unsub
  }, [user])

  const togglePerm = (key) => setGuestPerms(p => ({ ...p, [key]: !p[key] }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { id } = await createProject(title, desc, user.uid, user.displayName, guestPerms)
      setShowModal(false)
      setTitle(''); setDesc(''); setGuestPerms(DEFAULT_GUEST_PERMS)
      nav(`/project/${id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>プロジェクト一覧</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>＋ 新規作成</button>
        </div>

        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗂️</div>
            <div style={{ marginBottom: '1rem' }}>プロジェクトがまだありません</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>最初のプロジェクトを作成</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {projects.map(p => (
              <Link key={p.id} to={`/project/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{p.title}</div>
                      {p.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.description}</div>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '0.25rem 0.6rem', borderRadius: 4 }}>{p.code}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">新規プロジェクト作成</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">プロジェクト名 *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="文化祭実行委員会" />
              </div>
              <div className="form-group">
                <label className="form-label">説明（任意）</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="プロジェクトの概要を入力..." style={{ resize: 'vertical' }} />
              </div>

              <div>
                <div className="form-label" style={{ marginBottom: '0.5rem' }}>非ログインユーザーのデフォルト権限</div>
                <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
                  {[
                    { key: 'canCreateThread', label: 'スレッドを作成できる' },
                    { key: 'canComment', label: 'コメントを投稿できる' },
                    { key: 'canChangeStatus', label: 'スレッドの状態を変更できる（作成者以外も）' },
                  ].map(({ key, label }) => (
                    <div key={key} className="perm-row">
                      <input type="checkbox" id={key} checked={guestPerms[key]} onChange={() => togglePerm(key)} />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>キャンセル</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '作成中...' : '作成'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
