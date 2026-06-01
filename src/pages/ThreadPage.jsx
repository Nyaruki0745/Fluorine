import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeThread, subscribeComments, addComment,
  subscribeThreads, createThread, updateThreadStatus, getProject
} from '../lib/firestore'
import { getEffectivePermissions, canChangeThreadStatus } from '../lib/permissions'
import Header from '../components/Header'
import { formatDistanceToNow, format } from 'date-fns'
import { ja } from 'date-fns/locale'

function timeAgo(ts) {
  if (!ts) return ''
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return formatDistanceToNow(date, { addSuffix: true, locale: ja })
  } catch { return '' }
}
function fullTime(ts) {
  if (!ts) return ''
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return format(date, 'yyyy/MM/dd HH:mm', { locale: ja })
  } catch { return '' }
}

export default function ThreadPage() {
  const { projectId, threadId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [project, setProject] = useState(null)
  const [thread, setThread] = useState(null)
  const [comments, setComments] = useState([])
  const [subThreads, setSubThreads] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)
  const [subTitle, setSubTitle] = useState('')
  const [creatingSubThread, setCreatingSubThread] = useState(false)
  const bottomRef = useRef(null)

  const guestName = sessionStorage.getItem('guestName')

  useEffect(() => {
    getProject(projectId).then(setProject)
  }, [projectId])

  useEffect(() => {
    const u1 = subscribeThread(threadId, setThread)
    const u2 = subscribeComments(threadId, (c) => {
      setComments(c)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
    const u3 = subscribeThreads(projectId, threadId, setSubThreads)
    return () => { u1(); u2(); u3() }
  }, [projectId, threadId])

  if (!thread || !project) {
    return <><Header /><div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="spinner" /></div></>
  }

  const perms = getEffectivePermissions(project, user)
  const canChangeStatus = canChangeThreadStatus(project, user, guestName, thread)
  const authorName = user ? user.displayName : guestName

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !authorName) return
    setSending(true)
    try {
      await addComment(threadId, input.trim(), user?.uid || null, authorName)
      setInput('')
    } finally {
      setSending(false)
    }
  }

  const handleStatusToggle = async () => {
    const newStatus = thread.status === 'open' ? 'resolved' : 'open'
    await updateThreadStatus(threadId, newStatus)
  }

  const handleCreateSubThread = async (e) => {
    e.preventDefault()
    if (!subTitle.trim()) return
    setCreatingSubThread(true)
    try {
      const ref = await createThread(projectId, subTitle.trim(), user?.uid || null, authorName || '不明', threadId)
      setSubTitle('')
      setShowSubForm(false)
      nav(`/project/${projectId}/thread/${ref.id}`)
    } finally {
      setCreatingSubThread(false)
    }
  }

  return (
    <>
      <Header />
      <div className="page" style={{ maxWidth: 780 }}>
        {/* パンくず */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {user && <><Link to="/dashboard">ダッシュボード</Link><span>›</span></>}
          <Link to={`/project/${projectId}`}>{project.title}</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{thread.title}</span>
        </div>

        {/* スレッドヘッダー */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, flex: 1 }}>{thread.title}</h1>
            <span className={`badge ${thread.status === 'open' ? 'badge-open' : 'badge-resolved'}`}>
              {thread.status === 'open' ? '● 未解決' : '✓ 解決済み'}
            </span>
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {thread.authorName} が {timeAgo(thread.createdAt)} に作成
          </div>
          {canChangeStatus && (
            <button
              className={`btn btn-sm ${thread.status === 'open' ? 'btn-ghost' : 'btn-ghost'}`}
              style={{ marginTop: '0.75rem', color: thread.status === 'open' ? 'var(--green)' : 'var(--amber)' }}
              onClick={handleStatusToggle}
            >
              {thread.status === 'open' ? '✓ 解決済みにする' : '● 未解決に戻す'}
            </button>
          )}
        </div>

        {/* コメント */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
          {comments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              まだコメントがありません。最初の意見を投稿しましょう！
            </div>
          ) : (
            <div>
              {comments.map((c, i) => (
                <div key={c.id} style={{
                  padding: '0.9rem 1.25rem',
                  borderBottom: i < comments.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700
                    }}>
                      {(c.authorName || '?').charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.authorName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }} title={fullTime(c.createdAt)}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* 入力フォーム */}
          {perms.canComment && authorName ? (
            <form onSubmit={handleSend} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder="コメントを入力... (Enter で送信、Shift+Enter で改行)"
                rows={2}
                style={{ flex: 1, resize: 'vertical', minHeight: 60 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !input.trim()} style={{ alignSelf: 'flex-end' }}>
                {sending ? '...' : '送信'}
              </button>
            </form>
          ) : !authorName ? (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              コメントするには <Link to={`/join`}>プロジェクトに参加</Link> してください
            </div>
          ) : (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              コメントの投稿権限がありません
            </div>
          )}
        </div>

        {/* サブスレッド */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>サブスレッド ({subThreads.length})</h2>
            {perms.canCreateThread && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSubForm(v => !v)}>＋ サブスレッドを作成</button>
            )}
          </div>

          {showSubForm && (
            <form onSubmit={handleCreateSubThread} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                value={subTitle}
                onChange={e => setSubTitle(e.target.value)}
                placeholder="サブスレッドのタイトル..."
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={creatingSubThread}>{creatingSubThread ? '作成中...' : '作成'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSubForm(false)}>✕</button>
            </form>
          )}

          {subThreads.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', padding: '0.5rem 0' }}>サブスレッドはまだありません</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {subThreads.map((st, i) => (
                <div
                  key={st.id}
                  className="thread-item"
                  style={{ borderBottom: i < subThreads.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => nav(`/project/${projectId}/thread/${st.id}`)}
                >
                  <div style={{ marginTop: 3 }}>
                    {st.status === 'open'
                      ? <span style={{ color: 'var(--green)' }}>●</span>
                      : <span style={{ color: 'var(--text-dim)' }}>✓</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.15rem', fontSize: '0.9rem' }}>{st.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.authorName} · {timeAgo(st.createdAt)}</div>
                  </div>
                  <span className={`badge ${st.status === 'open' ? 'badge-open' : 'badge-resolved'}`} style={{ fontSize: '0.7rem' }}>
                    {st.status === 'open' ? '未解決' : '解決済み'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
