import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, PHASE_MATCHES, flagUrl, calcStandings, isPhaseOpen, getDeadlineText } from '../lib/worldcup'

// Export PDF function - runs entirely in browser
async function exportToPDF(player, predictions, savedKeys) {
console.log("PDF iniciado")
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
  const GROUP_DATA = {
    A:[['México','Sudáfrica'],['Corea del Sur','Rep. Checa'],['Rep. Checa','Sudáfrica'],['México','Corea del Sur'],['Rep. Checa','México'],['Sudáfrica','Corea del Sur']],
    B:[['Canadá','Bosnia y Herz.'],['Qatar','Suiza'],['Suiza','Bosnia y Herz.'],['Canadá','Qatar'],['Suiza','Canadá'],['Bosnia y Herz.','Qatar']],
    C:[['Brasil','Marruecos'],['Haití','Escocia'],['Escocia','Marruecos'],['Brasil','Haití'],['Escocia','Brasil'],['Marruecos','Haití']],
    D:[['Estados Unidos','Paraguay'],['Australia','Turquía'],['Turquía','Paraguay'],['Estados Unidos','Australia'],['Turquía','Estados Unidos'],['Paraguay','Australia']],
    E:[['Alemania','Curazao'],['Costa de Marfil','Ecuador'],['Alemania','Costa de Marfil'],['Ecuador','Curazao'],['Ecuador','Alemania'],['Curazao','Costa de Marfil']],
    F:[['Países Bajos','Japón'],['Suecia','Túnez'],['Países Bajos','Suecia'],['Túnez','Japón'],['Japón','Suecia'],['Túnez','Países Bajos']],
    G:[['Irán','Nueva Zelanda'],['Bélgica','Egipto'],['Bélgica','Irán'],['Nueva Zelanda','Egipto'],['Egipto','Irán'],['Nueva Zelanda','Bélgica']],
    H:[['España','Cabo Verde'],['Arabia Saudita','Uruguay'],['España','Arabia Saudita'],['Uruguay','Cabo Verde'],['Cabo Verde','Arabia Saudita'],['Uruguay','España']],
    I:[['Francia','Senegal'],['Iraq','Noruega'],['Francia','Iraq'],['Noruega','Senegal'],['Noruega','Francia'],['Senegal','Iraq']],
    J:[['Argentina','Argelia'],['Austria','Jordania'],['Argentina','Austria'],['Jordania','Argelia'],['Argelia','Austria'],['Jordania','Argentina']],
    K:[['Portugal','RD del Congo'],['Uzbekistán','Colombia'],['Portugal','Uzbekistán'],['Colombia','RD del Congo'],['Colombia','Portugal'],['RD del Congo','Uzbekistán']],
    L:[['Inglaterra','Croacia'],['Ghana','Panamá'],['Inglaterra','Ghana'],['Panamá','Croacia'],['Panamá','Inglaterra'],['Croacia','Ghana']],
  }

  // Header
  doc.setFillColor(34, 34, 34)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PRODE MUNDIAL 2026 — MIS PRONÓSTICOS', 105, 8, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${player.team_name}  (${player.name})  ·  Generado: ${new Date().toLocaleDateString('es-AR')}`, 105, 14, { align: 'center' })

  doc.setTextColor(0, 0, 0)

  let y = 26
  const colW = 90
  const rowH = 5.5
  let col = 0

  GROUPS.forEach(g => {
    const x = col === 0 ? 10 : 110

    // Group header
    doc.setFillColor(50, 50, 50)
    doc.rect(x, y-4, colW, 5.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(`GRUPO ${g}`, x+2, y)
    doc.setTextColor(0,0,0)

    GROUP_DATA[g].forEach((match, i) => {
      const key = g + i
      const pred = predictions[key]
      const isSaved = savedKeys.has(key)
      const ry = y + 5 + i * rowH

      // Alternating row bg
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(x, ry-3.5, colW, rowH, 'F')
      }

      doc.setFontSize(6.5)
      doc.setFont('helvetica', isSaved ? 'bold' : 'normal')
      doc.setTextColor(isSaved ? 0 : 120, isSaved ? 0 : 120, isSaved ? 0 : 120)

      // Local
      doc.text(match[0], x+2, ry)

      // Score or pending
      if (pred) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(34, 100, 34)
        doc.text(`${pred.l} - ${pred.v}`, x+colW/2, ry, { align: 'center' })
      } else {
        doc.setTextColor(180, 180, 180)
        doc.text('- - -', x+colW/2, ry, { align: 'center' })
      }

      // Visitor
      doc.setFont('helvetica', isSaved ? 'bold' : 'normal')
      doc.setTextColor(isSaved ? 0 : 120, isSaved ? 0 : 120, isSaved ? 0 : 120)
      doc.text(match[1], x+colW-2, ry, { align: 'right' })
    })

    y_after_group = y + 5 + 6 * rowH + 4

    if (col === 0) {
      col = 1
    } else {
      col = 0
      y = y_after_group
      if (y > 260) {
        doc.addPage()
        y = 15
      }
    }
  })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(150,150,150)
    doc.text('RECONTRAOFICIAL FIFA  ·  prode-2026-mmnl.vercel.app  ·  3 pts exacto / 1 pt ganador', 105, 290, { align: 'center' })
  }

  doc.save(`pronósticos_${player.team_name.replace(/\s/g,'_')}.pdf`)
}
const GROUP_KEYS = Object.keys(GROUPS)
const PHASES = ['f1', 'f2', 'f3']
const PHASE_LABELS = { f1: 'Fecha 1', f2: 'Fecha 2', f3: 'Fecha 3' }

