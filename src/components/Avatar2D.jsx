import fatherCustomAvatar from '../assets/avatars/father-custom-v2.png'
import motherCustomAvatar from '../assets/avatars/mother-custom-v2.png'
import sonCustomAvatar from '../assets/avatars/son-custom-v2.png'

const skin = '#f1c5a3'
const skinShade = '#d99b7f'

function Face({ expression, isWoman }) {
  const happy = expression === 'smile'
  const angry = expression === 'angry'
  const sad = expression === 'sad'
  const surprised = expression === 'surprised'
  return (
    <g>
      <ellipse cx="100" cy="76" rx="28" ry="35" fill={skin} />
      <circle cx="72" cy="77" r="5" fill={skin}/><circle cx="128" cy="77" r="5" fill={skin}/>
      <path d={angry ? 'M80 65l10-3M110 62l10 3' : sad ? 'M80 64q5-4 10 0M110 64q5-4 10 0' : 'M80 63q5-2 10 0M110 63q5-2 10 0'} stroke="#5b413a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {happy ? <><path d="M81 72q5-6 10 0M109 72q5-6 10 0" stroke="#403536" strokeWidth="2.4" fill="none"/><path d="M89 88q11 10 22 0" stroke="#b45568" strokeWidth="2.6" fill="none"/></>
        : surprised ? <><ellipse cx="86" cy="72" rx="2.7" ry="3.5" fill="#403536"/><ellipse cx="114" cy="72" rx="2.7" ry="3.5" fill="#403536"/><ellipse cx="100" cy="89" rx="5" ry="6" fill="#b45568"/></>
        : <><ellipse cx="86" cy="72" rx="2.5" ry="3.2" fill="#403536"/><ellipse cx="114" cy="72" rx="2.5" ry="3.2" fill="#403536"/><path d={sad ? 'M91 92q9-7 18 0' : angry ? 'M92 90h16' : 'M92 88q8 5 16 0'} stroke="#b45568" strokeWidth="2.4" fill="none"/></>}
      {isWoman && <><path d="M80 70l-4-2M120 70l4-2" stroke="#49383a" strokeWidth="1.5"/><circle cx="82" cy="82" r="5" fill="#ef9a9a" opacity=".18"/><circle cx="118" cy="82" r="5" fill="#ef9a9a" opacity=".18"/></>}
      <path d="M99 73l-2 8 4 1" stroke={skinShade} strokeWidth="1.4" fill="none" />
    </g>
  )
}

function Hair({ style, color, memberName }) {
  const selected = style === 'basic' ? (memberName === '엄마' ? 'long' : 'short') : style
  if (selected === 'short') return <><path d="M70 78q-3-39 30-40 34 1 31 40l-7-22-12-9-17-3-17 10z" fill={color}/><path d="M75 50q23-23 48-2-27-8-48 15z" fill={color} opacity=".82"/></>
  if (selected === 'bun') return <><circle cx="100" cy="35" r="12" fill={color}/><path d="M69 82q-5-43 31-44 37 1 32 45l-8 20-5-48-19-11-19 12-5 47z" fill={color}/></>
  return <path d="M68 82q-5-44 32-45 38 2 33 46l-7 42-13-22 6-48-19-11-19 12 6 48-13 21z" fill={color}/>
}

