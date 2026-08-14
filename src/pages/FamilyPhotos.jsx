import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'family-shorts-reactions'

function FamilyPhotos({ session, onBack, uploadRequestKey = 0 }) {
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [memo, setMemo] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [commentItem, setCommentItem] = useState(null)
  const [comment, setComment] = useState('')
  const [reactions, setReactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
  })
  const photoCameraRef = useRef(null)
  const videoCameraRef = useRef(null)
  const albumRef = useRef(null)

  const isVideo = (path = '') => ['mp4', 'mov', 'm4v', 'webm', 'avi'].includes(path.split('.').pop()?.toLowerCase())

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('id, user_id, image_url, memo, created_at, profiles(name)')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setMessage('Shorts를 불러오지 못했습니다.'); return }
    const withUrls = await Promise.all((data || []).map(async (item) => {
      const { data: signed } = await supabase.storage.from('family-photos').createSignedUrl(item.image_url, 3600)
      return { ...item, signedUrl: signed?.signedUrl || null }
    }))
    setItems(withUrls)
  }

  useEffect(() => { loadItems() }, [])
  useEffect(() => { if (uploadRequestKey > 0) setShowUploader(true) }, [uploadRequestKey])

  const saveReactions = (next) => {
    setReactions(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const like = (id) => {
    const current = reactions[id] || { likes: 0, comments: [] }
    saveReactions({ ...reactions, [id]: { ...current, likes: current.likes + 1 } })
  }

  const submitComment = (event) => {
    event.preventDefault()
    if (!comment.trim() || !commentItem) return
    const current = reactions[commentItem.id] || { likes: 0, comments: [] }
    const nextComment = { text: comment.trim(), createdAt: new Date().toISOString() }
    saveReactions({ ...reactions, [commentItem.id]: { ...current, comments: [...current.comments, nextComment] } })
    setComment('')
  }

  const uploadMedia = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if ((!file.type.startsWith('image/') && !file.type.startsWith('video/')) || file.size > 50 * 1024 * 1024) {
      setMessage(file.size > 50 * 1024 * 1024 ? '파일은 50MB 이하만 올릴 수 있습니다.' : '사진 또는 동영상만 선택해주세요.')
      event.target.value = ''
      return
    }
    setUploading(true)
    setMessage('Shorts를 올리는 중입니다...')
    const extension = file.name.split('.').pop()?.toLowerCase() || (file.type.startsWith('video/') ? 'mp4' : 'jpg')
    const fileName = `${session.user.id}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('family-photos').upload(fileName, file, { contentType: file.type, upsert: false })
    if (uploadError) { console.error(uploadError); setMessage('업로드에 실패했습니다.'); setUploading(false); event.target.value = ''; return }
    const { error: databaseError } = await supabase.from('photos').insert({ user_id: session.user.id, image_url: fileName, memo: memo.trim() || null })
    if (databaseError) {
      console.error(databaseError)
      await supabase.storage.from('family-photos').remove([fileName])
      setMessage('Shorts 정보 저장에 실패했습니다.')
    } else {
      setMessage('Shorts가 등록되었습니다.')
      setMemo('')
      setShowUploader(false)
      await loadItems()
    }
    setUploading(false)
    event.target.value = ''
  }

  const deleteMedia = async (item) => {
    if (!window.confirm('이 Shorts를 삭제할까요? 삭제하면 복구하기 어렵습니다.')) return
    const { error } = await supabase.from('photos').delete().eq('id', item.id)
    if (error) { setMessage('삭제에 실패했습니다.'); return }
    await supabase.storage.from('family-photos').remove([item.image_url])
    setMessage('Shorts가 삭제되었습니다.')
    await loadItems()
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button type="button" style={styles.headerButton} onClick={onBack}>‹</button>
        <h1 style={styles.title}>Shorts</h1>
        <button type="button" style={styles.headerButton} onClick={() => setShowUploader(true)}>＋</button>
      </header>
      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.feed}>
        {items.length === 0 ? <div style={styles.empty}>첫 가족 Shorts를 올려보세요 🎬</div> : items.map((item) => {
          const counts = reactions[item.id] || { likes: 0, comments: [] }
          return (
            <article key={item.id} style={styles.shortCard}>
              <div style={styles.mediaArea}>
                {item.signedUrl ? (isVideo(item.image_url)
                  ? <video src={item.signedUrl} controls playsInline preload="metadata" style={styles.media}/>
                  : <img src={item.signedUrl} alt={item.memo || '가족 Shorts'} loading="lazy" style={styles.media}/>)
                  : <div style={styles.mediaError}>파일을 표시할 수 없습니다.</div>}
                <div style={styles.sideActions}>
                  <button type="button" style={styles.actionButton} onClick={() => like(item.id)}><span>♡</span><b>+{counts.likes}</b></button>
                  <button type="button" style={styles.actionButton} onClick={() => setCommentItem(item)}><span>♧</span><b>+{counts.comments.length}</b></button>
                </div>
                <div style={styles.caption}>
                  <strong>{item.profiles?.name || '가족'}</strong>
                  {item.memo && <p>{item.memo}</p>}
                  <small>{new Date(item.created_at).toLocaleString('ko-KR')}</small>
                </div>
              </div>
              {item.user_id === session.user.id && <button type="button" style={styles.deleteButton} onClick={() => deleteMedia(item)}>삭제</button>}
            </article>
          )
        })}
      </section>

      {showUploader && <div style={styles.overlay} onClick={() => !uploading && setShowUploader(false)}>
        <section style={styles.sheet} onClick={(event) => event.stopPropagation()}>
          <div style={styles.sheetHandle}/><h2>새 Shorts 올리기</h2>
          <textarea style={styles.memoInput} placeholder="사진이나 영상에 남길 이야기" value={memo} onChange={(event) => setMemo(event.target.value)}/>
          <button type="button" style={styles.uploadChoice} onClick={() => photoCameraRef.current?.click()} disabled={uploading}>📷 사진 바로 찍기</button>
          <button type="button" style={styles.uploadChoice} onClick={() => videoCameraRef.current?.click()} disabled={uploading}>🎥 영상 바로 찍기</button>
          <button type="button" style={styles.uploadChoice} onClick={() => albumRef.current?.click()} disabled={uploading}>▧ 스마트폰 앨범에서 선택</button>
          <input ref={photoCameraRef} hidden type="file" accept="image/*" capture="environment" onChange={uploadMedia}/>
          <input ref={videoCameraRef} hidden type="file" accept="video/*" capture="environment" onChange={uploadMedia}/>
          <input ref={albumRef} hidden type="file" accept="image/*,video/*" onChange={uploadMedia}/>
          <p style={styles.guide}>{uploading ? '업로드 중입니다...' : '사진 또는 동영상 · 파일당 최대 50MB'}</p>
          <button type="button" style={styles.cancelButton} onClick={() => setShowUploader(false)} disabled={uploading}>취소</button>
        </section>
      </div>}

      {commentItem && <div style={styles.overlay} onClick={() => setCommentItem(null)}>
        <section style={styles.commentSheet} onClick={(event) => event.stopPropagation()}>
          <div style={styles.sheetHandle}/><h2>댓글 +{(reactions[commentItem.id]?.comments || []).length}</h2>
          <div style={styles.comments}>
            {(reactions[commentItem.id]?.comments || []).map((entry, index) => <p key={`${entry.createdAt}-${index}`}><strong>가족</strong> {entry.text}</p>)}
            {!(reactions[commentItem.id]?.comments || []).length && <span>첫 댓글을 남겨보세요.</span>}
          </div>
          <form style={styles.commentForm} onSubmit={submitComment}>
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글 입력"/>
            <button type="submit">등록</button>
          </form>
          <button type="button" style={styles.cancelButton} onClick={() => setCommentItem(null)}>닫기</button>
        </section>
      </div>}
    </main>
  )
}

const styles = {
  page: { minHeight: '100svh', padding: '18px 12px 100px', boxSizing: 'border-box', background: '#f8f5fa', color: '#272332' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '430px', margin: '0 auto 14px' },
  title: { margin: 0, fontSize: '27px' },
  headerButton: { width: '42px', height: '42px', border: '1px solid #eeeaf1', borderRadius: '14px', background: '#fff', fontSize: '25px', color: '#7c3aed', cursor: 'pointer' },
  message: { maxWidth: '430px', margin: '8px auto', color: '#7c3aed', fontSize: '13px', textAlign: 'center' },
  feed: { maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { padding: '70px 20px', borderRadius: '24px', background: '#fff', color: '#8d8798', textAlign: 'center' },
  shortCard: { borderRadius: '24px', overflow: 'hidden', background: '#fff', boxShadow: '0 8px 28px rgba(56,38,68,.09)', scrollSnapAlign: 'start' },
  mediaArea: { position: 'relative', width: '100%', aspectRatio: '9 / 14', maxHeight: '72svh', overflow: 'hidden', background: '#17141b' },
  media: { width: '100%', height: '100%', display: 'block', objectFit: 'contain', background: '#17141b' },
  mediaError: { height: '100%', display: 'grid', placeItems: 'center', color: '#fff' },
  sideActions: { position: 'absolute', right: '12px', bottom: '82px', display: 'flex', flexDirection: 'column', gap: '13px' },
  actionButton: { width: '48px', minHeight: '54px', border: '1px solid rgba(255,255,255,.35)', borderRadius: '18px', background: 'rgba(30,24,35,.36)', color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: '45px 72px 16px 16px', color: '#fff', background: 'linear-gradient(transparent,rgba(0,0,0,.78))' },
  deleteButton: { width: '100%', padding: '11px', border: 0, background: '#fff', color: '#c64b70', cursor: 'pointer' },
  overlay: { position: 'fixed', zIndex: 3000, inset: 0, padding: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(27,20,31,.5)' },
  sheet: { width: 'min(100%,430px)', padding: '12px 18px 22px', borderRadius: '26px 26px 18px 18px', background: '#fff' },
  commentSheet: { width: 'min(100%,430px)', maxHeight: '72svh', padding: '12px 18px 22px', borderRadius: '26px 26px 18px 18px', background: '#fff' },
  sheetHandle: { width: '40px', height: '4px', margin: '0 auto 15px', borderRadius: '4px', background: '#ded7e3' },
  memoInput: { width: '100%', minHeight: '70px', padding: '12px', marginBottom: '10px', boxSizing: 'border-box', border: '1px solid #e7dfeb', borderRadius: '13px', fontSize: '15px', resize: 'none' },
  uploadChoice: { width: '100%', padding: '14px', marginTop: '8px', border: 0, borderRadius: '13px', background: '#f4edfc', color: '#6e36b3', fontWeight: 800, cursor: 'pointer' },
  guide: { color: '#98909e', fontSize: '11px', textAlign: 'center' },
  cancelButton: { width: '100%', padding: '12px', border: 0, borderRadius: '12px', background: '#f3f1f4', color: '#69636d', cursor: 'pointer' },
  comments: { maxHeight: '38svh', overflowY: 'auto', padding: '8px 2px', color: '#655e6c' },
  commentForm: { display: 'flex', gap: '8px', margin: '10px 0' },
}

export default FamilyPhotos
