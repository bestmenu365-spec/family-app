붙여넣은 텍스트 (1).txt
문서

확인했어. 원인 찾았어.

현재 App.jsx의 로그인 배경이 **backgroundSize: 'cover'**로 되어 있어서, 화면을 꽉 채우는 대신 사진의 위·아래나 좌우 일부가 잘리고 있어.

딱 한 군데만 바꾸자

App.jsx에서 아래 부분을 찾아.

backgroundSize: 'cover',

이걸 이렇게 바꿔줘.

backgroundSize: 'contain',

즉 최종적으로는:

loginPage: {
  minHeight: '100vh',
  width: '100vw',
  backgroundSize: 'contain',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  fontFamily: 'Arial, sans-serif',
},

이렇게 하면 사진을 자르지 않고 원본 전체가 보이게 돼.

⚠️ 단, 휴대폰 화면 비율과 사진 비율이 다르면 사진 위·아래 또는 좌우에 빈 공간이 생길 수 있어. 이건 사진 전체를 보여주려면 정상적인 현상이야.

지금은 이것만 바꾸고 저장해줘.
저장했으면 “했어”라고 해줘. 다음 단계로 실제 화면 확인하자.

통으로 만들어죠 항상 한부분 찾는거 어려워 실수할수도 있고

맞아. 앞으로 코드 수정할 때는 한 부분 찾아서 고치라고 하지 않고, 파일 전체를 통째로 교체할 수 있게 줄게.

지금 올려준 App.jsx 전체 코드도 확인했어. 로그인 배경은 현재 cover로 설정돼 있어서 사진이 잘리는 구조야.

다만 코드가 534줄이라 여기 채팅에 통째로 다시 붙이면 복사 과정에서 누락될 가능성이 있어.

내가 지금 올려준 파일을 기준으로 backgroundSize: 'contain'으로 수정한 완성된 App.jsx 파일 자체를 만들어줄게.
그 파일 내용을 전체 선택 → 복사 → 기존 App.jsx 전체 삭제 → 붙여넣기만 하면 되게 하자.

어 만들어죠

만들었어. 기존 534줄 코드는 그대로 유지하고, 로그인 배경사진만 잘리지 않고 전체가 보이도록 수정했어.

📄 완성된 App.jsx

App.jsx 받기

이제 VS Code에서:

기존 App.jsx 전체 선택 → 삭제 → 새 App.jsx 내용 전체 복사 → 붙여넣기 → 저장

하면 돼.

완료하면 “했어”라고 해줘. 그다음 화면을 같이 확인하자. 

App.jsx
코드

라이브러리
/
App.jsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import FamilyEvents from './pages/FamilyEvents'
import FamilyPhotos from './pages/FamilyPhotos'
import FamilyLocation from './pages/FamilyLocation'

// 로그인 배경 이미지
const { data: loginBackgroundData } = supabase.storage
  .from('login-backgrounds')
  .getPublicUrl('login-bg.png')