function Avatar2D({ member, customization, large = false }) {
  const c = customization
  if (member?.name === '아빠') {
    return (
      <div className={large ? 'avatar-2d avatar-2d--large avatar-2d--image' : 'avatar-2d avatar-2d--image'}>
        <img src={fatherCustomAvatar} alt="아빠 2D 아바타" />
      </div>
    )
  }
  if (member?.name === '엄마') {
    return (
      <div className={large ? 'avatar-2d avatar-2d--large avatar-2d--image' : 'avatar-2d avatar-2d--image'}>
        <img src={motherCustomAvatar} alt="엄마 2D 아바타" />
      </div>
    )
  }
  if (member?.name === '아들') {
    return (
      <div className={large ? 'avatar-2d avatar-2d--large avatar-2d--image' : 'avatar-2d avatar-2d--image'}>
        <img src={sonCustomAvatar} alt="아들 2D 아바타" />
      </div>
    )
  }
  const bodyScale = c.body === 'slim' ? .92 : c.body === 'broad' ? 1.08 : 1
  const isSon = member?.name === '아들'
  const isWoman = member?.name === '엄마'
  const lowerColor = isWoman ? '#675d7c' : '#4d5368'
  return (
    <div className={large ? 'avatar-2d avatar-2d--large' : 'avatar-2d'}>
      <svg viewBox="0 0 200 310" role="img" aria-label={`${member?.name || '가족'}의 2D 아바타`}>
        <ellipse cx="100" cy="291" rx="40" ry="6" fill="#d8cde3" opacity=".58" />
        <g transform={isSon ? 'translate(0 20) scale(1 .93)' : undefined}>
          {c.bag === 'backpack' && <><rect x="65" y="126" width="70" height="76" rx="23" fill="#89664f"/><path d="M77 145q23-31 46 0" fill="none" stroke="#624836" strokeWidth="6"/></>}
          <g transform={`translate(${100 - 100 * bodyScale} 0) scale(${bodyScale} 1)`}>
            <path d="M94 105h12v18H94z" fill={skin}/>
            <path d="M73 120q27-14 54 0l12 85q-39 15-78 0z" fill={c.outfit}/>
            <path d="M74 127q-13 7-19 30l-8 52" stroke={c.outfit} strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M126 127q13 7 19 30l8 52" stroke={c.outfit} strokeWidth="14" strokeLinecap="round" fill="none"/>
            <path d="M47 205l-2 29M153 205l2 29" stroke={skin} strokeWidth="10" strokeLinecap="round"/>
            <circle cx="45" cy="237" r="6" fill={skin}/><circle cx="155" cy="237" r="6" fill={skin}/>
            {isWoman ? <path d="M68 199h64l10 41H58z" fill={lowerColor}/> : <path d="M65 199h70l-5 42-30-8-30 8z" fill={lowerColor}/>} 
            <path d="M78 232l-5 49M122 232l5 49" stroke={isWoman ? skin : lowerColor} strokeWidth="15" strokeLinecap="round"/>
          </g>
          <path d="M62 283q11-8 24 0" stroke={c.shoes} strokeWidth="12" strokeLinecap="round"/><path d="M114 283q13-8 24 0" stroke={c.shoes} strokeWidth="12" strokeLinecap="round"/>
          <Face expression={c.expression} isWoman={isWoman}/>
          <Hair style={c.hairStyle} color={c.hair} memberName={member?.name}/>
          {c.accessory === 'glasses' && <g fill="none" stroke="#493d49" strokeWidth="2.3"><rect x="75" y="66" width="22" height="16" rx="7"/><rect x="103" y="66" width="22" height="16" rx="7"/><path d="M97 72h6"/></g>}
          {c.accessory === 'hat' && <><path d="M73 48q5-25 27-25t27 25z" fill={c.outfit}/><ellipse cx="100" cy="48" rx="35" ry="5" fill={c.outfit}/></>}
          {c.bag === 'shoulder' && <><path d="M77 116l52 107" stroke="#a26d83" strokeWidth="4"/><rect x="118" y="203" width="35" height="30" rx="8" fill="#bd7895"/><path d="M125 211h20" stroke="#e9b6c8" strokeWidth="2"/></>}
          {c.bracelet !== 'none' && <circle cx="154" cy="224" r="7" fill="none" stroke={c.bracelet === 'gold' ? '#dfb849' : '#8768c5'} strokeWidth="3"/>}
        </g>
      </svg>
    </div>
  )
}

export default Avatar2D
