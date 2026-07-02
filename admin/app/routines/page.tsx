import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ok:      { label: 'OK',      color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  warning: { label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  error:   { label: 'Error',   color: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500' },
}

const ROUTINE_SCHEDULES: Record<string, string> = {
  'Wardrobe Sorter':          'Every 30 min',
  'Description Writer':       'Daily · 7am',
  'Tag & Category Manager':   'Daily · 6am',
  'Inventory QA':             'Daily · 8am',
  'Error Monitor':            'Every hour',
  'Featured Rotation':        'Deprecated',
  'Daily Content Prompts':    'Daily · 7am',
  'Daily Marketing Ideas':    'Daily · 7:05am',
  'Sweeper':                  'Every 6 hours',
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function getLogs() {
  noStore()
  const { data } = await supabaseAdmin
    .from('routine_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return data ?? []
}

export default async function RoutinesPage() {
  const logs = await getLogs()

  const latestByRoutine = new Map<string, typeof logs[number]>()
  for (const log of logs) {
    if (!latestByRoutine.has(log.routine_name)) latestByRoutine.set(log.routine_name, log)
  }

  const knownRoutines = Object.keys(ROUTINE_SCHEDULES)
  const allRoutineNames = [...new Set([...knownRoutines, ...latestByRoutine.keys()])]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Routine Activity</h1>
        <p className="text-sm text-gray-500 mt-1">Live proof of every AI routine run — this is the source of truth, not push notifications</p>
      </div>

      {/* Status cards per routine */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {allRoutineNames.map(name => {
          const log = latestByRoutine.get(name)
          const meta = log ? STATUS_META[log.status] ?? STATUS_META.ok : null
          return (
            <div key={name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">{ROUTINE_SCHEDULES[name] ?? ''}</p>
                {meta && <span className={`w-2 h-2 rounded-full ${meta.dot}`} />}
              </div>
              <p className="text-sm font-bold text-navy mb-1">{name}</p>
              {log ? (
                <>
                  <p className="text-[11px] text-gray-400 mb-1.5">{timeAgo(log.created_at)}</p>
                  <p className="text-xs text-gray-600 leading-snug line-clamp-3">{log.summary}</p>
                </>
              ) : (
                <p className="text-xs text-gray-400 italic mt-1.5">No runs logged yet</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Full chronological log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Run History</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.length === 0 && (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">No routine runs logged yet. They log here automatically every time one fires.</p>
          )}
          {logs.map(log => {
            const meta = STATUS_META[log.status] ?? STATUS_META.ok
            return (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy">{log.routine_name}</p>
                    <span className="text-[11px] text-gray-300">•</span>
                    <p className="text-[11px] text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{log.summary}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
