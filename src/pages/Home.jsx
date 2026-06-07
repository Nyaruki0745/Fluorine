import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'

export default function Home() {
  const { user } = useAuth()
  return (
    <>
      <Header />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 540 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '0.1em' }}>PROJECT DISCUSSION SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
            最善の解決策を<br />みんなで話し合う
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            プロジェクトを作成して議題を立て、<br />
            チームで意見を出し合い合意を形成しましょう。
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">ダッシュボードへ</Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary">アカウント作成</Link>
                <Link to="/join" className="btn btn-ghost">プロジェクトに参加</Link>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: 700, width: '100%', marginTop: '4rem' }}>
          {[
            { icon: '🗂️', title: 'プロジェクト管理', desc: 'コードを共有するだけで参加可能' },
            { icon: '💬', title: 'スレッド式議論', desc: 'GitHubのIssuesライクなUI' },
            { icon: '✅', title: '解決ステータス', desc: '議題の進捗が一目でわかる' },
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: 'left', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
