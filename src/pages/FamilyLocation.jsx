import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapController({ locations }) {
  const map = useMap()

  useEffect(() => {
    if (!locations.length) return

    if (locations.length === 1) {
      map.setView(
        [
          locations[0].latitude,
          locations[0].longitude,
        ],
        16
      )

      return
    }

    const bounds = locations.map((location) => [
      location.latitude,
      location.longitude,
    ])

    map.fitBounds(bounds, {
      padding: [40, 40],
    })
  }, [locations, map])

  return null
}

function FamilyLocation({ session, onBack }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('user_locations')
      .select(`
        user_id,
        latitude,
        longitude,
        updated_at,
        profiles (
          name
        )
      `)
      .order('updated_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        '위치 불러오기 오류:',
        error
      )

      setMessage(
        '가족 위치를 불러오지 못했습니다.'
      )

      return
    }

    setLocations(data || [])
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const updateMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage(
        '이 기기에서는 위치 기능을 사용할 수 없습니다.'
      )

      return
    }

    setLoading(true)

    setMessage(
      '현재 위치를 확인하고 있습니다...'
    )

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude

        const longitude =
          position.coords.longitude

        const { error } = await supabase
          .from('user_locations')
          .upsert(
            {
              user_id: session.user.id,
              latitude,
              longitude,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )

        if (error) {
          console.error(
            '위치 저장 오류:',
            error
          )

          setMessage(
            '위치 저장에 실패했습니다.'
          )

          setLoading(false)

          return
        }

        setMessage(
          '현재 위치가 업데이트되었습니다.'
        )

        setLoading(false)

        await loadLocations()
      },

      (error) => {
        console.error(
          'GPS 오류:',
          error
        )

        if (error.code === 1) {
          setMessage(
            '위치 권한이 거부되었습니다. 브라우저의 위치 권한을 허용해주세요.'
          )
        } else if (error.code === 2) {
          setMessage(
            '현재 위치를 확인할 수 없습니다.'
          )
        } else if (error.code === 3) {
          setMessage(
            '위치 확인 시간이 초과되었습니다.'
          )
        } else {
          setMessage(
            '위치를 가져오지 못했습니다.'
          )
        }

        setLoading(false)
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const getEmoji = (name) => {
    if (name === '아빠') return '👨'
    if (name === '엄마') return '👩'
    if (name === '아들') return '👦'

    return '🙂'
  }

  const defaultCenter = [
    36.577627,
    128.477917,
  ]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <button
          style={styles.backButton}
          onClick={onBack}
        >
          ← 홈으로
        </button>

        <h1 style={styles.title}>
          📍 가족 위치
        </h1>

        <p style={styles.subtitle}>
          지도에서 우리 가족의 최근 위치를 확인합니다.
        </p>

        <button
          style={styles.locationButton}
          onClick={updateMyLocation}
          disabled={loading}
        >
          {loading
            ? '위치 확인 중...'
            : '📍 내 현재 위치 업데이트'}
        </button>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        <div style={styles.mapCard}>

          <MapContainer
            center={defaultCenter}
            zoom={14}
            scrollWheelZoom={true}
            style={styles.map}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              locations={locations}
            />

            {locations.map(
              (location) => {
                const name =
                  location.profiles?.name ||
                  '가족'

                return (
                  <Marker
                    key={location.user_id}
                    position={[
                      location.latitude,
                      location.longitude,
                    ]}
                  >
                    <Popup>
                      <strong>
                        {getEmoji(name)} {name}
                      </strong>

                      <br />

                      마지막 위치
                      <br />

                      {new Date(
                        location.updated_at
                      ).toLocaleString(
                        'ko-KR'
                      )}
                    </Popup>
                  </Marker>
                )
              }
            )}

          </MapContainer>

        </div>

        <div style={styles.locationList}>

          {locations.length === 0 ? (

            <div style={styles.empty}>
              아직 저장된 가족 위치가 없습니다.
            </div>

          ) : (

            locations.map(
              (location) => {

                const name =
                  location.profiles?.name ||
                  '가족'

                return (
                  <div
                    key={location.user_id}
                    style={styles.locationCard}
                  >

                    <div style={styles.person}>

                      <div style={styles.avatar}>
                        {getEmoji(name)}
                      </div>

                      <div>

                        <strong
                          style={styles.name}
                        >
                          {name}
                        </strong>

                        <div style={styles.time}>
                          마지막 업데이트
                          {' '}
                          {new Date(
                            location.updated_at
                          ).toLocaleString(
                            'ko-KR'
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                )
              }
            )

          )}

        </div>

        <div style={styles.notice}>
          각 가족이 위치 업데이트를 실행한
          마지막 위치가 지도에 표시됩니다.
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
    maxWidth: '700px',
    margin: '30px auto',
  },

  backButton: {
    border: '1px solid #ddd',
    background: 'white',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '25px',
  },

  title: {
    marginBottom: '8px',
    fontSize: '32px',
  },

  subtitle: {
    color: '#777',
    marginBottom: '25px',
  },

  locationButton: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: '#222',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  message: {
    textAlign: 'center',
    margin: '18px 0',
    fontWeight: 'bold',
  },

  mapCard: {
    marginTop: '20px',
    background: 'white',
    padding: '8px',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow:
      '0 4px 15px rgba(0,0,0,0.08)',
  },

  map: {
    width: '100%',
    height: '430px',
    borderRadius: '12px',
  },

  locationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '20px',
  },

  locationCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '15px',
    boxShadow:
      '0 4px 15px rgba(0,0,0,0.05)',
  },

  person: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: '#f1f1f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '27px',
  },

  name: {
    fontSize: '18px',
  },

  time: {
    color: '#888',
    fontSize: '12px',
    marginTop: '5px',
  },

  notice: {
    background: 'white',
    borderRadius: '12px',
    padding: '15px',
    marginTop: '18px',
    color: '#777',
    fontSize: '13px',
    lineHeight: 1.6,
  },

  empty: {
    background: 'white',
    padding: '20px',
    borderRadius: '15px',
    textAlign: 'center',
    color: '#888',
  },
}

export default FamilyLocation