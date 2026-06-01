import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjectByCode, addMemberToProject } from '../lib/firestore'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'

export default function JoinProject() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const project = await getProjectByCode(code)
      if (!project) { setError('プロジェクトが見つかりません。コードを確認してください'); setLoading(false); return }

      if (user) {
        // ログインユーザー: メンバーとして追加（まだでなければ）
        const already = (project.members || []).find(m => m.uid === user.uid)
        if (!already) {
          await addMemberToProject(project.id, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            permissions: { canCreateThread: false, canComment: true, canChangeStatus: false, canManageMembers: false }
          })
        }
        nav(`/project/${project.id}`)
      } else {
        // 非ログインユーザー: 名前をsessionStorageに保存してプロジェクトへ
        const trimmedName = name.trim()
        if (!trimmedName) { setError('名前を入力してください'); setLoading(false); return }
        sessionStorage.setItem('guestName', trimmedName)
        sessionStorage.setItem(`joined_${project.id}`, '1')
        nav(`/project/${project.id}`)
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '2rem' }}>
        <div className="card" style={{ width: 'min(400px, 100%)' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>プロジェクトに参加</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            管理者から共有されたプロジェクトコードを入力してください
          </p>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">プロジェクトコード</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                required
                placeholder="ABC123"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              />
            </div>
            {!user && (
              <div className="form-group">
                <label className="form-label">あなたの名前</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="山田 花子" />
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '参加中...' : 'プロジェクトに参加'}
            </button>
          </form>
          {!user && (
            <p style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
              ログインすると権限の細かい設定が可能です。<br />
              <a href="#/login">ログインはこちら</a>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
