import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import FamilyEvents from './pages/FamilyEvents'
import FamilyPhotos from './pages/FamilyPhotos'
import FamilyLocation from './pages/FamilyLocation'
import fatherAvatar from './assets/avatars/father-custom-v2.png'
import motherAvatar from './assets/avatars/mother-custom-v2.png'
import sonAvatar from './assets/avatars/son-custom-v2.png'
import Avatar2D from './components/Avatar2D'
import './App.css'

const { data: loginBackgroundData } = supabase.storage
  .from('login-backgrounds')
  .getPublicUrl('login-bg.png')

const tabs = [
  { id: 'home', label: '홈', icon: '⌂' },
  { id: 'family', label: '가족', icon: '♙' },
  { id: 'memories', label: '추억', icon: '▧' },
  { id: 'events', label: '일정', icon: '□' },
  { id: 'more', label: '더보기', icon: '☰' },
]

const memberEmoji = (name = '') => {
  if (name === '아빠') return '👨🏻'
  if (name === '엄마') return '👩🏻'
  if (name === '아들') return '👦🏻'
  return '🙂'
}

const defaultAvatars = {
  아빠: fatherAvatar,
  엄마: motherAvatar,
  아들: sonAvatar,
}

const DEFAULT_AVATAR_STYLE = {
  hairStyle: 'basic', hair: '#302823', expression: 'neutral', body: 'normal', outfit: '#6f5aa8', accessory: 'none', bag: 'none', shoes: '#34303a', bracelet: 'none',
}

