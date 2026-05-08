import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, flagUrl, calcStandings } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)

export default function PronosticosTab({ player, onSaved }) {
  const [selGrp, setSelGrp] = useState('A')
  const [predictions, setPredictions] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(player?.saved || false)
  const inputRefs = useRef({})

  useEffect(() => {
    if (player?.saved) { setSaved(true); loadSavedPredictions() }
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
    const newPreds = { ...predictions }
    GROUPS[grp].matches.forEach((_, i) => delete newPreds[grp + i])
    setPredictions(newPreds)
  }

  function countFilled(grp) {
    return GROUPS[grp].matches.filter((_, i) => {
      const p = predictions[grp + i]
      return p && p.l !== '' && p.v !== ''
    }).length
  }

  function totalFilled() { return GROUP_KEYS.reduce((acc, g) => acc + countFilled(g), 0) }

  async function handleSave() {
    const total = GROUP_KEYS.length * 6
    if (totalFilled() < total) {
      const missing = GROUP_KEYS
        .filter(g => countFilled(g) < 6)
        .map(g => `• Grupo ${g}: faltan ${6 - countFilled(g)} partido${6 - countFilled(g) > 1 ? 's' : ''}`)
        .join('\n')
      alert(`🚨 ¡CARNERO! Te falta cargar:\n\n${missing}`)
      return
    }
    setSaving(true)
    const rows = []
    GROUP_KEYS.forEach(grp => {
      GROUPS[grp].matches.forEach((match, i) => {
        const p = predictions[grp + i]
        rows.push({
          player_id: player.id, match_key: grp + i, group_key: grp,
          match_index: i, local_team: match[0], visitor_team: match[1],
          goals_local: p.l, goals_visitor: p.v
        })
      })
    })
    const { error } = await supabase.from('predictions').insert(rows)
    if (error) { alert('Error al guardar. Intentá de nuevo.'); setSaving(false); return }
    const { data: updatedPlayer } = await supabase.from('players').update({ saved: true }).eq('id', player.id).select().single()
    setSaving(false); setSaved(true)
    if (updatedPlayer) onSaved(updatedPlayer)
  }

  const standings = calcStandings(selGrp, predictions)
  const grpData = GROUPS[selGrp]

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1}}>
      <div className={`info-bar ${saved?'ok':''}`}>
        <span>{saved
          ? '✅ Pronósticos guardados. ¡Seguí el ranking!'
          : `🔒 Completá todos los grupos y guardá. ${totalFilled()}/72 cargados.`}
        </span>
      </div>
      <div className="pills">
        {GROUP_KEYS.map(g => (
          <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={()=>setSelGrp(g)}>Grupo {g}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',paddingBottom:saved?12:0}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>Grupo {selGrp} <span className="cnt">{countFilled(selGrp)}/6</span></h3>
            {!saved && <button className="btn-danger" onClick={()=>clearGroup(selGrp)}>🗑 Limpiar</button>}
          </div>
          <div style={{padding:'8px 13px 0'}}>
            <table className="pos-tbl" style={{width:'100%'}}>
              <thead>
                <tr>
                  <th className="tl" style={{width:22}}>#</th>
                  <th className="tl">Equipo</th>
                  <th>PTS</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr key={row.team} className={i<2?'clf':''}>
                    <td className="tl" style={{color:i<2?'var(--em)':'var(--tx3)'}}>{i+1}</td>
                    <td className="tl">
                      <div className="eq-cell">
                        {flagUrl(row.team)?<img src={flagUrl(row.team)} className="flag-img" alt={row.team} />:<span>🏳</span>}
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
          <div className="matches-sec">
            <div className="matches-lbl">Partidos — Grupo {selGrp}</div>
            {grpData.matches.map((match, i) => {
              const key = selGrp + i
              const pred = predictions[key]
              return (
                <div key={key} className="mrow">
                  <div className="mteam">
                    {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]} />:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[0]}</span>
                    <span className="mdate">{match[2]}</span>
                  </div>
                  <div className="sbox">
                    {saved?(
                      <><div className="lkd">{pred?.l??'-'}</div><span className="sdash">-</span><div className="lkd">{pred?.v??'-'}</div></>
                    ):(
                      <>
                        <input className="sinp" type="number" min="0" max="20" value={pred?.l??''} placeholder="0"
                          ref={el=>inputRefs.current[`l_${key}`]=el} onChange={e=>handleInput(selGrp,i,'l',e.target.value)} />
                        <span className="sdash">-</span>
                        <input className="sinp" type="number" min="0" max="20" value={pred?.v??''} placeholder="0"
                          ref={el=>inputRefs.current[`v_${key}`]=el} onChange={e=>updatePred(selGrp,i,'v',e.target.value)} />
                      </>
                    )}
                  </div>
                  <div className="mteam">
                    {flagUrl(match[1])?<img src={flagUrl(match[1])} className="mflag" alt={match[1]} />:<span style={{fontSize:20}}>🏳</span>}
                    <span className="mnm">{match[1]}</span>
                    <span className="mdate">{match[2]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {!saved && (
        <div className="save-footer">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving?'⏳ Guardando...':`💾 Guardar todos mis pronósticos (${totalFilled()}/72)`}
          </button>
        </div>
      )}
    </div>
  )
}
