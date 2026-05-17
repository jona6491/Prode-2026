import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, PHASE_MATCHES, flagUrl, calcStandings, isPhaseOpen, getDeadlineText } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)
const PHASES = ['f1', 'f2', 'f3']
const PHASE_LABELS = { f1: 'Fecha 1', f2: 'Fecha 2', f3: 'Fecha 3' }

export default function PronosticosTab({ player, onSaved }) {
  const [selGrp, setSelGrp] = useState('A')
  const [predictions, setPredictions] = useState({})
  const [saving, setSaving] = useState(null) // 'f1' | 'f2' | 'f3' | null
  const [savedPhases, setSavedPhases] = useState({
    f1: player?.saved_f1 || player?.saved || false,
    f2: player?.saved_f2 || false,
    f3: player?.saved_f3 || player?.saved_late || false,
  })
  const [activePhase, setActivePhase] = useState('f1')
  const inputRefs = useRef({})

  useEffect(() => {
    // Determine which phase to show by default
    if (!isPhaseOpen('f1')) {
      if (!isPhaseOpen('f2')) setActivePhase('f3')
      else setActivePhase('f2')
    }
    // Load saved predictions if any phase is saved
    if (player?.saved || player?.saved_early || player?.saved_late || player?.saved_f1 || player?.saved_f2 || player?.saved_f3) {
      loadSavedPredictions()
    }
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
    const phaseKeys = PHASE_MATCHES[activePhase]
    const newPreds = { ...predictions }
    GROUPS[grp].matches.forEach((_, i) => {
      const key = grp + i
      if (phaseKeys.includes(key)) delete newPreds[key]
    })
    setPredictions(newPreds)
  }

  function countFilledInPhase(grp, phase) {
    const phaseKeys = PHASE_MATCHES[phase]
    return GROUPS[grp].matches.filter((_, i) => {
      const key = grp + i
      if (!phaseKeys.includes(key)) return false
      const p = predictions[key]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function totalFilledInPhase(phase) {
    return PHASE_MATCHES[phase].filter(k => {
      const p = predictions[k]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function matchesInPhaseForGroup(grp, phase) {
    return GROUPS[grp].matches.filter((_, i) => PHASE_MATCHES[phase].includes(grp + i)).length
  }

  async function handleSave(phase) {
    const phaseKeys = PHASE_MATCHES[phase]
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

    setSaving(phase)
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
    if (error) { alert('Error al guardar. Intentá de nuevo.'); setSaving(null); return }

    const updateData = {
      saved: true,
      [`saved_${phase}`]: true,
      ...(phase === 'f1' || phase === 'f2' ? { saved_early: true } : { saved_late: true })
    }

    const { data: updatedPlayer } = await supabase
      .from('players').update(updateData).eq('id', player.id).select().single()

    setSaving(null)
    setSavedPhases(prev => ({ ...prev, [phase]: true }))
    if (updatedPlayer) onSaved(updatedPlayer)
  }

  const phaseKeys = PHASE_MATCHES[activePhase]
  const phaseSaved = savedPhases[activePhase]
  const phaseOpen = isPhaseOpen(activePhase)
  const standings = calcStandings(selGrp, predictions)
  const grpData = GROUPS[selGrp]

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1}}>
      {/* Phase tabs */}
      <div style={{display:'flex', background:'var(--bg2)', borderBottom:'1px solid var(--bd)', flexShrink:0}}>
        {PHASES.map(ph => {
          const open = isPhaseOpen(ph)
          const saved = savedPhases[ph]
          return (
            <button key={ph} onClick={() => setActivePhase(ph)}
              style={{flex:1, padding:'10px 4px', fontSize:12, fontWeight:600, background:'none', border:'none',
                borderBottom: activePhase===ph ? '2px solid var(--em)' : '2px solid transparent',
                color: activePhase===ph ? 'var(--em)' : 'var(--tx2)', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5}}>
              {PHASE_LABELS[ph]}
              {saved && <span style={{fontSize:11}}>✅</span>}
              {!open && !saved && <span style={{fontSize:11}}>🔒</span>}
            </button>
          )
        })}
      </div>

      {/* Info bar */}
      <div className={`info-bar ${phaseSaved ? 'ok' : ''}`} style={{margin:'10px 14px 0', flexShrink:0}}>
        {phaseSaved
          ? <span>✅ {PHASE_LABELS[activePhase]} guardada. ¡Seguí el ranking!</span>
          : !phaseOpen
          ? <span>🔒 El plazo para {PHASE_LABELS[activePhase]} ya cerró.</span>
          : <span>🔒 Cierre: <strong>{getDeadlineText(activePhase)}</strong> · {totalFilledInPhase(activePhase)}/{phaseKeys.length} cargados</span>
        }
      </div>

      {/* Group pills */}
      <div className="pills" style={{flexShrink:0}}>
        {GROUP_KEYS.map(g => (
          <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={() => setSelGrp(g)}>
            Grupo {g}
          </button>
        ))}
      </div>

      <div style={{flex:1, overflowY:'auto', paddingBottom: (!phaseSaved && phaseOpen) ? 0 : 12}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>
              Grupo {selGrp} · {PHASE_LABELS[activePhase]}
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
            <div className="matches-lbl">Partidos — {PHASE_LABELS[activePhase]} · Grupo {selGrp}</div>
            {grpData.matches.map((match, i) => {
              const key = selGrp + i
              if (!phaseKeys.includes(key)) return null
              const pred = predictions[key]
              return (
                <div key={key} className="mrow">
                  <div className="mteam">
                    {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]}/>:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[0]}</span>
                    <span className="mdate">{match[2]}</span>
                  </div>
                  <div className="sbox">
                    {(phaseSaved || !phaseOpen) ? (
                      <><div className="lkd">{pred?.l??'-'}</div><span className="sdash">-</span><div className="lkd">{pred?.v??'-'}</div></>
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
          <button className="btn" onClick={() => handleSave(activePhase)} disabled={saving !== null}>
            {saving === activePhase
              ? '⏳ Guardando...'
              : `💾 Guardar ${PHASE_LABELS[activePhase]} (${totalFilledInPhase(activePhase)}/${phaseKeys.length})`
            }
          </button>
        </div>
      )}
    </div>
  )
}