function BottomNav({ page, onChange }) {
  const activeTab = page === 'profile' || page === 'location' ? 'family' : page

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

function Avatar({ member, large = false }) {
  const avatarSource = member?.avatar_url || defaultAvatars[member?.name]

  return (
    <div className={large ? 'avatar avatar--large' : 'avatar'}>
      {avatarSource ? (
        <img src={avatarSource} alt={`${member.name} 아바타`} />
      ) : (
        <span aria-hidden="true">{memberEmoji(member?.name)}</span>
      )}
    </div>
  )
}

function Home({ profile, members, events, photos, onNavigate, onMember }) {
  return (
    <main className="screen home-screen">
      <header className="top-row">
        <div>
          <p className="eyebrow">우리 가족</p>
          <h1>우리 가족 <span aria-hidden="true">❤️</span></h1>
        </div>
        <button className="icon-button" type="button" aria-label="알림">♧<i /></button>
      </header>

      <p className="welcome-copy">
        {profile?.name ? `${profile.name}님, 오늘도 가족과 행복한 하루 보내세요.` : '오늘도 가족과 행복한 하루 보내세요.'}
      </p>

      <section className="section-block">
        <div className="section-heading">
          <h2>우리 가족</h2>
          <button type="button" onClick={() => onNavigate('family')}>전체 보기</button>
        </div>
        <div className="member-strip">
          {members.map((member) => (
            <button className="member-mini-card" type="button" key={member.id} onClick={() => onMember(member)}>
              <Avatar2D member={member} customization={DEFAULT_AVATAR_STYLE} />
              <strong>{member.name}</strong>
              <span><i className="status-dot status-dot--green" /> 함께 있어요</span>
            </button>
          ))}
        </div>
      </section>

      <section className="soft-card">
        <div className="section-heading">
          <h2>오늘의 일정</h2>
          <button type="button" onClick={() => onNavigate('events')}>더보기 ›</button>
        </div>
        <div className="schedule-list">
          {events.length ? events.slice(0, 3).map((event, index) => (
            <div className="schedule-row" key={event.id}>
              <span className={`schedule-dot schedule-dot--${index % 3}`} />
              <div><strong>{event.title}</strong><small>{new Date(event.event_date).toLocaleString('ko-KR')}</small></div>
            </div>
          )) : <p className="empty-copy">오늘 등록된 일정이 없습니다.</p>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>최근 추억</h2>
          <button type="button" onClick={() => onNavigate('memories')}>더보기 ›</button>
        </div>
        <div className="memory-preview">
          {photos.length ? photos.slice(0, 3).map((photo) => (
            <div key={photo.id} className="memory-tile">
              {photo.signedUrl ? <img src={photo.signedUrl} alt={photo.memo || '가족 추억'} /> : <span>📷</span>}
            </div>
          )) : <div className="empty-preview">첫 가족 추억을 남겨보세요 📷</div>}
        </div>
      </section>
    </main>
  )
}

function FamilyList({ members, onMember }) {
  return (
    <main className="screen">
      <header className="top-row"><h1>가족</h1><button className="icon-button" type="button" aria-label="가족 추가 준비 중">＋</button></header>
      <p className="screen-subtitle">소중한 우리 가족을 확인해보세요.</p>
      <div className="family-list">
        {members.map((member) => (
          <button type="button" className="family-row" key={member.id} onClick={() => onMember(member)}>
            <Avatar member={member} />
            <span className="family-row__info"><strong>{member.name}</strong><small><i className="status-dot status-dot--green" /> 함께 있어요</small></span>
            <span className="chevron">›</span>
          </button>
        ))}
      </div>
      <button className="add-family-card" type="button" onClick={() => window.alert('가족 추가 기능은 다음 단계에서 연결할 예정입니다.')}>＋ 가족 추가</button>
    </main>
  )
}

function FamilyProfile({ member, onBack, onLocation }) {
  const unavailable = () => window.alert('연락처 정보가 없어 아직 사용할 수 없습니다.')
  return (
    <main className="screen profile-screen">
      <header className="detail-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="가족 목록으로">‹</button>
        <button className="icon-button" type="button" aria-label="더보기">•••</button>
      </header>
      <section className="profile-hero">
        <Avatar2D member={member} customization={DEFAULT_AVATAR_STYLE} large />
        <h1>{member?.name || '가족'}</h1>
        <p><i className="status-dot status-dot--green" /> 함께 있어요</p>
      </section>
      <div className="action-grid">
        <button type="button" onClick={unavailable}><span>☎</span>전화하기</button>
        <button type="button" onClick={unavailable}><span>♢</span>문자 보내기</button>
        <button type="button" onClick={unavailable}><span>▰</span>영상통화</button>
        <button type="button" onClick={onLocation}><span>⌖</span>위치 보기</button>
        <button type="button" onClick={() => window.alert('프로필 보기 기능을 준비하고 있습니다.')}><span>♙</span>프로필 보기</button>
      </div>
    </main>
  )
}

function More({ onLocation, onLogout }) {
  const groups = [
    { title: '가족 관리', items: [['✓', '할 일'], ['♢', '가족 게시판'], ['♧', '알림'], ['⌁', '가족 통계']] },
    { title: '설정 및 지원', items: [['⚙', '설정'], ['?', '고객센터']] },
  ]
  return (
    <main className="screen">
      <header className="top-row"><h1>더보기</h1></header>
      {groups.map((group) => <section className="more-section" key={group.title}><h2>{group.title}</h2><div className="more-card">
        {group.items.map(([icon, label]) => <button type="button" key={label} onClick={() => window.alert(`${label} 기능을 준비하고 있습니다.`)}><span>{icon}</span>{label}<b>›</b></button>)}
        {group.title === '가족 관리' && <button type="button" onClick={onLocation}><span>⌖</span>가족 위치<b>›</b></button>}
      </div></section>)}
      <button className="logout-button" type="button" onClick={onLogout}>로그아웃</button>
    </main>
  )
}

function Login({ email, password, message, onEmail, onPassword, onSubmit }) {
  return (
    <main className="login-page" style={{ backgroundImage: `linear-gradient(rgba(54, 39, 62, .08), rgba(54, 39, 62, .08)), url("${loginBackgroundData.publicUrl}")` }}>
      <section className="login-card">
        <form onSubmit={onSubmit}>
          <input type="email" placeholder="이메일" value={email} onChange={(e) => onEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => onPassword(e.target.value)} required />
          <button type="submit">로그인</button>
        </form>
        {message && <p className="form-message">{message}</p>}
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [events, setEvents] = useState([])
  const [recentPhotos, setRecentPhotos] = useState([])
  const [page, setPage] = useState('home')
  const [selectedMember, setSelectedMember] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => { setSession(newSession); setAuthReady(true) })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) { setProfile(null); setFamilyMembers([]); return }
      const [profileResult, membersResult, eventsResult, photosResult] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url').eq('id', session.user.id).single(),
        supabase.from('profiles').select('id, name, avatar_url'),
        supabase.from('family_events').select('id, title, event_date').order('event_date', { ascending: true }).limit(3),
        supabase.from('photos').select('id, image_url, memo').order('created_at', { ascending: false }).limit(3),
      ])
      if (!profileResult.error) setProfile(profileResult.data)
      if (!membersResult.error) setFamilyMembers(membersResult.data || [])
      if (!eventsResult.error) setEvents(eventsResult.data || [])
      if (!photosResult.error) {
        const withUrls = await Promise.all((photosResult.data || []).map(async (item) => {
          const { data } = await supabase.storage.from('family-photos').createSignedUrl(item.image_url, 3600)
          return { ...item, signedUrl: data?.signedUrl || null }
        }))
        setRecentPhotos(withUrls)
      }
    }
    loadData()
  }, [session])

  const sortedMembers = useMemo(() => {
    const order = { 아빠: 1, 엄마: 2, 아들: 3 }
    return [...familyMembers].sort((a, b) => (order[a.name] || 99) - (order[b.name] || 99))
  }, [familyMembers])

  const handleLogin = async (event) => {
    event.preventDefault(); setMessage('로그인 중...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage('이메일 또는 비밀번호를 확인해주세요.')
    else { setMessage(''); setPage('home') }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut(); setPage('home'); setSelectedMember(null); setEmail(''); setPassword(''); setMessage('')
  }

  const openMember = (member) => { setSelectedMember(member); setPage('profile') }
  const navigate = (nextPage) => { setSelectedMember(null); setPage(nextPage) }

  if (!authReady) return <div className="app-loading"><span>우리 가족</span><small>불러오는 중...</small></div>
  if (!session) return <Login {...{ email, password, message }} onEmail={setEmail} onPassword={setPassword} onSubmit={handleLogin} />

  let content
  if (page === 'family') content = <FamilyList members={sortedMembers} onMember={openMember} />
  else if (page === 'profile') content = <FamilyProfile member={selectedMember} onBack={() => setPage('family')} onLocation={() => setPage('location')} />
  else if (page === 'memories') content = <FamilyPhotos session={session} onBack={() => setPage('home')} />
  else if (page === 'events') content = <FamilyEvents session={session} onBack={() => setPage('home')} />
  else if (page === 'location') content = <FamilyLocation session={session} onBack={() => setPage('family')} />
  else if (page === 'more') content = <More onLocation={() => setPage('location')} onLogout={handleLogout} />
  else content = <Home profile={profile} members={sortedMembers} events={events} photos={recentPhotos} onNavigate={navigate} onMember={openMember} />

  return <div className="mobile-app">{content}<BottomNav page={page} onChange={navigate} /></div>
}

export default App
