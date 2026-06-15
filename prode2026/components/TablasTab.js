import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUPS, flagUrl, calcStandings } from '../lib/worldcup'

const GROUP_KEYS = Object.keys(GROUPS)

// Abreviaturas de 3 letras para cada selección
const TEAM_ABBR = {
  'México':'MEX','Corea del Sur':'KOR','Sudáfrica':'RSA','Rep. Checa':'CZE',
  'Canadá':'CAN','Suiza':'SUI','Qatar':'QAT','Bosnia y Herz.':'BIH',
  'Brasil':'BRA','Marruecos':'MAR','Escocia':'SCO','Haití':'HAI',
  'Estados Unidos':'USA','Australia':'AUS','Paraguay':'PAR','Turquía':'TUR',
  'Alemania':'GER','Ecuador':'ECU','Costa de Marfil':'CIV','Curazao':'CUW',
  'Países Bajos':'NED','Japón':'JPN','Túnez':'TUN','Suecia':'SWE',
  'Bélgica':'BEL','Irán':'IRN','Egipto':'EGY','Nueva Zelanda':'NZL',
  'España':'ESP','Uruguay':'URU','Cabo Verde':'CPV','Arabia Saudita':'KSA',
  'Francia':'FRA','Senegal':'SEN','Noruega':'NOR','Iraq':'IRQ',
  'Argentina':'ARG','Argelia':'ALG','Austria':'AUT','Jordania':'JOR',
  'Portugal':'POR','RD del Congo':'COD','Uzbekistán':'UZB','Colombia':'COL',
  'Inglaterra':'ENG','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN'
}

export default function TablasTab() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    setLoading(true)
    // Solo lectura — no modifica nada
    const { data } = await supabase.from('match_results').select('*')
    const map = {}
    if (data) {
      data.forEach(r => {
        map[r.match_key] = { l: r.goals_local, v: r.goals_visitor }
      })
    }
    setResults(map)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{padding:'12px 14px', flex:1}}>
        <div className="loading">Cargando tablas...</div>
      </div>
    )
  }

  return (
    <div style={{padding:'12px 14px', overflowY:'auto', flex:1}}>
      <div style={{fontSize:11, color:'var(--tx3)', marginBottom:10, textAlign:'center'}}>
        🏆 Posiciones reales según resultados oficiales · Solo lectura
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        {GROUP_KEYS.map(g => {
          const standings = calcStandings(g, results)
          return (
            <div key={g} style={{background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden'}}>
              <div style={{padding:'6px 8px', background:'var(--bg3)', borderBottom:'1px solid var(--bd)', fontSize:11, fontWeight:700, color:'var(--tx)'}}>
                Grupo {g}
              </div>
              {standings.map((row, i) => (
                <div key={row.team} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'5px 8px',
                  borderBottom: i<standings.length-1 ? '1px solid var(--bd)' : 'none',
                  background: i<2 ? 'rgba(34,201,138,0.06)' : 'transparent'
                }}>
                  <span style={{fontSize:10, color: i<2 ? 'var(--em)' : 'var(--tx3)', width:12, flexShrink:0}}>{i+1}</span>
                  {flagUrl(row.team)
                    ? <img src={flagUrl(row.team)} alt={row.team} style={{width:16, height:12, objectFit:'cover', borderRadius:2, flexShrink:0}}/>
                    : <span style={{fontSize:12, flexShrink:0}}>🏳</span>
                  }
                  <span style={{fontSize:11, fontWeight:600, color:'var(--tx)', flex:1}}>{TEAM_ABBR[row.team] || row.team.slice(0,3).toUpperCase()}</span>
                  <span style={{fontSize:11, fontWeight:700, color:'var(--tx)', minWidth:16, textAlign:'right'}}>{row.pts}</span>
                  <span style={{fontSize:10, color: row.dg>0?'var(--em)':row.dg<0?'var(--red)':'var(--tx3)', minWidth:28, textAlign:'right'}}>
                    ({row.dg>0?'+':''}{row.dg})
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {Object.keys(results).length === 0 && (
        <div style={{marginTop:14, fontSize:11, color:'var(--tx3)', textAlign:'center', padding:'10px', background:'var(--bg2)', borderRadius:8}}>
          Todavía no hay resultados cargados. Las tablas se irán completando a medida que se jueguen los partidos.
        </div>
      )}
    </div>
  )
}
