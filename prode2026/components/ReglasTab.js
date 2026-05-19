export default function ReglasTab() {
  return (
    <div style={{padding:'12px 14px', overflowY:'auto', flex:1}}>

      {/* AVISO CIERRE - primero */}
      <div style={{background:'rgba(239,83,80,0.07)',border:'1px solid rgba(239,83,80,0.25)',borderRadius:11,padding:'14px 16px',marginBottom:10,display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--red)',marginBottom:4}}>El cierre es automático</div>
          <div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.6}}>Una vez cerrados los plazos, no se pueden cargar ni modificar pronósticos. El que no carga a tiempo pierde la oportunidad.</div>
        </div>
      </div>

      {/* PREMIOS - segundo */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          💰 Premios
        </div>
        {[
          ['🥇 Campeón Fecha 1','Mejor puntaje al término de la primera fecha','$40.000','var(--gold)'],
          ['🏆 Campeón Fase de Grupos','Mejor puntaje al final de las 3 fechas','80% resto','var(--em)'],
          ['🥈 Segundo Fase de Grupos','Segundo mejor puntaje al final de las 3 fechas','20% resto','var(--em)'],
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
          Inscripción: $10.000 por jugador. · ALIAS: JONA.7
        </div>
      </div>

      {/* FECHAS DE CIERRE */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          🔒 Fechas de cierre
        </div>
        {[
          ['📅 Fecha 1','Miércoles 11 de Junio — 15:30hs','30 min antes del primer partido de Fecha 1'],
          ['📅 Fecha 2','Miércoles 18 de Junio — 12:30hs','30 min antes del primer partido de Fecha 2'],
          ['📅 Fecha 3','Miércoles 24 de Junio — 15:30hs','30 min antes del primer partido de Fecha 3'],
        ].map(([title,date,note])=>(
          <div key={title} style={{padding:'12px 15px',borderBottom:'1px solid var(--bd)'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:3}}>{title}</div>
            <div style={{fontSize:13,color:'var(--em)',fontWeight:600,marginBottom:2}}>{date}</div>
            <div style={{fontSize:11,color:'var(--tx3)'}}>{note}</div>
          </div>
        ))}
      </div>

      {/* PUNTOS */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          ⭐ Sistema de puntos
        </div>
        {[
          ['⭐ Resultado exacto','Acertás el marcador exacto (ej: pronosticás 2-1 y sale 2-1)','3 pts','#22c98a','rgba(34,201,138,.18)'],
          ['✓ Resultado parcial','Acertás quién gana o si es empate, pero no el marcador exacto','1 pt','#60a5fa','rgba(96,165,250,.18)'],
          ['✗ Sin puntos','No acertás ni el ganador ni el marcador','0 pts','#5e6480','rgba(255,255,255,.07)'],
        ].map(([title,desc,pts,color,bg])=>(
          <div key={title} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 15px',borderBottom:'1px solid var(--bd)',gap:10}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:2}}>{title}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{desc}</div>
            </div>
            <span style={{padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:700,color,background:bg,whiteSpace:'nowrap',flexShrink:0}}>{pts}</span>
          </div>
        ))}
      </div>

      {/* DESEMPATE */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'11px 15px',borderBottom:'1px solid var(--bd)',fontSize:14,fontWeight:700,color:'var(--tx)'}}>
          🏅 Criterio de desempate
        </div>
        {[
          ['1°','Mayor cantidad de resultados exactos'],
          ['2°','Mayor cantidad de resultados parciales'],
          ['3°','Orden de inscripción (quien se registró primero)'],
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
          ['👤','Cada jugador tiene una clave personal e intransferible'],
          ['📊','El ranking se actualiza automáticamente tras cada fecha'],
        
        ].map(([icon,text])=>(
          <div key={text} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 15px',borderBottom:'1px solid var(--bd)',fontSize:13,color:'var(--tx2)'}}>
            <span style={{fontSize:15,flexShrink:0}}>{icon}</span>{text}
          </div>
        ))}
      </div>
     </div>
    </div>
  )
}
