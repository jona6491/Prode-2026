// pages/api/sync-results.js
// Esta ruta corre en el servidor de Vercel y llama a football-data.org
// Luego guarda los resultados en Supabase

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const WC_COMPETITION = 'WC'

// Mapa de nombres de equipos football-data → nombres en tu app
const TEAM_NAME_MAP = {
  'Mexico': 'México',
  'South Korea': 'Corea del Sur',
  'South Africa': 'Sudáfrica',
  'Czechia': 'Rep. Checa',
  'Canada': 'Canadá',
  'Switzerland': 'Suiza',
  'Qatar': 'Qatar',
  'Bosnia-Herzegovina': 'Bosnia y Herz.',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Scotland': 'Escocia',
  'Haiti': 'Haití',
  'United States': 'Estados Unidos',
  'Australia': 'Australia',
  'Paraguay': 'Paraguay',
  'Turkey': 'Turquía',
  'Germany': 'Alemania',
  'Ecuador': 'Ecuador',
  'Ivory Coast': 'Costa de Marfil',
  'Curaçao': 'Curazao',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Tunisia': 'Túnez',
  'Sweden': 'Suecia',
  'Belgium': 'Bélgica',
  'Iran': 'Irán',
  'Egypt': 'Egipto',
  'New Zealand': 'Nueva Zelanda',
  'Spain': 'España',
  'Uruguay': 'Uruguay',
  'Cape Verde Islands': 'Cabo Verde', 
  'Saudi Arabia': 'Arabia Saudita',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Norway': 'Noruega',
  'Iraq': 'Iraq',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'Congo DR': 'RD del Congo',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
  'England': 'Inglaterra',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá',
}

// Mapa de partidos: "LocalTeam vs VisitorTeam" → match_key
// Basado en el fixture real del Mundial 2026
const MATCH_KEY_MAP = {
  'México-Sudáfrica': 'A0',
  'Corea del Sur-Rep. Checa': 'A1',
  'Rep. Checa-Sudáfrica': 'A2',
  'México-Corea del Sur': 'A3',
  'Rep. Checa-México': 'A4',
  'Sudáfrica-Corea del Sur': 'A5',
  'Canadá-Bosnia y Herz.': 'B0',
  'Qatar-Suiza': 'B1',
  'Suiza-Bosnia y Herz.': 'B2',
  'Canadá-Qatar': 'B3',
  'Suiza-Canadá': 'B4',
  'Bosnia y Herz.-Qatar': 'B5',
  'Brasil-Marruecos': 'C0',
  'Haití-Escocia': 'C1',
  'Escocia-Marruecos': 'C2',
  'Brasil-Haití': 'C3',
  'Escocia-Brasil': 'C4',
  'Marruecos-Haití': 'C5',
  'Estados Unidos-Paraguay': 'D0',
  'Australia-Turquía': 'D1',
  'Turquía-Paraguay': 'D2',
  'Estados Unidos-Australia': 'D3',
  'Turquía-Estados Unidos': 'D4',
  'Paraguay-Australia': 'D5',
  'Alemania-Curazao': 'E0',
  'Costa de Marfil-Ecuador': 'E1',
  'Alemania-Costa de Marfil': 'E2',
  'Ecuador-Curazao': 'E3',
  'Ecuador-Alemania': 'E4',
  'Curazao-Costa de Marfil': 'E5',
  'Países Bajos-Japón': 'F0',
  'Suecia-Túnez': 'F1',
  'Países Bajos-Suecia': 'F2',
  'Túnez-Japón': 'F3',
  'Japón-Suecia': 'F4',
  'Túnez-Países Bajos': 'F5',
  'Irán-Nueva Zelanda': 'G0',
  'Bélgica-Egipto': 'G1',
  'Bélgica-Irán': 'G2',
  'Nueva Zelanda-Egipto': 'G3',
  'Egipto-Irán': 'G4',
  'Nueva Zelanda-Bélgica': 'G5',
  'España-Cabo Verde': 'H0',
  'Arabia Saudita-Uruguay': 'H1',
  'España-Arabia Saudita': 'H2',
  'Uruguay-Cabo Verde': 'H3',
  'Cabo Verde-Arabia Saudita': 'H4',
  'Uruguay-España': 'H5',
  'Francia-Senegal': 'I0',
  'Iraq-Noruega': 'I1',
  'Francia-Iraq': 'I2',
  'Noruega-Senegal': 'I3',
  'Noruega-Francia': 'I4',
  'Senegal-Iraq': 'I5',
  'Argentina-Argelia': 'J0',
  'Austria-Jordania': 'J1',
  'Argentina-Austria': 'J2',
  'Jordania-Argelia': 'J3',
  'Argelia-Austria': 'J4',
  'Jordania-Argentina': 'J5',
  'Portugal-RD del Congo': 'K0',
  'Uzbekistán-Colombia': 'K1',
  'Portugal-Uzbekistán': 'K2',
  'Colombia-RD del Congo': 'K3',
  'Colombia-Portugal': 'K4',
  'RD del Congo-Uzbekistán': 'K5',
  'Inglaterra-Croacia': 'L0',
  'Ghana-Panamá': 'L1',
  'Inglaterra-Ghana': 'L2',
  'Panamá-Croacia': 'L3',
  'Panamá-Inglaterra': 'L4',
  'Croacia-Ghana': 'L5',
}

