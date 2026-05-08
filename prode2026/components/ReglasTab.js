export default function ReglasTab() {
  return (
    <div style={{padding:'12px 14px', overflowY:'auto', flex:1}}>
      <div className="rules-block" style={{background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:11, overflow:'hidden', marginBottom:10}}>
        <div className="rules-h" style={{padding:'11px 15px', borderBottom:'1px solid var(--bd)', fontSize:14, fontWeight:700, color:'var(--tx)'}}>
          Sistema de puntos
        </div>
        {[
          ['⭐ Resultado exacto', 'Acertás el marcador exacto (ej: 2-1)', '3 puntos', '#22c98a', 'rgba(34,201,138,.18)'],
          ['✓ Resultado parcial', 'Acertás ganador o empate, pero no los goles', '1 punto', '#60a5fa', 'rgba(96,165,250,.18)'],
          ['✗ Fallo total', 'No acertás nada perro', '0 puntos', '#5e6480', 'rgba(255,255,255,.07)'],
        ].map(([title, desc, pts, color, bg]) => (
          <div key={title} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 15px', borderBottom:'1px solid var(--bd)', gap:10}}>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:2}}>{title}</div>
              <div style={{fontSize:11, color:'var(--tx3)'}}>{desc}</div>
            </div>
            <span style={{padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, color, background:bg, whiteSpace:'nowrap', flexShrink:0}}>
              {pts}
            </span>
          </div>
        ))}
      </div>

      <div className="rules-block" style={{background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:11, overflow:'hidden', marginBottom:10}}>
        <div style={{padding:'11px 15px', borderBottom:'1px solid var(--bd)', fontSize:14, fontWeight:700, color:'var(--tx)'}}>
          Cómo funciona
        </div>
        {[
          ['✅', 'Completás los 72 partidos de la fase de grupos'],
          ['🔒', 'Una vez guardado, no se puede modificar'],
          ['📊', 'Los puntos se actualizan automáticamente tras cada partido'],
          ['👁️', 'El ranking es visible para todos'],
          ['🏆', 'Ganador 70% Segundo 20% Tercero 10%'],
        ].map(([icon, text]) => (
          <div key={text} style={{display:'flex', alignItems:'center', gap:10, padding:'11px 15px', borderBottom:'1px solid var(--bd)', fontSize:13, color:'var(--tx2)'}}>
            <span style={{fontSize:16}}>{icon}</span> {text}
          </div>
        ))}
      </div>

      <div style={{padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:11, fontSize:14, color:'var(--tx3)', textAlign:'center'}}>
        ⚽ Mundial 2026 · USA, Canadá y México · 11 Jun — 19 Jul 2026
      </div>
    </div>
  )
}