const loginBackgroundUrl = loginBackgroundData.publicUrl

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [page, setPage] = useState('home')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // 로그인 상태 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 내 프로필 + 가족 목록
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) {
        setProfile(null)
        setFamilyMembers([])
        return
      }

      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('내 프로필 오류:', profileError)
        setProfile(null)
      } else {
        setProfile(myProfile)
      }

      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')

      if (membersError) {
        console.error('가족 목록 오류:', membersError)
        setFamilyMembers([])
      } else {
        const order = {
          아빠: 1,
          엄마: 2,
          아들: 3,
        }

        const sortedMembers = [...(members || [])].sort(
          (a, b) =>
            (order[a.name] || 99) -
            (order[b.name] || 99)
        )

        setFamilyMembers(sortedMembers)
      }
    }

    loadData()
  }, [session])

  // 로그인
  const handleLogin = async (e) => {
    e.preventDefault()

    setMessage('로그인 중...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('로그인 오류:', error)
      setMessage('이메일 또는 비밀번호를 확인해주세요.')
    } else {
      setMessage('')
      setPage('home')
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()

    setProfile(null)
    setFamilyMembers([])
    setPage('home')
    setEmail('')
    setPassword('')
    setMessage('')
  }

  const getEmoji = (name) => {
    if (name === '아빠') return '👨'
    if (name === '엄마') return '👩'
    if (name === '아들') return '👦'

    return '🙂'
  }

  // 가족 일정
  if (session && page === 'events') {
    return (
      <FamilyEvents
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // 가족 앨범
  if (session && page === 'photos') {
    return (
      <FamilyPhotos
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // 가족 위치
  if (session && page === 'location') {
    return (
      <FamilyLocation
        session={session}
        onBack={() => setPage('home')}
      />
    )
  }

  // 가족 프로필
  if (session && page === 'profiles') {
    return (
      <div style={styles.page}>
        <div style={styles.home}>
          <button
            style={styles.backButton}
            onClick={() => setPage('home')}
          >
            ← 홈으로
          </button>

          <p style={styles.badge}>우리 가족</p>

          <h1 style={styles.homeTitle}>
            가족 프로필
          </h1>

          <p style={styles.welcome}>
            우리 가족 구성원입니다.
          </p>

          <div style={styles.profileGrid}>
            {familyMembers.map((member) => (
              <div
                key={member.id}
                style={styles.profileCard}
              >
                <div style={styles.profileEmoji}>
                  {getEmoji(member.name)}
                </div>

                <h2 style={styles.profileName}>
                  {member.name}
                </h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 로그인 후 홈
  if (session) {
    return (
      <div style={styles.page}>
        <div style={styles.home}>
          <div style={styles.header}>
            <div>
              <p style={styles.badge}>
                우리 가족
              </p>

              <h1 style={styles.homeTitle}>
                {profile?.name
                  ? `${profile.name}님, 안녕하세요`
                  : '안녕하세요'}
              </h1>

              <p style={styles.welcome}>
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
            <button
              style={styles.menuCard}
              onClick={() => setPage('events')}
            >
              <span style={styles.icon}>📅</span>
              <strong>가족 일정</strong>
              <small>우리 가족 일정 확인</small>
            </button>

            <button
              style={styles.menuCard}
              onClick={() => setPage('photos')}
            >
              <span style={styles.icon}>📷</span>
              <strong>가족 앨범</strong>
              <small>사진과 동영상 공유</small>
            </button>

            <button
              style={styles.menuCard}
              onClick={() => setPage('location')}
            >
              <span style={styles.icon}>📍</span>
              <strong>가족 위치</strong>
              <small>가족의 최근 위치 확인</small>
            </button>

            <button
              style={styles.menuCard}
              onClick={() => setPage('profiles')}
            >
              <span style={styles.icon}>👨‍👩‍👦</span>
              <strong>가족 프로필</strong>
              <small>가족 구성원 보기</small>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 로그인 화면
  return (
    <div
      style={{
        ...styles.loginPage,
        backgroundImage: `
          linear-gradient(
            rgba(0,0,0,0.12),
            rgba(0,0,0,0.12)
          ),
          url("${loginBackgroundUrl}")
        `,
      }}
    >
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <p style={styles.loginBadge}>
            FAMILY
          </p>

          <h1 style={styles.loginTitle}>
            우리 가족
          </h1>

          <p style={styles.loginSubtitle}>
            행복한 우리 가족 이야기
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
                setPassword(e.target.value)
              }
              required
            />

            <button
              style={styles.loginButton}
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
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f8',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
  },

  loginPage: {
    minHeight: '100vh',
    width: '100vw',
    backgroundSize: 'contain',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    fontFamily: 'Arial, sans-serif',
  },

  loginOverlay: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },

  loginCard: {
    width: '90%',
    maxWidth: '360px',
    padding: '34px 28px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.86)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    textAlign: 'center',
  },

  loginBadge: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    color: '#a07754',
  },

  loginTitle: {
    margin: '8px 0 5px',
    fontSize: '32px',
    color: '#46392f',
  },

  loginSubtitle: {
    color: '#806f61',
    marginBottom: '25px',
  },

  badge: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#888',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    marginBottom: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(120,100,80,0.25)',
    background: 'rgba(255,255,255,0.94)',
    fontSize: '16px',
  },

  loginButton: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: '#56463a',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  message: {
    marginTop: '18px',
  },

  home: {
    maxWidth: '700px',
    margin: '30px auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
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