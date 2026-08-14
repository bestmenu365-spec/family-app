import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'

const getModelUrl = (name) => name === '엄마'
  ? '/models/family-female.vrm'
  : '/models/family-male.vrm'

const colorizeMaterials = (avatar, customization) => {
  avatar.traverse((object) => {
    if (!object.isMesh) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      const name = `${object.name} ${material?.name || ''}`.toLowerCase()
      if (!material?.color) return
      let selectedColor = null
      if (/hair/.test(name)) selectedColor = customization.hair
      else if (/tops|bottoms|cloth|shirt/.test(name) && !/body_00_skin/.test(name)) selectedColor = customization.outfit
      else if (/shoe/.test(name)) selectedColor = customization.shoes
      if (selectedColor) {
        material.color.set(selectedColor)
        material.map = null
        if ('shadeColorFactor' in material) material.shadeColorFactor.set(selectedColor).multiplyScalar(.72)
        material.needsUpdate = true
      }
    })
  })
}

const applyStyle = (avatar, vrm, customization, modelScale) => {
  if (customization.hairStyle === 'short') {
    avatar.traverse((object) => { if (/hairback/i.test(object.name)) object.visible = false })
  }
  if (customization.hairStyle === 'bun') {
    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(.105, 24, 20),
      new THREE.MeshStandardMaterial({ color: customization.hair, roughness: .8 }),
    )
    bun.position.set(0, 1.76, .08)
    const group = new THREE.Group()
    group.scale.setScalar(1 / modelScale)
    group.add(bun)
    avatar.add(group)
  }
  const bodyWidth = customization.body === 'slim' ? .88 : customization.body === 'broad' ? 1.12 : 1
  avatar.scale.x *= bodyWidth
  const expression = customization.expression === 'smile' ? 'happy' : customization.expression
  if (expression && expression !== 'neutral') vrm.expressionManager?.setValue(expression, 1)
}

const addAccessory = (avatar, customization, modelScale) => {
  const group = new THREE.Group()
  group.name = 'custom-accessories'
  group.scale.setScalar(1 / modelScale)
  const standard = (color, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness })
  const mesh = (geometry, material, position, rotation) => {
    const item = new THREE.Mesh(geometry, material)
    item.position.set(...position)
    if (rotation) item.rotation.set(...rotation)
    group.add(item)
  }

  if (customization.accessory === 'glasses') {
    const frame = standard(0x30283a, .45)
    mesh(new THREE.TorusGeometry(.105, .012, 10, 28), frame, [-.12, 1.57, -.105])
    mesh(new THREE.TorusGeometry(.105, .012, 10, 28), frame, [.12, 1.57, -.105])
    mesh(new THREE.BoxGeometry(.05, .015, .015), frame, [0, 1.57, -.105])
  }
  if (customization.accessory === 'hat') {
    mesh(new THREE.CylinderGeometry(.25, .28, .13, 32), standard(customization.outfit), [0, 1.9, 0])
    mesh(new THREE.CylinderGeometry(.38, .38, .025, 32), standard(customization.outfit), [0, 1.83, 0])
  }
  if (customization.bag !== 'none') {
    const bagColor = customization.bag === 'backpack' ? 0x74533d : 0xb9788f
    const bagMaterial = standard(bagColor)
    if (customization.bag === 'backpack') {
      mesh(new THREE.CapsuleGeometry(.14, .22, 8, 18), bagMaterial, [0, 1.02, .19])
      mesh(new THREE.TorusGeometry(.22, .012, 8, 30, Math.PI), bagMaterial, [0, 1.2, .02], [0, Math.PI, 0])
    } else {
      mesh(new THREE.BoxGeometry(.24, .2, .1), bagMaterial, [.29, .83, .06])
      mesh(new THREE.TorusGeometry(.38, .012, 8, 36, Math.PI), bagMaterial, [.08, 1.18, 0], [0, 0, -.55])
    }
  }
  if (customization.bracelet !== 'none') {
    const color = customization.bracelet === 'gold' ? 0xe7bd55 : 0x8b69d4
    mesh(new THREE.TorusGeometry(.043, .009, 8, 24), standard(color, .7), [.30, .77, 0], [Math.PI / 2, 0, 0])
  }
  if (customization.shoes) {
    const shoeMaterial = standard(customization.shoes)
    mesh(new THREE.BoxGeometry(.2, .1, .35), shoeMaterial, [-.13, .06, -.07])
    mesh(new THREE.BoxGeometry(.2, .1, .35), shoeMaterial, [.13, .06, -.07])
  }
  avatar.add(group)
}

