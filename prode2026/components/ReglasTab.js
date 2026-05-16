export default function ReglasTab() {
  return (
    <div style={{padding:'12px 14px', overflowY:'auto', flex:1}}>

      {/* PUNTOS */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          ⭐ Sistema de puntos
        </div>
        {[
          ['⭐ Resultado exacto','Acertás el marcador exacto (ej: pronosticás 2-1 y sale 2-1)','3 pts','#22c98a','rgba(34,201,138,.18)'],
          ['✓ Resultado parcial','Acertás quién gana o si es empate, pero no el marcador exacto (ej: pronosticás 2-0 y sale 3-1)','1 pt','#60a5fa','rgba(96,165,250,.18)'],
          ['✗ Sin puntos','No acertás ni el ganador ni el marcador (ej: pronosticás 2-0 y sale 0-1)','0 pts','#5e6480','rgba(255,255,255,.07)'],
          ['🟡 Partido x2','Cuando el admin activa el doble puntaje en un partido, los puntos se multiplican por 2','x2','#f0b429','rgba(240,180,41,.18)'],
        ].map(([title,desc,pts,color,bg])=>(
          <div key={title} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 15px',borderBottom:'1px solid var(--bd)',gap:10}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:2}}>{title}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{desc}</div>
            </div>
            <span style={{padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:700,color,background:bg,whiteSpace:'nowrap',flexShrink:0}}>{pts}</span>
          </div>
        ))}
        <div style={{padding:'10px 15px',fontSize:11,color:'var(--tx3)',borderTop:'1px solid var(--bd)'}}>
          Solo valen los 90 minutos reglamentarios. El alargue y los penales no cuentan.
        </div>
      </div>

      {/* CIERRES */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          🔒 Fechas de cierre
        </div>
        {[
          ['📅 Fecha 1 y 2','Cierra el Miércoles 11 de Junio a las 15:30hs (Argentina)','30 min antes del primer partido'],
          ['📅 Fecha 3','Cierra el Miércoles 24 de Junio a las 15:30hs (Argentina)','30 min antes del primer partido'],
        ].map(([title,date,note])=>(
          <div key={title} style={{padding:'12px 15px',borderBottom:'1px solid var(--bd)'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:3}}>{title}</div>
            <div style={{fontSize:12,color:'var(--em)',fontWeight:500,marginBottom:2}}>{date}</div>
            <div style={{fontSize:11,color:'var(--tx3)'}}>{note}</div>
          </div>
        ))}
        <div style={{padding:'10px 15px',background:'rgba(239,83,80,0.07)',display:'flex',gap:8,alignItems:'flex-start'}}>
          <span style={{fontSize:14,flexShrink:0}}>⚠️</span>
          <span style={{fontSize:11,color:'var(--red)',fontWeight:500}}>El cierre es automático. Una vez cerrado el plazo, no se pueden cargar ni modificar pronósticos. El que no carga a tiempo pierde la oportunidad.</span>
        </div>
      </div>

      {/* DESEMPATE */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          🏅 Criterio de desempate
        </div>
        {[
          ['1°','Mayor cantidad de resultados exactos (plenos ⭐)'],
          ['2°','Mayor cantidad de resultados parciales (✓)'],
          ['3°','Orden de inscripción (se registró primero en el prode)'],
        ].map(([num,desc])=>(
          <div key={num} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 15px',borderBottom:'1px solid var(--bd)'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--em)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{num}</div>
            <span style={{fontSize:13,color:'var(--tx2)'}}>{desc}</span>
          </div>
        ))}
      </div>

      {/* OTRAS REGLAS */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          📋 Otras reglas
        </div>
        {[
          ['🔒','Una vez guardados, los pronósticos no se pueden modificar'],
          ['⚽','Si un partido se suspende o no se juega, no suma ni resta puntos'],
          ['⏱️','Solo valen los 90 minutos. Alargue y penales no cuentan'],
          ['👤','Cada jugador tiene una clave personal e intransferible'],
          ['📊','El ranking se actualiza automáticamente tras cada partido'],
                ].map(([icon,text])=>(
          <div key={text} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 15px',borderBottom:'1px solid var(--bd)',fontSize:13,color:'var(--tx2)'}}>
            <span style={{fontSize:15,flexShrink:0}}>{icon}</span>{text}
          </div>
        ))}
      </div>

      {/* PREMIOS */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          💰 Premios
        </div>
        {[
          ['🥇 Campeón Fecha 1','Mejor puntaje al término de la primera fecha','$40.000','var(--gold)'],
          ['🏆 Campeón General','Mejor puntaje al final de fase de grupos','Resto del pozo','#f87171'],
        ].map(([title,desc,prize,color])=>(
          <div key={title} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 15px',borderBottom:'1px solid var(--bd)',gap:10}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:2}}>{title}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{desc}</div>
            </div>
            <span style={{fontSize:13,fontWeight:700,color,whiteSpace:'nowrap',flexShrink:0}}>{prize}</span>
          </div>
        ))}
        <div style={{padding:'10px 15px',fontSize:11,color:'var(--tx3)'}}>
          Inscripción: $10.000 por jugador. Los montos exactos se confirman antes del inicio del torneo.
        </div>
      </div>

      <div style={{padding:'12px 14px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,fontSize:11,color:'var(--tx3)',textAlign:'center'}}>
        ⚽ Mundial 2026 · USA, Canadá y México · 11 Jun — 19 Jul 2026
      </div>
    </div>
  )
}
