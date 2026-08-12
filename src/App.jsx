import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import FamilyEvents from './pages/FamilyEvents'
import FamilyPhotos from './pages/FamilyPhotos'
import FamilyLocation from './pages/FamilyLocation'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [page, setPage] = useState('home')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // =========================
  // 로그인 상태 확인
  // =========================

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession)
        }
      )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // =========================
  // 내 프로필 + 가족 목록
  // =========================

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) {
        setProfile(null)
        setFamilyMembers([])
        return
      }

      // 현재 로그인한 사람
      const {
        data: myProfile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error(
          '내 프로필 오류:',
          profileError
        )

        setProfile(null)
      } else {
        setProfile(myProfile)
      }

      // 가족 전체
      const {
        data: members,
        error: membersError,
      } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')

      if (membersError) {
        console.error(
          '가족 목록 오류:',
          membersError
        )

        setFamilyMembers([])
      } else {
        const order = {
          아빠: 1,
          엄마: 2,
          아들: 3,
        }

        const sortedMembers = [
          ...(members || []),
        ].sort(
          (a, b) =>
            (order[a.name] || 99) -
            (order[b.name] || 99)
        )

        setFamilyMembers(sortedMembers)
      }
    }

    loadData()
  }, [session])

  // =========================
  // 로그인
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault()

    setMessage('로그인 중...')

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      console.error(
        '로그인 오류:',
        error
      )

      setMessage(
        '이메일 또는 비밀번호를 확인해주세요.'
      )
    } else {
      setMessage('')
      setPage('home')
    }
  }

  // =========================
  // 로그아웃
  // =========================

  const handleLogout = async () => {
    await supabase.auth.signOut()

    setProfile(null)
    setFamilyMembers([])
    setPage('home')

    setEmail('')
    setPassword('')
    setMessage('')
  }

  // =========================
  // 가족 아이콘
  // =========================

  const getEmoji = (name) => {
    if (name === '아빠') return '👨'
    if (name === '엄마') return '👩'
    if (name === '아들') return '👦'

    return '🙂'
  }

  // =========================
  // 가족 일정
  // =========================

  if (session && page === 'events') {
    return (
      <FamilyEvents
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // =========================
  // 가족 앨범
  // =========================

  if (session && page === 'photos') {
    return (
      <FamilyPhotos
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // =========================
  // 가족 위치
  // =========================

  if (session && page === 'location') {
    return (
      <FamilyLocation
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // =========================
  // 가족 프로필
  // =========================

  if (session && page === 'profiles') {
    return (
      <div style={styles.page}>
        <div style={styles.home}>

          <button
            style={styles.backButton}
            onClick={() =>
              setPage('home')
            }
          >
            ← 홈으로
          </button>

          <p style={styles.badge}>
            우리 가족
          </p>

          <h1 style={styles.homeTitle}>
            가족 프로필
          </h1>

          <p style={styles.welcome}>
            우리 가족 구성원입니다.
          </p>

          <div style={styles.profileGrid}>

            {familyMembers.map(
              (member) => (
                <div
                  key={member.id}
                  style={styles.profileCard}
                >

                  <div
                    style={
                      styles.profileEmoji
                    }
                  >
                    {getEmoji(
                      member.name
                    )}
                  </div>

                  <h2
                    style={
                      styles.profileName
                    }
                  >
                    {member.name}
                  </h2>

                </div>
              )
            )}

          </div>
        </div>
      </div>
    )
  }

  // =========================
  // 로그인 후 홈
  // =========================

  if (session) {
    return (
      <div style={styles.page}>
        <div style={styles.home}>

          <div style={styles.header}>

            <div>
              <p style={styles.badge}>
                우리 가족
              </p>

              <h1
                style={
                  styles.homeTitle
                }
              >
                {profile?.name
                  ? `${profile.name}님, 안녕하세요`
                  : '안녕하세요'}
              </h1>

              <p
                style={
                  styles.welcome
                }
              >
                오늘도 가족과 좋은 하루 보내세요.
              </p>
            </div>

            <button
              style={styles.logout}
              onClick={handleLogout}
            >
              로그아웃
            </button>

          </div>

          <div style={styles.menuGrid}>

            {/* 가족 일정 */}

            <button
              style={styles.menuCard}
              onClick={() =>
                setPage('events')
              }
            >
              <span
                style={styles.icon}
              >
                📅
              </span>

              <strong>
                가족 일정
              </strong>

              <small>
                우리 가족 일정 확인
              </small>
            </button>

            {/* 가족 앨범 */}

            <button
              style={styles.menuCard}
              onClick={() =>
                setPage('photos')
              }
            >
              <span
                style={styles.icon}
              >
                📷
              </span>

              <strong>
                가족 앨범
              </strong>

              <small>
                사진과 동영상 공유
              </small>
            </button>

            {/* 가족 위치 */}

            <button
              style={styles.menuCard}
              onClick={() =>
                setPage('location')
              }
            >
              <span
                style={styles.icon}
              >
                📍
              </span>

              <strong>
                가족 위치
              </strong>

              <small>
                가족의 최근 위치 확인
              </small>
            </button>

            {/* 가족 프로필 */}

            <button
              style={styles.menuCard}
              onClick={() =>
                setPage('profiles')
              }
            >
              <span
                style={styles.icon}
              >
                👨‍👩‍👦
              </span>

              <strong>
                가족 프로필
              </strong>

              <small>
                가족 구성원 보기
              </small>
            </button>

          </div>
        </div>
      </div>
    )
  }

  // =========================
  // 로그인 화면
  // =========================

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <p style={styles.badge}>
          FAMILY
        </p>

        <h1 style={styles.title}>
          우리 가족
        </h1>

        <p style={styles.subtitle}>
          가족 전용 공간
        </p>

        <form onSubmit={handleLogin}>

          <input
            style={styles.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />

          <button
            style={
              styles.loginButton
            }
            type="submit"
          >
            로그인
          </button>

        </form>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

      </div>
    </div>
  )
}

// =========================
// 디자인
// =========================

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f8',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
  },

  card: {
    width: '90%',
    maxWidth: '360px',
    background: 'white',
    padding: '40px 30px',
    borderRadius: '20px',
    boxShadow:
      '0 8px 30px rgba(0,0,0,0.08)',
    textAlign: 'center',
    margin: '100px auto',
  },

  badge: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#888',
  },

  title: {
    marginBottom: '8px',
    fontSize: '32px',
  },

  subtitle: {
    color: '#777',
    marginBottom: '30px',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    marginBottom: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },

  loginButton: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    background: '#222',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },

  message: {
    marginTop: '20px',
  },

  home: {
    maxWidth: '700px',
    margin: '30px auto',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },

  homeTitle: {
    margin: '8px 0 0',
    fontSize: '32px',
  },

  welcome: {
    color: '#777',
    marginBottom: '30px',
  },

  logout: {
    border: '1px solid #ddd',
    background: 'white',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  menuGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '15px',
  },

  menuCard: {
    minHeight: '150px',
    border: 'none',
    borderRadius: '18px',
    background: 'white',
    boxShadow:
      '0 5px 20px rgba(0,0,0,0.06)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    cursor: 'pointer',
  },

  icon: {
    fontSize: '35px',
  },

  backButton: {
    border: '1px solid #ddd',
    background: 'white',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '25px',
  },

  profileGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, minmax(0, 1fr))',
    gap: '15px',
  },

  profileCard: {
    background: 'white',
    borderRadius: '18px',
    padding: '30px 20px',
    textAlign: 'center',
    boxShadow:
      '0 5px 20px rgba(0,0,0,0.06)',
  },

  profileEmoji: {
    fontSize: '50px',
  },

  profileName: {
    marginBottom: 0,
  },
}

export default App