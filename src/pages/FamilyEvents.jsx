import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function FamilyEvents({ session, onBack }) {
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('family_events')
      .select('id, title, description, event_date, user_id')
      .order('event_date', { ascending: true })

    if (error) {
      console.error(error)
      setMessage('일정을 불러오지 못했습니다.')
      return
    }

    setEvents(data || [])
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const addEvent = async (e) => {
    e.preventDefault()

    if (!title || !eventDate) {
      setMessage('일정 이름과 날짜를 입력해주세요.')
      return
    }

    const { error } = await supabase
      .from('family_events')
      .insert({
        user_id: session.user.id,
        title,
        event_date: eventDate,
      })

    if (error) {
      console.error(error)
      setMessage('일정 등록에 실패했습니다.')
      return
    }

    setTitle('')
    setEventDate('')
    setMessage('일정이 등록되었습니다.')

    loadEvents()
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <button style={styles.backButton} onClick={onBack}>
          ← 홈으로
        </button>

        <h1>📅 가족 일정</h1>

        <p style={styles.subtitle}>
          우리 가족의 일정을 함께 관리합니다.
        </p>

        <form style={styles.form} onSubmit={addEvent}>

          <input
            style={styles.input}
            type="text"
            placeholder="예: 가족 외식"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            style={styles.input}
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <button style={styles.addButton} type="submit">
            + 일정 추가
          </button>

        </form>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        <div style={styles.list}>

          {events.length === 0 ? (

            <p style={styles.empty}>
              아직 등록된 일정이 없습니다.
            </p>

          ) : (

            events.map((event) => (

              <div
                key={event.id}
                style={styles.eventCard}
              >

                <strong style={styles.eventTitle}>
                  {event.title}
                </strong>

                <span style={styles.date}>
                  {new Date(event.event_date)
                    .toLocaleString('ko-KR')}
                </span>

              </div>

            ))

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
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  },

  container: {
    maxWidth: '650px',
    margin: '30px auto',
  },

  subtitle: {
    color: '#777',
    marginBottom: '25px',
  },

  backButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '20px',
  },

  form: {
    background: 'white',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '25px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    marginBottom: '12px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '16px',
  },

  addButton: {
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
    textAlign: 'center',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  eventCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
  },

  eventTitle: {
    fontSize: '17px',
  },

  date: {
    color: '#777',
    fontSize: '14px',
  },

  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: '40px',
  },
}


export default FamilyEvents