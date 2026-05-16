import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, EARLY_MATCHES, LATE_MATCHES, flagUrl, calcStandings, isPhaseOpen, getDeadlineText } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)

export default function PronosticosTab({ player, onSaved }) {
  const [selGrp, setSelGrp] = useState('A')
  const [predictions, setPredictions] = useState({})
  const [savingEarly, setSavingEarly] = useState(false)
  const [savingLate, setSavingLate] = useState(false)
  const [savedEarly, setSavedEarly] = useState(player?.saved_early || player?.saved || false)
  const [savedLate, setSavedLate] = useState(player?.saved_late || false)
  const [activePhase, setActivePhase] = useState('early') // 'early' or 'late'
  const inputRefs = useRef({})

  const earlyOpen = isPhaseOpen('early')
  const lateOpen = isPhaseOpen('late')

  useEffect(() => {
    if (savedEarly || savedLate) loadSavedPredictions()
    // Auto-switch to late phase if early is closed
    if (!earlyOpen && lateOpen) setActivePhase('late')
  }, [player])

  async function loadSavedPredictions() {
    const { data } = await supabase.from('predictions').select('*').eq('player_id', player.id)
    if (data) {
      const map = {}
      data.forEach(d => { map[d.match_key] = { l: d.goals_local, v: d.goals_visitor } })
      setPredictions(map)
    }
  }

  function updatePred(grp, idx, side, val) {
    const key = grp + idx
    const num = val === '' ? '' : Math.max(0, Math.min(20, parseInt(val) || 0))
    setPredictions(prev => ({ ...prev, [key]: { ...(prev[key] || { l: '', v: '' }), [side]: num } }))
  }

  function handleInput(grp, idx, side, val) {
    updatePred(grp, idx, side, val)
    if (val !== '' && side === 'l') {
      setTimeout(() => inputRefs.current[`v_${grp}${idx}`]?.focus(), 0)
    }
  }

  function clearGroup(grp) {
    const phaseKeys = activePhase === 'early' ? EARLY_MATCHES : LATE_MATCHES
    const newPreds = { ...predictions }
    GROUPS[grp].matches.forEach((_, i) => {
      const key = grp + i
      if (phaseKeys.includes(key)) delete newPreds[key]
    })
    setPredictions(newPreds)
  }

  function countFilledInPhase(grp, phase) {
    const phaseKeys = phase === 'early' ? EARLY_MATCHES : LATE_MATCHES
    return GROUPS[grp].matches.filter((_, i) => {
      const key = grp + i
      if (!phaseKeys.includes(key)) return false
      const p = predictions[key]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function totalFilledInPhase(phase) {
    const phaseKeys = phase === 'early' ? EARLY_MATCHES : LATE_MATCHES
    return phaseKeys.filter(k => {
      const p = predictions[k]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function matchesInPhaseForGroup(grp, phase) {
    const phaseKeys = phase === 'early' ? EARLY_MATCHES : LATE_MATCHES
    return GROUPS[grp].matches.filter((_, i) => phaseKeys.includes(grp + i)).length
  }

  async function handleSave(phase) {
    const phaseKeys = phase === 'early' ? EARLY_MATCHES : LATE_MATCHES
    const total = phaseKeys.length
    const filled = totalFilledInPhase(phase)
    if (filled < total) {
      const missing = GROUP_KEYS
        .filter(g => countFilledInPhase(g, phase) < matchesInPhaseForGroup(g, phase))
        .map(g => `• Grupo ${g}: faltan ${matchesInPhaseForGroup(g, phase) - countFilledInPhase(g, phase)} partido${matchesInPhaseForGroup(g, phase) - countFilledInPhase(g, phase) > 1 ? 's' : ''}`)
        .join('\n')
      alert(`🚨 ¡CARNERO! Te falta cargar:\n\n${missing}`)
      return
    }

    if (phase === 'early') setSavingEarly(true)
    else setSavingLate(true)

    const rows = []
    GROUP_KEYS.forEach(grp => {
      GROUPS[grp].matches.forEach((match, i) => {
        const key = grp + i
        if (!phaseKeys.includes(key)) return
        const p = predictions[key]
        rows.push({
          player_id: player.id, match_key: key, group_key: grp,
          match_index: i, local_team: match[0], visitor_team: match[1],
          goals_local: p.l, goals_visitor: p.v, save_phase: phase
        })
      })
    })

    const { error } = await supabase.from('predictions').insert(rows)
    if (error) { alert('Error al guardar. Intentá de nuevo.'); setSavingEarly(false); setSavingLate(false); return }

    const updateData = phase === 'early' 
      ? { saved_early: true, saved: true }
      : { saved_late: true }

    const { data: updatedPlayer } = await supabase
      .from('players').update(updateData).eq('id', player.id).select().single()

    if (phase === 'early') { setSavingEarly(false); setSavedEarly(true) }
    else { setSavingLate(false); setSavedLate(true) }
    if (updatedPlayer) onSaved(updatedPlayer)
  }

  const standings = calcStandings(selGrp, predictions)
  const grpData = GROUPS[selGrp]
  const phaseKeys = activePhase === 'early' ? EARLY_MATCHES : LATE_MATCHES
  const phaseSaved = activePhase === 'early' ? savedEarly : savedLate
  const phaseOpen = activePhase === 'early' ? earlyOpen : lateOpen

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1}}>
      {/* Phase selector */}
      <div style={{display:'flex', background:'var(--bg2)', borderBottom:'1px solid var(--bd)', flexShrink:0}}>
        {[['early','📅 Fecha 1 y 2'],['late','📅 Fecha 3']].map(([ph, label]) => {
          const open = ph === 'early' ? earlyOpen : lateOpen
          const saved = ph === 'early' ? savedEarly : savedLate
          return (
            <button key={ph} onClick={() => setActivePhase(ph)}
              style={{flex:1, padding:'10px 6px', fontSize:12, fontWeight:600, background:'none', border:'none',
                borderBottom: activePhase===ph ? '2px solid var(--em)' : '2px solid transparent',
                color: activePhase===ph ? 'var(--em)' : 'var(--tx2)', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
              {label}
              {saved && <span style={{fontSize:10, color:'var(--em)'}}>✅</span>}
              {!open && !saved && <span style={{fontSize:10, color:'var(--red)'}}>🔒</span>}
            </button>
          )
        })}
      </div>

      {/* Info bar */}
      <div className={`info-bar ${phaseSaved ? 'ok' : ''}`} style={{margin:'10px 14px 0', flexShrink:0}}>
        {phaseSaved
          ? <span>✅ {activePhase === 'early' ? 'Fecha 1 y 2 guardadas' : 'Fecha 3 guardada'}. ¡Seguí el ranking!</span>
          : !phaseOpen
          ? <span>🔒 El plazo para cargar {activePhase === 'early' ? 'Fecha 1 y 2' : 'Fecha 3'} ya cerró.</span>
          : <span>🔒 Cierre: <strong>{getDeadlineText(activePhase)}</strong> · {totalFilledInPhase(activePhase)}/{phaseKeys.length} cargados</span>
        }
      </div>

      <div className="pills" style={{flexShrink:0}}>
        {GROUP_KEYS.map(g => (
          <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={()=>setSelGrp(g)}>
            Grupo {g}
          </button>
        ))}
      </div>

      <div style={{flex:1, overflowY:'auto', paddingBottom: (!phaseSaved && phaseOpen) ? 0 : 12}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>
              Grupo {selGrp}
              <span className="cnt">{countFilledInPhase(selGrp, activePhase)}/{matchesInPhaseForGroup(selGrp, activePhase)}</span>
            </h3>
            {!phaseSaved && phaseOpen && (
              <button className="btn-danger" onClick={() => clearGroup(selGrp)}>🗑 Limpiar</button>
            )}
          </div>

          {/* Standings */}
          <div style={{padding:'8px 13px 0'}}>
            <table className="pos-tbl" style={{width:'100%'}}>
              <thead>
                <tr><th className="tl" style={{width:22}}>#</th><th className="tl">Equipo</th>
                  <th>PTS</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th></tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr key={row.team} className={i<2?'clf':''}>
                    <td className="tl" style={{color:i<2?'var(--em)':'var(--tx3)'}}>{i+1}</td>
                    <td className="tl">
                      <div className="eq-cell">
                        {flagUrl(row.team)?<img src={flagUrl(row.team)} className="flag-img" alt={row.team}/>:<span>🏳</span>}
                        <span className="eq-nm">{row.team}</span>
                      </div>
                    </td>
                    <td className={i<2?'pts':''}>{row.pts}</td>
                    <td>{row.pj}</td><td>{row.gw}</td><td>{row.emp}</td><td>{row.perd}</td>
                    <td style={{color:row.dg>0?'var(--em)':row.dg<0?'var(--red)':'var(--tx2)'}}>{row.dg>0?'+'+row.dg:row.dg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="clf-note"><div className="clf-dot"></div><span>Clasifica a 16vos de final</span></div>
          </div>

          {/* Matches */}
          <div className="matches-sec">
            <div className="matches-lbl">Partidos — Grupo {selGrp}</div>
            {grpData.matches.map((match, i) => {
              const key = selGrp + i
              const isInPhase = phaseKeys.includes(key)
              const pred = predictions[key]
              if (!isInPhase) return null
              return (
                <div key={key} className="mrow">
                  <div className="mteam">
                    {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]}/>:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[0]}</span>
                    <span className="mdate">{match[2]}</span>
                  </div>
                  <div className="sbox">
                    {(phaseSaved || !phaseOpen) ? (
                      <><div className="lkd">{pred?.l ?? '-'}</div><span className="sdash">-</span><div className="lkd">{pred?.v ?? '-'}</div></>
                    ) : (
                      <>
                        <input className="sinp" type="number" min="0" max="20" value={pred?.l??''} placeholder="0"
                          ref={el=>inputRefs.current[`l_${key}`]=el} onChange={e=>handleInput(selGrp,i,'l',e.target.value)}/>
                        <span className="sdash">-</span>
                        <input className="sinp" type="number" min="0" max="20" value={pred?.v??''} placeholder="0"
                          ref={el=>inputRefs.current[`v_${key}`]=el} onChange={e=>updatePred(selGrp,i,'v',e.target.value)}/>
                      </>
                    )}
                  </div>
                  <div className="mteam">
                    {flagUrl(match[1])?<img src={flagUrl(match[1])} className="mflag" alt={match[1]}/>:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[1]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!phaseSaved && phaseOpen && (
        <div className="save-footer">
          <button className="btn" onClick={() => handleSave(activePhase)} disabled={savingEarly || savingLate}>
            {(savingEarly || savingLate) ? '⏳ Guardando...' : `💾 Guardar ${activePhase === 'early' ? 'Fecha 1 y 2' : 'Fecha 3'} (${totalFilledInPhase(activePhase)}/${phaseKeys.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