function Avatar3D({ member, large = false, loadDelay = 0, customization }) {
  const hostRef = useRef(null)
  const draggedRef = useRef(false)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let disposed = false
    let avatar = null
    let vrm = null
    let frame
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f1f8)
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100)
    camera.position.set(0, 1.05, large ? 3.35 : 3.75)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, large ? 1.8 : 1.25))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = large
    host.prepend(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b789d, 2.4))
    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(2.5, 4, 4)
    key.castShadow = large
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xd8c3ff, 1.2)
    rim.position.set(-3, 2, -3)
    scene.add(rim)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 48),
      new THREE.MeshStandardMaterial({ color: 0xe8dfef, roughness: 1 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    const loadTimer = window.setTimeout(() => loader.load(
      getModelUrl(member?.name),
      (gltf) => {
        if (disposed) return
        vrm = gltf.userData.vrm
        avatar = vrm.scene
        VRMUtils.removeUnnecessaryVertices(avatar)
        VRMUtils.combineSkeletons(avatar)
        VRMUtils.combineMorphs(vrm)
        avatar.rotation.y = Math.PI
        if (customization) colorizeMaterials(avatar, customization)
        const humanoid = vrm.humanoid
        const leftUpperArm = humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rightUpperArm = humanoid?.getNormalizedBoneNode('rightUpperArm')
        const leftLowerArm = humanoid?.getNormalizedBoneNode('leftLowerArm')
        const rightLowerArm = humanoid?.getNormalizedBoneNode('rightLowerArm')
        if (leftUpperArm) leftUpperArm.rotation.z = 1.22
        if (rightUpperArm) rightUpperArm.rotation.z = -1.22
        if (leftLowerArm) leftLowerArm.rotation.z = .08
        if (rightLowerArm) rightLowerArm.rotation.z = -.08
        avatar.traverse((object) => {
          object.frustumCulled = false
          if (object.isMesh) { object.castShadow = large; object.receiveShadow = true }
        })
        scene.add(avatar)
        const box = new THREE.Box3().setFromObject(avatar)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const targetHeight = member?.name === '아들' ? 1.48 : member?.name === '엄마' ? 1.7 : 1.78
        const scale = targetHeight / Math.max(size.y, .01)
        avatar.scale.setScalar(scale)
        if (customization) {
          applyStyle(avatar, vrm, customization, scale)
          addAccessory(avatar, customization, scale)
        }
        avatar.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
        setStatus('ready')
      },
      undefined,
      (error) => { console.error('VRM 아바타 로드 오류:', error); if (!disposed) setStatus('error') },
    ), loadDelay)

    const pointers = new Map()
    let lastX = 0
    let lastY = 0
    let pinchDistance = 0
    const distance = () => {
      const points = [...pointers.values()]
      return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0
    }
    const pointerDown = (event) => {
      event.stopPropagation()
      draggedRef.current = false
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      lastX = event.clientX
      lastY = event.clientY
      if (pointers.size === 2) pinchDistance = distance()
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const pointerMove = (event) => {
      if (!pointers.has(event.pointerId) || !avatar) return
      const previous = pointers.get(event.pointerId)
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (Math.abs(event.clientX - previous.x) + Math.abs(event.clientY - previous.y) > 2) draggedRef.current = true
      if (pointers.size === 1) {
        avatar.rotation.y += (event.clientX - lastX) * .018
        avatar.rotation.x = THREE.MathUtils.clamp(avatar.rotation.x + (event.clientY - lastY) * .004, -.18, .18)
        lastX = event.clientX
        lastY = event.clientY
      } else if (pointers.size === 2) {
        const next = distance()
        camera.position.z = THREE.MathUtils.clamp(camera.position.z - (next - pinchDistance) * .012, 2.25, 5.8)
        pinchDistance = next
      }
    }
    const pointerUp = (event) => { event.stopPropagation(); pointers.delete(event.pointerId) }
    const wheel = (event) => { event.preventDefault(); camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * .005, 2.25, 5.8) }
    const stopClick = (event) => { if (draggedRef.current) { event.preventDefault(); event.stopPropagation() } }
    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', pointerDown)
    canvas.addEventListener('pointermove', pointerMove)
    canvas.addEventListener('pointerup', pointerUp)
    canvas.addEventListener('pointercancel', pointerUp)
    canvas.addEventListener('wheel', wheel, { passive: false })
    canvas.addEventListener('click', stopClick)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    const clock = new THREE.Clock()
    const render = () => { vrm?.update(clock.getDelta()); renderer.render(scene, camera); frame = requestAnimationFrame(render) }
    render()

    return () => {
      disposed = true
      window.clearTimeout(loadTimer)
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerUp)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('click', stopClick)
      if (avatar) VRMUtils.deepDispose(avatar)
      floor.geometry.dispose()
      floor.material.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [large, loadDelay, member?.name, customization])

  return (
    <div ref={hostRef} className={large ? 'avatar-viewer avatar-viewer--large' : 'avatar-viewer'}>
      {status === 'loading' && <span className="avatar-viewer__loading">3D 아바타 불러오는 중…</span>}
      {status === 'error' && <span className="avatar-viewer__loading">아바타를 표시하지 못했습니다.</span>}
      <small>{large ? '한 손가락 회전 · 두 손가락 확대' : '↔ 돌려보세요'}</small>
    </div>
  )
}

export default Avatar3D