export default function PronosticosTab({ player, onSaved }) {
  const [selGrp, setSelGrp] = useState('A')
  const [predictions, setPredictions] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedPhases, setSavedPhases] = useState({
    f1: false,
    f2: player?.saved_f2 || false,
    f3: player?.saved_f3 || player?.saved_late || false,
  })
  // savedKeys tracks which match_keys are already in DB
  const [savedKeys, setSavedKeys] = useState(new Set())
  const [activePhase, setActivePhase] = useState('f1')
  const inputRefs = useRef({})

  useEffect(() => {
    if (!isPhaseOpen('f1')) {
      if (!isPhaseOpen('f2')) setActivePhase('f3')
      else setActivePhase('f2')
    }
    loadSavedPredictions()
  }, [player])

  async function loadSavedPredictions() {
    const { data } = await supabase.from('predictions').select('*').eq('player_id', player.id)
    if (data && data.length > 0) {
      const map = {}
      const keys = new Set()
      data.forEach(d => {
        map[d.match_key] = { l: d.goals_local, v: d.goals_visitor }
        keys.add(d.match_key)
      })
      setPredictions(map)
      setSavedKeys(keys)
    }
  }

  function updatePred(grp, idx, side, val) {
    const key = grp + idx
    // Can't edit already saved keys
    if (savedKeys.has(key)) return
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
      if (phaseKeys.includes(key) && !savedKeys.has(key)) delete newPreds[key]
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

  function matchesInPhaseForGroup(grp, phase) {
    return GROUPS[grp].matches.filter((_, i) => PHASE_MATCHES[phase].includes(grp + i)).length
  }

  function isGroupComplete(grp, phase) {
    return countFilledInPhase(grp, phase) === matchesInPhaseForGroup(grp, phase)
  }

  function isGroupSaved(grp, phase) {
    const phaseKeys = PHASE_MATCHES[phase]
    const grpPhaseKeys = GROUPS[grp].matches.map((_, i) => grp + i).filter(k => phaseKeys.includes(k))
    return grpPhaseKeys.every(k => savedKeys.has(k))
  }

  function totalFilledInPhase(phase) {
    return PHASE_MATCHES[phase].filter(k => {
      const p = predictions[k]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function totalSavedInPhase(phase) {
    return PHASE_MATCHES[phase].filter(k => savedKeys.has(k)).length
  }

  function incompleteGroupsInPhase(phase) {
    return GROUP_KEYS.filter(g => {
      if (isGroupSaved(g, phase)) return false
      return !isGroupComplete(g, phase) && countFilledInPhase(g, phase) > 0 ||
             countFilledInPhase(g, phase) < matchesInPhaseForGroup(g, phase)
    }).filter(g => !isGroupSaved(g, phase) && countFilledInPhase(g, phase) < matchesInPhaseForGroup(g, phase))
  }

  function newCompleteGroupsInPhase(phase) {
    return GROUP_KEYS.filter(g => isGroupComplete(g, phase) && !isGroupSaved(g, phase))
  }

  async function handleSave(phase) {
    const completeGroups = newCompleteGroupsInPhase(phase)
    const incomplete = incompleteGroupsInPhase(phase)

    if (completeGroups.length === 0 && incomplete.length > 0) {
      alert(`🚨 ¡CARNERO! No tenés ningún grupo completo para guardar.\n\nCompletá al menos un grupo entero antes de guardar.`)
      return
    }

    if (incomplete.length > 0) {
      const names = incomplete.map(g => `• Grupo ${g}: faltan ${matchesInPhaseForGroup(g, phase) - countFilledInPhase(g, phase)} partido${matchesInPhaseForGroup(g, phase) - countFilledInPhase(g, phase) > 1 ? 's' : ''}`).join('\n')
      const proceed = window.confirm(`⚠️ CARNERO! ⚠️faltan grupos y NO se van a guardar, no te olvides:\n\n${names}\n\n¿Guardás igual los grupos completos?`)
      if (!proceed) return
    }

    setSaving(true)
    const rows = []
    completeGroups.forEach(grp => {
      GROUPS[grp].matches.forEach((match, i) => {
        const key = grp + i
        if (!PHASE_MATCHES[phase].includes(key)) return
        const p = predictions[key]
        rows.push({
          player_id: player.id, match_key: key, group_key: grp,
          match_index: i, local_team: match[0], visitor_team: match[1],
          goals_local: p.l, goals_visitor: p.v, save_phase: phase
        })
      })
    })

    const { error } = await supabase.from('predictions').insert(rows)
    if (error) { alert('Error al guardar. Intentá de nuevo.'); setSaving(false); return }

    // Check if all groups in phase are now saved
    const newSavedKeys = new Set([...savedKeys, ...rows.map(r => r.match_key)])
    const allSaved = PHASE_MATCHES[phase].every(k => newSavedKeys.has(k))

    const updateData = {
      saved: true,
      ...(allSaved ? { [`saved_${phase}`]: true } : {}),
      ...((phase === 'f1' || phase === 'f2') ? { saved_early: true } : { saved_late: true })
    }

    const { data: updatedPlayer } = await supabase
      .from('players').update(updateData).eq('id', player.id).select().single()

    setSavedKeys(newSavedKeys)
    if (allSaved) setSavedPhases(prev => ({ ...prev, [phase]: true }))
    setSaving(false)
    if (updatedPlayer) onSaved(updatedPlayer)
  }

  const phaseKeys = PHASE_MATCHES[activePhase]
  const phaseOpen = isPhaseOpen(activePhase)
  const phaseSaved = savedPhases[activePhase]
  const standings = calcStandings(selGrp, predictions)
  const grpData = GROUPS[selGrp]
  const savedInPhase = totalSavedInPhase(activePhase)
  const totalInPhase = phaseKeys.length

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1}}>
      {/* Phase tabs */}
      <div style={{display:'flex', background:'var(--bg2)', borderBottom:'1px solid var(--bd)', flexShrink:0}}>
        {PHASES.map(ph => {
          const open = isPhaseOpen(ph)
          const saved = savedPhases[ph]
          const savedCount = totalSavedInPhase(ph)
          const total = PHASE_MATCHES[ph].length
          return (
            <button key={ph} onClick={() => setActivePhase(ph)}
              style={{flex:1, padding:'10px 4px', fontSize:12, fontWeight:600, background:'none', border:'none',
                borderBottom: activePhase===ph ? '2px solid var(--em)' : '2px solid transparent',
                color: activePhase===ph ? 'var(--em)' : 'var(--tx2)', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5}}>
              {PHASE_LABELS[ph]}
              {saved
                ? <span style={{fontSize:11}}>✅</span>
                : savedCount > 0
                ? <span style={{fontSize:10, color:'var(--gold)'}}>{savedCount}/{total}</span>
                : !open
                ? <span style={{fontSize:11}}>🔒</span>
                : null
              }
            </button>
          )
        })}
      </div>

      {/* Info bar */}
      <div className={`info-bar ${phaseSaved ? 'ok' : ''}`} style={{margin:'10px 14px 0', flexShrink:0}}>
        {phaseSaved
          ? <span>✅ {PHASE_LABELS[activePhase]} completa. ¡Seguí el ranking!</span>
          : !phaseOpen
          ? <span>🔒 El plazo para {PHASE_LABELS[activePhase]} ya cerró.</span>
          : savedInPhase > 0
          ? <span>💾 {savedInPhase}/{totalInPhase} partidos guardados · Cierre: <strong>{getDeadlineText(activePhase)}</strong></span>
          : <span>🔒 Cierre: <strong>{getDeadlineText(activePhase)}</strong> · Podés guardar por partes</span>
        }
      </div>

      {/* Group pills */}
      <div className="pills" style={{flexShrink:0}}>
        {GROUP_KEYS.map(g => {
          const saved = isGroupSaved(g, activePhase)
          const complete = isGroupComplete(g, activePhase)
          const filled = countFilledInPhase(g, activePhase)
          const total = matchesInPhaseForGroup(g, activePhase)
          const incomplete = filled > 0 && !complete && !saved
          return (
            <button key={g}
              onClick={() => setSelGrp(g)}
              style={{
                padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                border: incomplete ? '1px solid rgba(239,83,80,0.6)' : '1px solid var(--bd2)',
                background: selGrp===g
                  ? (incomplete ? 'rgba(239,83,80,0.8)' : 'var(--em)')
                  : (incomplete ? 'rgba(239,83,80,0.12)' : 'transparent'),
                color: selGrp===g ? '#fff' : incomplete ? 'var(--red)' : saved ? 'var(--em)' : 'var(--tx2)',
              }}>
              {g} {saved ? '✅' : complete ? '✓' : filled > 0 ? `${filled}/${total}` : ''}
            </button>
          )
        })}
      </div>

      <div style={{flex:1, overflowY:'auto', paddingBottom: phaseOpen && !phaseSaved ? 0 : 12}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>
              Grupo {selGrp} · {PHASE_LABELS[activePhase]}
              <span className="cnt">{countFilledInPhase(selGrp, activePhase)}/{matchesInPhaseForGroup(selGrp, activePhase)}</span>
              {isGroupSaved(selGrp, activePhase) && <span style={{fontSize:11, color:'var(--em)'}}>✅ guardado</span>}
            </h3>
            {phaseOpen && !isGroupSaved(selGrp, activePhase) && (
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
              const isSaved = savedKeys.has(key)
              const locked = isSaved || !phaseOpen
              return (
                <div key={key} className="mrow" style={{opacity: locked && !isSaved ? 0.6 : 1}}>
                  <div className="mteam">
                    {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]}/>:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[0]}</span>
                    <span className="mdate">{match[2]}</span>
                  </div>
                  <div className="sbox">
                    {locked ? (
                      <>
                        <div className="lkd">{pred?.l??'-'}</div>
                        <span className="sdash">-</span>
                        <div className="lkd">{pred?.v??'-'}</div>
                      </>
                    ) : (
                      <>
                        <input className="sinp" type="number" min="0" max="20"
                          value={pred?.l??''} placeholder="-"
                          ref={el=>inputRefs.current[`l_${key}`]=el}
                          onChange={e=>handleInput(selGrp,i,'l',e.target.value)}/>
                        <span className="sdash">-</span>
                        <input className="sinp" type="number" min="0" max="20"
                          value={pred?.v??''} placeholder="-"
                          ref={el=>inputRefs.current[`v_${key}`]=el}
                          onChange={e=>updatePred(selGrp,i,'v',e.target.value)}/>
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
{Object.keys(predictions).length > 0 && (
  <div style={{padding:'8px 14px 0', flexShrink:0}}>
    <button onClick={() => exportToPDF(player, predictions, savedKeys)}
      style={{width:'100%', padding:'9px', background:'transparent',
        border:'1px solid var(--bd2)', borderRadius:8, fontSize:12,
        fontWeight:600, color:'var(--tx2)', cursor:'pointer', fontFamily:'inherit'}}>
      📄 Descargar mis pronósticos en PDF
    </button>
  </div>
)}
      {phaseOpen && !phaseSaved && (
        <div className="save-footer">
          <button className="btn" onClick={() => handleSave(activePhase)} disabled={saving}>
            {saving
              ? '⏳ Guardando...'
              : newCompleteGroupsInPhase(activePhase).length > 0
              ? `💾 Guardar grupos completos de ${PHASE_LABELS[activePhase]} (${newCompleteGroupsInPhase(activePhase).length} grupos)`
              : `💾 Guardar ${PHASE_LABELS[activePhase]}`
            }
          </button>
        </div>
      )}
    </div>
  )
}
