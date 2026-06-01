import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'

export default function Signup() {
  const { signup } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return }
    setLoading(true)
    try {
      await signup(email, password, name)
      nav('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('このメールアドレスはすでに使われています')
      else setError('登録に失敗しました。もう一度お試しください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '2rem' }}>
        <div className="card" style={{ width: 'min(400px, 100%)' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>アカウント作成</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">表示名</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="山田 太郎" />
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">パスワード（6文字以上）</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '登録中...' : 'アカウントを作成'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            すでにアカウントをお持ちの場合は <Link to="/login">ログイン</Link>
          </p>
        </div>
      </div>
    </>
  )
}