function mapTeamName(apiName) {
  return TEAM_NAME_MAP[apiName] || apiName
}

function getMatchKey(homeTeam, awayTeam) {
  const key = `${homeTeam}-${awayTeam}`
  return MATCH_KEY_MAP[key] || null
}

function getGroupKey(matchKey) {
  return matchKey ? matchKey[0] : null
}

function getMatchIndex(matchKey) {
  return matchKey ? parseInt(matchKey[1]) : null
}
export default async function handler(req, res) {

if (req.method !== 'GET' && req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed' })
}

  if (!FOOTBALL_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en variables de entorno' })
  }

  try {
    // Fetch matches from football-data.org
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${WC_COMPETITION}/matches?stage=GROUP_STAGE`,
      { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
    )

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: `API error: ${text}` })
    }

    const data = await response.json()
    const matches = data.matches || []

    // Filter only finished matches
    const finished = matches.filter(m => m.status === 'FINISHED')
    // Obtener partidos ya sincronizados
const { data: existingResults, error: existingError } = await supabase
  .from('match_results')
  .select('match_key')

if (existingError) {
  return res.status(500).json({ error: existingError.message })
}

const existingKeys = new Set(
  (existingResults || []).map(r => r.match_key)
)

console.log('PARTIDOS FINALIZADOS:')

for (const m of finished) {
  console.log(
    m.homeTeam?.name,
    'vs',
    m.awayTeam?.name,
    '-',
    m.score?.fullTime?.home,
    ':',
    m.score?.fullTime?.away
  )
}
    if (finished.length === 0) {
      return res.status(200).json({ message: 'No hay partidos finalizados aún', synced: 0 })
    }

    let synced = 0
    let skipped = 0
    const errors = []

    for (const match of finished) {
      const homeTeam = mapTeamName(match.homeTeam?.name || '')
      const awayTeam = mapTeamName(match.awayTeam?.name || '')
      const goalsHome = match.score?.fullTime?.home
      const goalsAway = match.score?.fullTime?.away

      if (goalsHome === null || goalsHome === undefined || goalsAway === null || goalsAway === undefined) {
        skipped++
        continue
      }

      const matchKey = getMatchKey(homeTeam, awayTeam)

if (!matchKey) {
  const msg = `No se encontró match_key para: ${homeTeam} vs ${awayTeam}`
  console.log(msg)
  errors.push(msg)
  skipped++
  continue
}

// Si ya existe en la base, lo salteamos
if (existingKeys.has(matchKey)) {
  console.log(`SKIP ${matchKey}: ya sincronizado`)
  skipped++
  continue
}

const groupKey = getGroupKey(matchKey)
const matchIndex = getMatchIndex(matchKey)

      // Upsert into match_results
      const { error } = await supabase
        .from('match_results')
        .upsert({
          match_key: matchKey,
          group_key: groupKey,
          match_index: matchIndex,
          local_team: homeTeam,
          visitor_team: awayTeam,
          goals_local: goalsHome,
          goals_visitor: goalsAway,
        }, { onConflict: 'match_key' })

     if (error) {
  console.log(`ERROR ${matchKey}:`, error.message)
} else {
  console.log(
    `OK ${matchKey}: ${homeTeam} ${goalsHome}-${goalsAway} ${awayTeam}`
  )
  synced++
}
    }
await supabase
  .from('admin_config')
  .update({
    last_sync_at: new Date().toISOString()
  })
  .eq('id', 1)
    return res.status(200).json({
      message: `Sincronización completada`,
      synced,
      skipped,
      total_finished: finished.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
