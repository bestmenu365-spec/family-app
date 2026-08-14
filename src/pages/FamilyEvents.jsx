import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function FamilyEvents({ session, onBack }) {
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  const resetForm = () => {
    setTitle('')
    setEventDate('')
    setEndDate('')
    setEditingId(null)
  }

  const toDateTimeInput = (value) => {
    const date = new Date(value)
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
  }

  const getEndDate = (description) => {
    if (!description?.startsWith('__END_DATE__:')) return null
    const value = description.slice('__END_DATE__:'.length)
    return Number.isNaN(new Date(value).getTime()) ? null : value
  }

  const formatScheduleDate = (event) => {
    const start = new Date(event.event_date)
    const savedEndDate = getEndDate(event.description)
    if (!savedEndDate) return start.toLocaleString('ko-KR')
    const end = new Date(savedEndDate)
    const startText = start.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const endText = end.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    return `${startText} ~ ${endText}`
  }

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

  const saveEvent = async (e) => {
    e.preventDefault()

    if (!title || !eventDate || !endDate) {
      setMessage('일정 이름과 시작·종료 날짜를 입력해주세요.')
      return
    }

    if (new Date(endDate) < new Date(eventDate)) {
      setMessage('종료 일시는 시작 일시보다 늦어야 합니다.')
      return
    }

    const payload = { title: title.trim(), event_date: eventDate, description: `__END_DATE__:${endDate}` }
    const query = editingId
      ? supabase.from('family_events').update(payload).eq('id', editingId)
      : supabase.from('family_events').insert({ ...payload, user_id: session.user.id })
    const { error } = await query

    if (error) {
      console.error(error)
      setMessage(editingId ? '일정 수정에 실패했습니다.' : '일정 등록에 실패했습니다.')
      return
    }

    setMessage(editingId ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.')
    resetForm()

    loadEvents()
  }

  const startEdit = (event) => {
    setEditingId(event.id)
    setTitle(event.title)
    setEventDate(toDateTimeInput(event.event_date))
    setEndDate(getEndDate(event.description) ? toDateTimeInput(getEndDate(event.description)) : toDateTimeInput(event.event_date))
    setMessage('선택한 일정을 수정하고 있습니다.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEvent = async (event) => {
    if (!window.confirm(`‘${event.title}’ 일정을 삭제할까요?`)) return

    const { error } = await supabase
      .from('family_events')
      .delete()
      .eq('id', event.id)

    if (error) {
      console.error(error)
      setMessage('일정 삭제에 실패했습니다.')
      return
    }

    if (editingId === event.id) resetForm()
    setMessage('일정이 삭제되었습니다.')

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

        <form style={styles.form} onSubmit={saveEvent}>

          {editingId && <strong style={styles.editingLabel}>일정 수정 중</strong>}

          <input
            style={styles.input}
            type="text"
            placeholder="예: 가족 외식"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label style={styles.fieldLabel}>
            시작 일시
            <input
              style={styles.datedInput}
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>

          <label style={styles.fieldLabel}>
            종료 일시
            <input
              style={styles.datedInput}
              type="datetime-local"
              min={eventDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button style={styles.addButton} type="submit">
            {editingId ? '수정 내용 저장' : '+ 일정 추가'}
          </button>

          {editingId && (
            <button style={styles.cancelButton} type="button" onClick={() => { resetForm(); setMessage('수정을 취소했습니다.') }}>
              수정 취소
            </button>
          )}

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
                  {formatScheduleDate(event)}
                </span>

                <div style={styles.eventActions}>
                  <button type="button" style={styles.editButton} onClick={() => startEdit(event)}>수정</button>
                  <button type="button" style={styles.deleteButton} onClick={() => deleteEvent(event)}>삭제</button>
                </div>

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

  fieldLabel: {
    display: 'block',
    marginBottom: '12px',
    color: '#666',
    fontSize: '13px',
    fontWeight: 700,
  },

  datedInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    marginTop: '6px',
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

  editingLabel: {
    display: 'block',
    marginBottom: '12px',
    color: '#7c3aed',
    fontSize: '14px',
  },

  cancelButton: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    background: 'white',
    color: '#666',
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

  eventActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },

  editButton: {
    flex: 1,
    padding: '9px',
    border: '1px solid #cbb8e8',
    borderRadius: '9px',
    background: '#f7f2ff',
    color: '#7c3aed',
    fontWeight: 700,
    cursor: 'pointer',
  },

  deleteButton: {
    flex: 1,
    padding: '9px',
    border: '1px solid #f4c7d4',
    borderRadius: '9px',
    background: '#fff2f6',
    color: '#d74771',
    fontWeight: 700,
    cursor: 'pointer',
  },

  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: '40px',
  },
}


export default FamilyEvents
