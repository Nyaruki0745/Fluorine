import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeProject, subscribeThreads, createThread,
  updateProjectPermissions, updateMemberPermissions, removeMemberFromProject,
  deleteProject
} from '../lib/firestore'
import { getEffectivePermissions } from '../lib/permissions'
import Header from '../components/Header'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return formatDistanceToNow(date, { addSuffix: true, locale: ja })
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [project, setProject] = useState(null)
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewThread, setShowNewThread] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState('open') // 'open' | 'resolved'
  const [showSettings, setShowSettings] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const guestName = sessionStorage.getItem('guestName')
  const isJoined = user || sessionStorage.getItem(`joined_${projectId}`)

  useEffect(() => {
    const unsub = subscribeProject(projectId, (p) => {
      setProject(p)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  useEffect(() => {
    const unsub = subscribeThreads(projectId, null, setThreads)
    return unsub
  }, [projectId])

  if (loading) return <><Header /><div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="spinner" /></div></>
  if (!project) return <><Header /><div className="page"><p>プロジェクトが見つかりません</p></div></>

  if (!isJoined) {
    return (
      <>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', maxWidth: 380 }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>参加が必要です</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>このプロジェクトに参加するにはコードが必要です</div>
            <Link to={`/join`} className="btn btn-primary btn-sm">プロジェクトに参加</Link>
          </div>
        </div>
      </>
    )
  }

  const perms = getEffectivePermissions(project, user)
  const filtered = threads.filter(t => t.status === tab)
  const openCount = threads.filter(t => t.status === 'open').length
  const resolvedCount = threads.filter(t => t.status === 'resolved').length

  const handleDeleteProject = async () => {
    setDeleting(true)
    try {
      await deleteProject(projectId)
      nav('/dashboard')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateThread = async (e) => {
    e.preventDefault()
    if (!threadTitle.trim()) return
    setCreating(true)
    try {
      const authorName = user ? user.displayName : guestName
      const authorId = user ? user.uid : null
      await createThread(projectId, threadTitle.trim(), authorId, authorName, null)
      setThreadTitle('')
      setShowNewThread(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Header />
      <div className="page">
        {/* パンくず */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {user && <><Link to="/dashboard">ダッシュボード</Link> <span style={{ margin: '0 0.4rem' }}>›</span></>}
          <span>{project.title}</span>
        </div>

        {/* プロジェクトヘッダー */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem' }}>{project.title}</h1>
            {project.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '0.3rem 0.7rem', borderRadius: 4 }}>
              {project.code}
            </div>
            {perms.isOwner && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙ 設定</button>
                <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>🗑 削除</button>
              </>
            )}
          </div>
        </div>

        {/* スレッドリスト */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* タブ + 新規ボタン */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
            <button
              className="btn btn-sm"
              style={{ background: tab === 'open' ? 'var(--accent-dim)' : 'transparent', color: tab === 'open' ? 'var(--accent)' : 'var(--text-muted)', border: 'none' }}
              onClick={() => setTab('open')}
            >
              ● 未解決 {openCount}
            </button>
            <button
              className="btn btn-sm"
              style={{ background: tab === 'resolved' ? 'var(--bg3)' : 'transparent', color: tab === 'resolved' ? 'var(--text-muted)' : 'var(--text-dim)', border: 'none' }}
              onClick={() => setTab('resolved')}
            >
              ✓ 解決済み {resolvedCount}
            </button>
            <div style={{ flex: 1 }} />
            {perms.canCreateThread && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewThread(true)}>＋ 新しい議題</button>
            )}
          </div>

          {/* 新規スレッドフォーム */}
          {showNewThread && (
            <form onSubmit={handleCreateThread} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input
                value={threadTitle}
                onChange={e => setThreadTitle(e.target.value)}
                placeholder="議題のタイトルを入力..."
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>{creating ? '作成中...' : '作成'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewThread(false)}>キャンセル</button>
            </form>
          )}

          {/* スレッド一覧 */}
          {filtered.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {tab === 'open' ? '未解決の議題はありません' : '解決済みの議題はありません'}
            </div>
          ) : (
            filtered.map(thread => (
              <div
                key={thread.id}
                className="thread-item"
                onClick={() => nav(`/project/${projectId}/thread/${thread.id}`)}
              >
                <div style={{ marginTop: '3px', flexShrink: 0 }}>
                  {thread.status === 'open'
                    ? <span style={{ color: 'var(--green)', fontSize: '1rem' }}>●</span>
                    : <span style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>✓</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: '0.2rem' }}>{thread.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {thread.authorName} が {timeAgo(thread.createdAt)} に作成
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 設定モーダル */}
      {showSettings && (
        <SettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 削除確認モーダル */}
      {showDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="modal" style={{ width: 'min(400px, 94vw)' }}>
            <div className="modal-title">プロジェクトを削除しますか？</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              「<strong style={{ color: 'var(--text)' }}>{project.title}</strong>」を削除します。この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)} disabled={deleting}>キャンセル</button>
              <button className="btn btn-danger" onClick={handleDeleteProject} disabled={deleting}>
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ========== 設定モーダル ==========
function SettingsModal({ project, onClose }) {
  const [guestPerms, setGuestPerms] = useState(project.guestPermissions || {})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('guest') // 'guest' | 'members'

  const toggleGuest = (key) => setGuestPerms(p => ({ ...p, [key]: !p[key] }))

  const saveGuest = async () => {
    setSaving(true)
    await updateProjectPermissions(project.id, guestPerms)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 'min(560px, 94vw)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className="modal-title" style={{ margin: 0, flex: 1 }}>プロジェクト設定</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {['guest', 'members'].map(t => (
            <button key={t} className="btn btn-sm"
              style={{ background: activeTab === t ? 'var(--accent-dim)' : 'transparent', color: activeTab === t ? 'var(--accent)' : 'var(--text-muted)', border: 'none' }}
              onClick={() => setActiveTab(t)}
            >
              {t === 'guest' ? '非ログインユーザー権限' : 'メンバー管理'}
            </button>
          ))}
        </div>

        {activeTab === 'guest' && (
          <div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem' }}>
              {[
                { key: 'canCreateThread', label: 'スレッドを作成できる' },
                { key: 'canComment', label: 'コメントを投稿できる' },
                { key: 'canChangeStatus', label: 'スレッドの状態を変更できる（作成者以外も）' },
              ].map(({ key, label }) => (
                <div key={key} className="perm-row">
                  <input type="checkbox" id={`g_${key}`} checked={!!guestPerms[key]} onChange={() => toggleGuest(key)} />
                  <label htmlFor={`g_${key}`}>{label}</label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={saveGuest} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <MembersTab project={project} />
        )}

        {/* 共有コード */}
        <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg3)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>参加コード</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>{project.code}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(project.code)}>コピー</button>
        </div>
      </div>
    </div>
  )
}

function MembersTab({ project }) {
  const members = project.members || []

  const PERM_KEYS = [
    { key: 'canCreateThread', label: 'スレッド作成' },
    { key: 'canComment', label: 'コメント' },
    { key: 'canChangeStatus', label: '状態変更' },
    { key: 'canManageMembers', label: 'メンバー管理' },
  ]

  const toggleMemberPerm = async (uid, key, current) => {
    const member = members.find(m => m.uid === uid)
    if (!member) return
    await updateMemberPermissions(project.id, uid, { ...member.permissions, [key]: !current })
  }

  if (members.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>ログインメンバーがまだいません</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {members.map(m => (
        <div key={m.uid} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{m.displayName}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PERM_KEYS.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={!!(m.permissions || {})[key]}
                  onChange={() => toggleMemberPerm(m.uid, key, !!(m.permissions || {})[key])}
                  style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}
                />
                {label}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem' }}
              onClick={() => removeMemberFromProject(project.id, m.uid)}
            >削除</button>
          </div>
        </div>
      ))}
    </div>
  )
}
