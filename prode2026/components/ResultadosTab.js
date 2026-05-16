import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, flagUrl } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)

export default function ResultadosTab({ adminUnlocked }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [selGrp, setSelGrp] = useState('A')
  const [editing, setEditing] = useState(null)
  const [editL, setEditL] = useState('')
  const [editV, setEditV] = useState('')
  const [editDouble, setEditDouble] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    setLoading(true)
    const { data } = await supabase.from('match_results').select('*')
    const map = {}
    if (data) data.forEach(r => { map[r.match_key] = { l: r.goals_local, v: r.goals_visitor, double: r.is_double } })
    setResults(map); setLoading(false)
  }

  async function saveResult(grp, idx, match) {
    if (editL===''||editV==='') return
    setSaving(true)
    const key = grp+idx
    const payload = {
      match_key:key, group_key:grp, match_index:idx,
      local_team:match[0], visitor_team:match[1],
      goals_local:parseInt(editL), goals_visitor:parseInt(editV),
      is_double: editDouble
    }
    if (results[key]) {
      await supabase.from('match_results').update(payload).eq('match_key', key)
    } else {
      await supabase.from('match_results').insert(payload)
    }
    await loadResults(); setSaving(false); setEditing(null)
  }

  async function deleteResult(key) {
    if (!confirm('¿Borrar este resultado?')) return
    await supabase.from('match_results').delete().eq('match_key', key)
    await loadResults()
  }

  const totalPlayed = Object.keys(results).length
  const grpData = GROUPS[selGrp]

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1}}>
      {adminUnlocked && (
        <div className="info-bar ok" style={{margin:'10px 14px 0',flexShrink:0}}>
          <span>⚙️ <strong style={{color:'var(--em)'}}>Modo admin</strong> — Cargá resultados y activá x2 en partidos especiales</span>
        </div>
      )}
      {!adminUnlocked && (
        <div className="info-bar" style={{margin:'10px 14px 0',flexShrink:0}}>
          <span>⚽ Resultados oficiales · {totalPlayed} partido{totalPlayed!==1?'s':''} jugado{totalPlayed!==1?'s':''}</span>
        </div>
      )}
      <div className="pills" style={{flexShrink:0}}>
        {GROUP_KEYS.map(g => {
          const played = GROUPS[g].matches.filter((_,i)=>results[g+i]).length
          return (
            <button key={g} className={`pill ${selGrp===g?'active':''}`} onClick={()=>setSelGrp(g)}>
              Grupo {g}{played>0&&<span style={{fontSize:9,marginLeft:2,opacity:.8}}> {played}/6</span>}
            </button>
          )
        })}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        <div className="grp-block">
          <div className="grp-bar">
            <h3>Grupo {selGrp} <span className="cnt">{GROUPS[selGrp].matches.filter((_,i)=>results[selGrp+i]).length}/6 jugados</span></h3>
          </div>
          <div className="matches-sec" style={{paddingTop:10}}>
            {loading && <div className="loading">Cargando...</div>}
            {!loading && grpData.matches.map((match, i) => {
              const key = selGrp+i
              const res = results[key]
              const isEditing = editing===key
              return (
                <div key={key} className="mrow" style={{flexDirection:'column',alignItems:'stretch',gap:6,padding:'10px 0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div className="mteam">
                      {flagUrl(match[0])?<img src={flagUrl(match[0])} className="mflag" alt={match[0]}/>:<span style={{fontSize:20}}>🏳</span>}
                      <span className="mnm">{match[0]}</span>
                      <span className="mdate">{match[2]}</span>
                    </div>
                    <div className="sbox">
                      {res ? (
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <div className="lkd" style={{background:'var(--em-bg)',color:'var(--tx)'}}>{res.l}</div>
                          <span className="sdash">-</span>
                          <div className="lkd" style={{background:'var(--em-bg)',color:'var(--tx)'}}>{res.v}</div>
                          {res.double && <span style={{fontSize:11,fontWeight:700,color:'var(--gold)',marginLeft:2}}>x2</span>}
                        </div>
                      ) : (
                        <div style={{fontSize:11,color:'var(--tx3)',padding:'7px 10px',background:'var(--bg4)',borderRadius:7,whiteSpace:'nowrap'}}>
                          {adminUnlocked?'Sin resultado':'No jugado'}
                        </div>
                      )}
                    </div>
                    <div className="mteam">
                      {flagUrl(match[1])?<img src={flagUrl(match[1])} className="mflag" alt={match[1]}/>:<span style={{fontSize:20}}>🏳</span>}
                      <span className="mnm">{match[1]}</span>
                    </div>
                  </div>
                  {adminUnlocked && !isEditing && (
                    <div style={{display:'flex',justifyContent:'center',gap:8}}>
                      <button className="btn-sm" onClick={()=>{setEditing(key);setEditL(res?.l??'');setEditV(res?.v??'');setEditDouble(res?.double||false)}}>
                        {res?'✏️ Editar':'➕ Cargar resultado'}
                      </button>
                      {res&&<button className="btn-danger" onClick={()=>deleteResult(key)} style={{fontSize:11,padding:'4px 10px'}}>🗑</button>}
                    </div>
                  )}
                  {adminUnlocked && isEditing && (
                    <div style={{padding:'10px',background:'var(--bg3)',borderRadius:8,display:'flex',flexDirection:'column',gap:10}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        <span style={{fontSize:11,color:'var(--tx2)'}}>{match[0]}</span>
                        <input className="sinp" type="number" min="0" max="20" value={editL} onChange={e=>setEditL(e.target.value)} style={{width:44}}/>
                        <span className="sdash">-</span>
                        <input className="sinp" type="number" min="0" max="20" value={editV} onChange={e=>setEditV(e.target.value)} style={{width:44}}/>
                        <span style={{fontSize:11,color:'var(--tx2)'}}>{match[1]}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'var(--tx2)'}}>
                          <input type="checkbox" checked={editDouble} onChange={e=>setEditDouble(e.target.checked)}
                            style={{width:16,height:16,accentColor:'var(--gold)'}}/>
                          <span>🟡 Partido <strong style={{color:'var(--gold)'}}>x2</strong> (puntos dobles)</span>
                        </label>
                      </div>
                      <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                        <button className="btn" onClick={()=>saveResult(selGrp,i,match)} disabled={saving}
                          style={{padding:'7px 20px',fontSize:12,width:'auto'}}>{saving?'...':'✓ Guardar'}</button>
                        <button onClick={()=>setEditing(null)}
                          style={{background:'transparent',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:16}}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
