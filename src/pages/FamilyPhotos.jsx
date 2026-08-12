import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function FamilyPhotos({ session, onBack }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 600
  )

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select(`
        id,
        user_id,
        image_url,
        memo,
        created_at,
        profiles (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('앨범 목록 오류:', error)
      setMessage('앨범을 불러오지 못했습니다.')
      return
    }

    const itemsWithUrls = await Promise.all(
      (data || []).map(async (item) => {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from('family-photos')
            .createSignedUrl(item.image_url, 3600)

        if (signedError) {
          console.error('파일 주소 오류:', signedError)

          return {
            ...item,
            signedUrl: null,
          }
        }

        return {
          ...item,
          signedUrl: signedData.signedUrl,
        }
      })
    )

    setPhotos(itemsWithUrls)
  }

  useEffect(() => {
    loadPhotos()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedItem(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const isVideo = (filePath) => {
    if (!filePath) return false

    const extension = filePath
      .split('.')
      .pop()
      .toLowerCase()

    return [
      'mp4',
      'mov',
      'm4v',
      'webm',
      'avi',
    ].includes(extension)
  }

  const uploadMedia = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const maxSize = 50 * 1024 * 1024

    if (file.size > maxSize) {
      setMessage('파일 크기는 50MB 이하만 올릴 수 있습니다.')
      event.target.value = ''
      return
    }

    const isImageFile = file.type.startsWith('image/')
    const isVideoFile = file.type.startsWith('video/')

    if (!isImageFile && !isVideoFile) {
      setMessage('사진 또는 동영상 파일만 선택해주세요.')
      event.target.value = ''
      return
    }

    setUploading(true)

    setMessage(
      isVideoFile
        ? '동영상을 올리는 중입니다...'
        : '사진을 올리는 중입니다...'
    )

    const originalExtension =
      file.name.split('.').pop()?.toLowerCase()

    const extension =
      originalExtension ||
      (isVideoFile ? 'mp4' : 'jpg')

    const fileName =
      `${session.user.id}/${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('family-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError)
      setMessage('파일 업로드에 실패했습니다.')
      setUploading(false)
      event.target.value = ''
      return
    }

    const { error: databaseError } = await supabase
      .from('photos')
      .insert({
        user_id: session.user.id,
        image_url: fileName,
        memo: memo.trim() || null,
      })

    if (databaseError) {
      console.error('앨범 정보 저장 오류:', databaseError)

      await supabase.storage
        .from('family-photos')
        .remove([fileName])

      setMessage('앨범 정보 저장에 실패했습니다.')
      setUploading(false)
      event.target.value = ''
      return
    }

    setMemo('')

    setMessage(
      isVideoFile
        ? '동영상이 등록되었습니다.'
        : '사진이 등록되었습니다.'
    )

    setUploading(false)
    event.target.value = ''

    await loadPhotos()
  }

  const deleteMedia = async (item) => {
    const typeName =
      isVideo(item.image_url)
        ? '동영상'
        : '사진'

    const ok = window.confirm(
      `정말 이 ${typeName}을 삭제할까요?\n삭제하면 복구하기 어렵습니다.`
    )

    if (!ok) return

    setDeletingId(item.id)
    setMessage(`${typeName}을 삭제하는 중입니다...`)

    const { error: databaseError } = await supabase
      .from('photos')
      .delete()
      .eq('id', item.id)

    if (databaseError) {
      console.error('앨범 기록 삭제 오류:', databaseError)
      setMessage(`${typeName} 삭제에 실패했습니다.`)
      setDeletingId(null)
      return
    }

    const { error: storageError } = await supabase.storage
      .from('family-photos')
      .remove([item.image_url])

    if (storageError) {
      console.error('Storage 파일 삭제 오류:', storageError)

      setMessage(
        '앨범에서는 삭제됐지만 저장 파일 삭제에 실패했습니다.'
      )
    } else {
      setMessage(`${typeName}이 삭제되었습니다.`)
    }

    if (selectedItem?.id === item.id) {
      setSelectedItem(null)
    }

    setDeletingId(null)

    await loadPhotos()
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.container,
          ...(isMobile ? styles.mobileContainer : {}),
        }}
      >

        <button
          type="button"
          style={styles.backButton}
          onClick={onBack}
        >
          ← 홈으로
        </button>

        <h1
          style={{
            ...styles.title,
            ...(isMobile ? styles.mobileTitle : {}),
          }}
        >
          📷 가족 앨범
        </h1>

        <p style={styles.subtitle}>
          우리 가족의 사진과 동영상을 함께 보관합니다.
        </p>

        <div style={styles.uploadBox}>
          <textarea
            style={styles.memoInput}
            placeholder="사진이나 동영상에 남길 메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <label style={styles.uploadButton}>
            {uploading
              ? '업로드 중...'
              : '+ 사진 또는 동영상 올리기'}

            <input
              type="file"
              accept="image/*,video/*"
              onChange={uploadMedia}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          <p style={styles.fileGuide}>
            사진 또는 동영상 · 파일당 최대 50MB
          </p>
        </div>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        {photos.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📷
            </div>

            <p>
              아직 등록된 추억이 없습니다.
            </p>
          </div>
        ) : (
          <div
            style={{
              ...styles.photoGrid,
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {photos.map((item) => {
              const video = isVideo(item.image_url)

              return (
                <div
                  key={item.id}
                  style={styles.photoCard}
                >
                  {item.signedUrl ? (
                    video ? (
                      <div
                        style={{
                          ...styles.mediaWrapper,
                          ...(isMobile
                            ? styles.mobileMediaWrapper
                            : {}),
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        <video
                          src={item.signedUrl}
                          muted
                          playsInline
                          preload="metadata"
                          style={styles.videoPreview}
                        />

                        <div style={styles.videoPlayButton}>
                          ▶
                        </div>

                        <div style={styles.clickGuide}>
                          크게 재생
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          ...styles.mediaWrapper,
                          ...(isMobile
                            ? styles.mobileMediaWrapper
                            : {}),
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        <img
                          src={item.signedUrl}
                          alt="가족 추억"
                          loading="lazy"
                          style={styles.imagePreview}
                        />

                        <div style={styles.clickGuide}>
                          크게 보기
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={styles.mediaError}>
                      파일을 표시할 수 없습니다.
                    </div>
                  )}

                  <div style={styles.photoInfo}>
                    <div style={styles.infoTop}>
                      <strong style={styles.author}>
                        {item.profiles?.name || '가족'}
                      </strong>

                      <span style={styles.mediaType}>
                        {video ? '🎬 동영상' : '📷 사진'}
                      </span>
                    </div>

                    <span style={styles.date}>
                      {new Date(item.created_at)
                        .toLocaleString('ko-KR')}
                    </span>

                    {item.memo && (
                      <p style={styles.memo}>
                        {item.memo}
                      </p>
                    )}

                    {item.user_id === session.user.id && (
                      <button
                        type="button"
                        style={styles.deleteButton}
                        onClick={() => deleteMedia(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id
                          ? '삭제 중...'
                          : video
                            ? '🗑 동영상 삭제'
                            : '🗑 사진 삭제'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              ...styles.modalContent,
              ...(isMobile ? styles.mobileModalContent : {}),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              style={styles.modalCloseButton}
              onClick={() => setSelectedItem(null)}
            >
              ✕ 닫기
            </button>

            <div style={styles.modalMediaArea}>
              {isVideo(selectedItem.image_url) ? (
                <video
                  src={selectedItem.signedUrl}
                  controls
                  autoPlay
                  playsInline
                  style={styles.modalVideo}
                >
                  동영상을 재생할 수 없습니다.
                </video>
              ) : (
                <img
                  src={selectedItem.signedUrl}
                  alt="가족 추억 크게 보기"
                  style={styles.modalImage}
                />
              )}
            </div>

            <div style={styles.modalInfo}>
              <div style={styles.modalInfoTop}>
                <strong>
                  {selectedItem.profiles?.name || '가족'}
                </strong>

                <span>
                  {isVideo(selectedItem.image_url)
                    ? '🎬 동영상'
                    : '📷 사진'}
                </span>
              </div>

              <div style={styles.modalDate}>
                {new Date(selectedItem.created_at)
                  .toLocaleString('ko-KR')}
              </div>

              {selectedItem.memo && (
                <p style={styles.modalMemo}>
                  {selectedItem.memo}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
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
    maxWidth: '700px',
    margin: '30px auto',
  },

  mobileContainer: {
    margin: '10px auto',
  },

  backButton: {
    border: '1px solid #dddddd',
    background: '#ffffff',
    color: '#222222',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '25px',
    fontSize: '14px',
  },

  title: {
    marginBottom: '8px',
    fontSize: '32px',
    color: '#222222',
  },

  mobileTitle: {
    fontSize: '27px',
  },

  subtitle: {
    color: '#777777',
    marginBottom: '25px',
  },

  uploadBox: {
    background: '#ffffff',
    padding: '18px',
    borderRadius: '15px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },

  memoInput: {
    width: '100%',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #dddddd',
    borderRadius: '10px',
    fontSize: '16px',
    color: '#222222',
    background: '#ffffff',
    marginBottom: '12px',
  },

  uploadButton: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '15px',
    background: '#222222',
    color: '#ffffff',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
  },

  fileGuide: {
    margin: '10px 0 0',
    textAlign: 'center',
    color: '#999999',
    fontSize: '12px',
  },

  message: {
    textAlign: 'center',
    margin: '15px 0',
    color: '#444444',
  },

  photoGrid: {
    display: 'grid',
    gap: '14px',
  },

  photoCard: {
    background: '#ffffff',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },

  mediaWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    background: '#111111',
    overflow: 'hidden',
    cursor: 'pointer',
  },

  mobileMediaWrapper: {
    aspectRatio: '4 / 3',
  },

  imagePreview: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  videoPreview: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#000000',
  },

  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.65)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    paddingLeft: '4px',
    pointerEvents: 'none',
  },

  clickGuide: {
    position: 'absolute',
    left: '50%',
    bottom: '10px',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.65)',
    color: '#ffffff',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },

  mediaError: {
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888888',
    padding: '15px',
    boxSizing: 'border-box',
    textAlign: 'center',
  },

  photoInfo: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  infoTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },

  author: {
    color: '#222222',
  },

  mediaType: {
    color: '#555555',
  },

  date: {
    color: '#888888',
    fontSize: '12px',
  },

  memo: {
    margin: '4px 0',
    lineHeight: 1.5,
    color: '#333333',
    whiteSpace: 'pre-wrap',
  },

  deleteButton: {
    display: 'block',
    width: '100%',
    marginTop: '10px',
    border: '1px solid #e53935',
    background: '#fff0f0',
    color: '#c62828',
    WebkitTextFillColor: '#c62828',
    padding: '11px 10px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    textAlign: 'center',
    opacity: 1,
    appearance: 'none',
    WebkitAppearance: 'none',
  },

  empty: {
    marginTop: '50px',
    textAlign: 'center',
    color: '#888888',
  },

  emptyIcon: {
    fontSize: '55px',
    marginBottom: '10px',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
    boxSizing: 'border-box',
  },

  modalContent: {
    width: '100%',
    maxWidth: '1000px',
    maxHeight: '95vh',
    background: '#111111',
    borderRadius: '16px',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },

  mobileModalContent: {
    maxHeight: '96vh',
    borderRadius: '12px',
  },

  modalCloseButton: {
    position: 'sticky',
    top: '10px',
    float: 'right',
    zIndex: 10,
    margin: '10px 10px 0 0',
    border: 'none',
    background: 'rgba(255,255,255,0.92)',
    color: '#222222',
    padding: '9px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
  },

  modalMediaArea: {
    clear: 'both',
    width: '100%',
    minHeight: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#000000',
  },

  modalImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '80vh',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },

  modalVideo: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    background: '#000000',
  },

  modalInfo: {
    background: '#ffffff',
    padding: '15px 18px 18px',
    color: '#222222',
  },

  modalInfoTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
  },

  modalDate: {
    color: '#888888',
    fontSize: '12px',
    marginTop: '7px',
  },

  modalMemo: {
    margin: '12px 0 0',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
}

export default FamilyPhotos