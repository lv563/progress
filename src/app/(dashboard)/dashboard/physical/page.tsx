'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stagger, fadeUp } from '@/lib/utils/motion'
import {
  Dumbbell, Droplets, TrendingDown, Plus, Scale, CalendarDays, X,
  Flame, Zap, Target, Trash2, Settings, Apple, Activity, Star,
  BarChart3, User, Search, Pencil, Trophy, Check,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  usePhysicalStore, FOOD_DB, FOOD_CATEGORIES, PRESET_CHALLENGES,
} from '@/stores/physical.store'
import { useAppStore } from '@/stores/app.store'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import type { MealType, DayPlan, FoodDBEntry, Challenge } from '@/stores/physical.store'

// ──────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────
const WORKOUT_TYPES = [
  { type: 'push',      name: 'Push',         desc: 'Pecho · Hombros · Tríceps',   icon: '💪', color: '#7C3AED' },
  { type: 'pull',      name: 'Pull',         desc: 'Espalda · Bíceps',            icon: '🔄', color: '#06B6D4' },
  { type: 'legs',      name: 'Legs',         desc: 'Piernas',                     icon: '🦵', color: '#10B981' },
  { type: 'cardio',    name: 'Cardio',       desc: 'Cardiovascular',              icon: '🏃', color: '#F59E0B' },
  { type: 'full-body', name: 'Full Body',    desc: 'Cuerpo completo',             icon: '🏋️', color: '#EC4899' },
  { type: 'upper',     name: 'Upper',        desc: 'Tren superior',               icon: '👐', color: '#F97316' },
  { type: 'lower',     name: 'Lower',        desc: 'Tren inferior',               icon: '🦿', color: '#84CC16' },
  { type: 'hiit',      name: 'HIIT',         desc: 'Alta intensidad',             icon: '⚡', color: '#EF4444' },
  { type: 'rest',      name: 'Descanso',     desc: 'Día de recuperación',         icon: '😴', color: '#475569' },
  { type: 'custom',    name: 'Personalizado',desc: 'Descripción libre',           icon: '✏️', color: '#8B5CF6' },
]

const MEAL_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Desayuno', icon: '🌅' },
  lunch:     { label: 'Almuerzo', icon: '☀️' },
  dinner:    { label: 'Cena',     icon: '🌙' },
  snack:     { label: 'Snacks',   icon: '🍎' },
}
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DAY_NAMES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DAY_FULL   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIFF_COLOR: Record<string, string> = { 'fácil':'#84CC16','medio':'#F59E0B','difícil':'#F97316','extremo':'#EF4444' }
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary:   'Sedentario (sin ejercicio)',
  light:       'Ligero (1-3 días/sem)',
  moderate:    'Moderado (3-5 días/sem)',
  active:      'Activo (6-7 días/sem)',
  very_active: 'Muy activo (atleta)',
}
const CHALLENGE_COLORS = ['#7C3AED','#EF4444','#10B981','#F59E0B','#06B6D4','#EC4899','#F97316','#84CC16']

function getQuickAmounts(c: Challenge): number[] {
  if (c.unit === 'seg')   return [30, 60, 90]
  if (c.unit === 'min')   return [5, 10, 15]
  if (c.unit === 'pasos') return [1000, 2500, 5000]
  if (c.unit === 'km')    return [1, 2, 3]
  if (c.dailyTarget >= 300) return [25, 50, 100]
  if (c.dailyTarget >= 100) return [10, 25, 50]
  if (c.dailyTarget >= 50)  return [5, 10, 25]
  return [5, 10, 20]
}

// ──────────────────────────────────────────────────────────
// sub-components
// ──────────────────────────────────────────────────────────
function MacroBar({ label, value, target, color, unit = 'g' }: { label: string; value: number; target: number; color: string; unit?: string }) {
  const pct  = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const over = value > target
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-xs tabular-nums" style={{ color: over ? '#EF4444' : pct >= 90 ? '#10B981' : '#94a3b8' }}>
          {Math.round(value)}{unit} / {Math.round(target)}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: over ? '#EF4444' : color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  )
}

interface ChallengeCardProps {
  challenge: Challenge; progress: number; streak: number
  onLog: (amount: number) => void; onCustomLog: () => void; onRemove: () => void
}
function ChallengeCard({ challenge: c, progress, streak, onLog, onCustomLog, onRemove }: ChallengeCardProps) {
  const pct  = Math.min(100, (progress / c.dailyTarget) * 100)
  const done = progress >= c.dailyTarget
  const circ = 2 * Math.PI * 20
  const quick = getQuickAmounts(c)
  return (
    <motion.div layout className={cn('p-4 rounded-2xl border transition-all', done ? 'bg-emerald-500/[0.07] border-emerald-500/30' : 'bg-white/[0.025] border-white/[0.06]')}>
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <motion.circle cx="24" cy="24" r="20" fill="none"
              stroke={done ? '#10B981' : c.color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ strokeDashoffset: circ }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? <Check size={14} className="text-emerald-400" /> :
              <span className="text-[9px] font-black" style={{ color: c.color }}>{Math.round(pct)}%</span>}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{c.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 tabular-nums">{progress}/{c.dailyTarget} {c.unit}</span>
            <span className="text-[10px] font-semibold px-1.5 rounded-full" style={{ background:`${DIFF_COLOR[c.difficulty]}18`, color: DIFF_COLOR[c.difficulty] }}>{c.difficulty}</span>
            {streak > 0 && <span className="text-[10px] text-orange-400">🔥 {streak}d</span>}
          </div>
        </div>
        <button onClick={onRemove} className="text-slate-700 hover:text-red-400 transition-colors shrink-0 mt-0.5"><X size={12} /></button>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden mb-3">
        <motion.div className="h-full rounded-full" style={{ background: done ? '#10B981' : c.color }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
      </div>
      {done ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-base">🏆</span>
          <span className="text-xs text-emerald-400 font-bold">¡Completado! +{c.xpReward} XP</span>
        </motion.div>
      ) : (
        <div className="flex gap-1.5">
          {quick.map(amt => (
            <motion.button key={amt} whileTap={{ scale: 0.92 }} onClick={() => onLog(amt)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background:`${c.color}18`, color: c.color, border:`1px solid ${c.color}35` }}>
              +{amt}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.92 }} onClick={onCustomLog}
            className="w-10 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs hover:text-white transition-all">
            ···
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────
// main page
// ──────────────────────────────────────────────────────────
type Tab = 'hoy' | 'nutricion' | 'entreno' | 'progreso' | 'perfil'

export default function PhysicalPage() {
  const {
    workoutSessions, measurements, completedDates, weeklyPlan,
    userProfile, waterToday, challenges,
    updateUserProfile, addWorkout, addMeasurement,
    addWater, setWater, toggleCompletedDate,
    setDayPlan, clearDayPlan, addMealItem, removeMealItem,
    addChallenge, removeChallenge, logChallenge,
    getTodayMealLogs, getTodayMacros, getDailyTargets, getWaterTarget,
    getDailyScore, getWeeklyStats, getLatestMeasurement,
    getTodayChallengeProgress, getChallengeStreak,
  } = usePhysicalStore()
  const { addXP } = useAppStore()

  const [activeTab, setActiveTab] = useState<Tab>('hoy')

  // modals
  const [workoutModal, setWorkoutModal]           = useState(false)
  const [measModal, setMeasModal]                 = useState(false)
  const [planModal, setPlanModal]                 = useState<number | null>(null)
  const [foodModal, setFoodModal]                 = useState<MealType | null>(null)
  const [profileModal, setProfileModal]           = useState(false)
  const [waterModal, setWaterModal]               = useState(false)
  const [addChallengeModal, setAddChallengeModal] = useState(false)
  const [logChallengeModal, setLogChallengeModal] = useState<Challenge | null>(null)

  // form states
  const [newWeight, setNewWeight]       = useState('')
  const [customName, setCustomName]     = useState('')
  const [selectedType, setSelectedType] = useState(WORKOUT_TYPES[0])
  const [foodSearch, setFoodSearch]     = useState('')
  const [foodCategory, setFoodCategory] = useState<string | null>(null)
  const [selectedFood, setSelectedFood] = useState<FoodDBEntry | null>(null)
  const [foodQty, setFoodQty]           = useState('')
  const [manualMode, setManualMode]     = useState(false)
  const [manualEntry, setManualEntry]   = useState({ name:'', calories:'', protein:'', carbs:'', fats:'', fiber:'' })
  const [waterInput, setWaterInput]     = useState('')
  const [logAmount, setLogAmount]       = useState('')
  const [challengePresetTab, setChallengePresetTab] = useState<'presets' | 'custom'>('presets')
  const [customChallenge, setCustomChallenge] = useState({ name:'', icon:'💪', dailyTarget:'', unit:'reps', difficulty:'medio', color: CHALLENGE_COLORS[0] })
  const [profileForm, setProfileForm]   = useState({
    weight: String(userProfile.weight || ''), height: String(userProfile.height || ''),
    age: String(userProfile.age || ''), sex: userProfile.sex,
    activityLevel: userProfile.activityLevel, goal: userProfile.goal,
  })

  // derived
  const todayDow    = new Date().getDay()
  const todayStr    = format(new Date(), 'yyyy-MM-dd')
  const targets     = getDailyTargets()
  const macros      = getTodayMacros()
  const waterTarget = getWaterTarget()
  const score       = getDailyScore()
  const weekStats   = getWeeklyStats()
  const latest      = getLatestMeasurement()
  const todayLogs   = getTodayMealLogs()
  const profileSet  = userProfile.weight > 0 && userProfile.height > 0
  const todayProgress = getTodayChallengeProgress()

  const todayDone = completedDates.includes(todayStr) ||
    workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === todayStr && s.completed)

  const dayStatus = score.total >= 95 ? { label:'Día Perfecto 🏆', color:'#10B981', bg:'bg-emerald-500/10 border-emerald-500/20' } :
    score.total >= 80 ? { label:'Día Bueno ✅', color:'#7C3AED', bg:'bg-violet-500/10 border-violet-500/20' } :
    score.total >= 60 ? { label:'Día Regular ⚡', color:'#F59E0B', bg:'bg-amber-500/10 border-amber-500/20' } :
    { label:'Día Perdido 😔', color:'#EF4444', bg:'bg-red-500/10 border-red-500/20' }

  // food search
  const searchResults = useMemo(() => {
    let pool = FOOD_DB
    if (foodCategory) { const ids = FOOD_CATEGORIES[foodCategory]?.ids ?? []; pool = pool.filter(f => ids.includes(f.id)) }
    if (foodSearch.length < 2) return foodCategory ? pool.slice(0, 15) : []
    const q = foodSearch.toLowerCase()
    return pool.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10)
  }, [foodSearch, foodCategory])

  // monthly gym calendar
  const now = new Date()
  const calYear = now.getFullYear(); const calMonth = now.getMonth()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const gymDaysMonth = useMemo(() => {
    let count = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = format(new Date(calYear, calMonth, d), 'yyyy-MM-dd')
      if (completedDates.includes(ds) || workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === ds && s.completed)) count++
    }
    return count
  }, [completedDates, workoutSessions, daysInMonth, calYear, calMonth])

  const isGymDay = (day: number) => {
    const ds = format(new Date(calYear, calMonth, day), 'yyyy-MM-dd')
    return completedDates.includes(ds) || workoutSessions.some(s => new Date(s.date).toISOString().slice(0, 10) === ds && s.completed)
  }

  const weightData = measurements.slice(0, 10).reverse().map((m, i) => ({ i: i + 1, peso: m.weight ?? 0 }))

  const getDayDate = (dow: number) => { const d = new Date(); d.setDate(d.getDate() + (dow - todayDow)); return d.toISOString().slice(0, 10) }
  const isDayDone  = (dow: number) => {
    const ds = getDayDate(dow)
    if (completedDates.includes(ds)) return true
    const t = new Date(ds + 'T12:00:00')
    return workoutSessions.some(s => new Date(s.date).toDateString() === t.toDateString() && s.completed)
  }

  const recommendations = useMemo(() => {
    const recs: { icon: string; text: string; foods?: string[] }[] = []
    if (targets.protein - macros.protein > 20) recs.push({ icon:'🥩', text:`Te faltan ${Math.round(targets.protein - macros.protein)}g de proteína hoy.`, foods:['Pechuga de pollo','Atún','Huevos','Yogurt griego'] })
    if (targets.fiber - macros.fiber > 10) recs.push({ icon:'🥦', text:'Necesitas más fibra hoy.', foods:['Avena','Habichuelas','Brócoli','Aguacate'] })
    if (waterTarget - waterToday > 0.5) recs.push({ icon:'💧', text:`Te faltan ${(waterTarget - waterToday).toFixed(1)}L de agua.` })
    if (!todayDone) recs.push({ icon:'💪', text: weeklyPlan[todayDow] ? `Hoy toca: ${weeklyPlan[todayDow].name}` : 'No has entrenado hoy.' })
    return recs
  }, [targets, macros, waterTarget, waterToday, todayDone, weeklyPlan, todayDow])

  const tInsights = useMemo(() => {
    const t: { icon: string; text: string; level: 'boost'|'info'|'warn' }[] = []
    if (todayDone) t.push({ icon:'⚡', text:'Los ejercicios compuestos (sentadillas, peso muerto) generaron un pico de testosterona.', level:'boost' })
    else t.push({ icon:'🏋️', text:'El entrenamiento de fuerza incrementa la testosterona 15-25%. ¡Haz tu sesión hoy!', level:'warn' })
    if (macros.fats < targets.fats * 0.6 && macros.calories > 0) t.push({ icon:'🥑', text:'Grasas bajas. Las grasas saludables son precursores directos de testosterona.', level:'warn' })
    else t.push({ icon:'🥚', text:'Las grasas saludables y el colesterol son esenciales para sintetizar testosterona.', level:'info' })
    t.push({ icon:'🛌', text:'70% de la producción de testosterona ocurre durante el sueño profundo. Duerme 7-9 horas.', level:'info' })
    t.push({ icon:'🦪', text:'Zinc: carnes rojas, mariscos o semillas de calabaza — cofactor clave de la T.', level:'info' })
    if (macros.protein >= targets.protein * 0.85) t.push({ icon:'💪', text:'Buena ingesta de proteína. Mantener masa muscular protege la testosterona a largo plazo.', level:'boost' })
    t.push({ icon:'☀️', text:'Vitamina D (15-20 min de sol diario) se correlaciona con niveles más altos de testosterona.', level:'info' })
    return t
  }, [todayDone, macros, targets])

  // handlers
  const handleAddFood = () => {
    if (!foodModal) return
    if (manualMode) {
      if (!manualEntry.name && !manualEntry.calories) return
      addMealItem(foodModal, { name: manualEntry.name||'Comida personalizada', quantity:1, unit:'porción', calories:Number(manualEntry.calories)||0, protein:Number(manualEntry.protein)||0, carbs:Number(manualEntry.carbs)||0, fats:Number(manualEntry.fats)||0, fiber:Number(manualEntry.fiber)||0 })
    } else {
      if (!selectedFood || !foodQty) return
      const qty = Number(foodQty); const s = qty / selectedFood.per
      addMealItem(foodModal, { name:`${selectedFood.name} (${qty} ${selectedFood.unit})`, quantity:qty, unit:selectedFood.unit, calories:Math.round(selectedFood.cal*s), protein:Math.round(selectedFood.pro*s*10)/10, carbs:Math.round(selectedFood.car*s*10)/10, fats:Math.round(selectedFood.fat*s*10)/10, fiber:Math.round(selectedFood.fib*s*10)/10 })
    }
    setFoodModal(null); setFoodSearch(''); setFoodCategory(null); setSelectedFood(null); setFoodQty(''); setManualMode(false)
    setManualEntry({ name:'', calories:'', protein:'', carbs:'', fats:'', fiber:'' })
  }

  const handleSaveProfile = () => {
    updateUserProfile({ weight:Number(profileForm.weight)||0, height:Number(profileForm.height)||0, age:Number(profileForm.age)||0, sex:profileForm.sex, activityLevel:profileForm.activityLevel, goal:profileForm.goal })
    setProfileModal(false)
  }

  const saveDayPlan = () => {
    if (planModal === null) return
    const plan: DayPlan = { type:selectedType.type, name:selectedType.type==='custom'?(customName||'Personalizado'):selectedType.name, icon:selectedType.icon }
    setDayPlan(planModal, plan); setPlanModal(null)
  }

  const openPlanModal = (day: number) => {
    const ex = weeklyPlan[day]; const found = WORKOUT_TYPES.find(t => t.type === ex?.type)
    setSelectedType(found ?? WORKOUT_TYPES[0]); setCustomName(ex?.name ?? ''); setPlanModal(day)
  }

  const handleLogChallenge = (c: Challenge, amount: number) => {
    logChallenge(c.id, amount)
    const newTotal = (todayProgress[c.id] ?? 0) + amount
    if (newTotal >= c.dailyTarget) addXP(c.xpReward, `Reto: ${c.name}`)
  }

  const handleAddPreset = (preset: typeof PRESET_CHALLENGES[0]) => {
    if (!challenges.some(c => c.name === preset.name)) addChallenge(preset)
    setAddChallengeModal(false)
  }

  const handleAddCustomChallenge = () => {
    if (!customChallenge.name || !customChallenge.dailyTarget) return
    addChallenge({ name:customChallenge.name, icon:customChallenge.icon, category:'fuerza', dailyTarget:Number(customChallenge.dailyTarget), unit:customChallenge.unit, difficulty:customChallenge.difficulty as Challenge['difficulty'], color:customChallenge.color, xpReward:Math.round(Number(customChallenge.dailyTarget)/10)+10 })
    setAddChallengeModal(false)
    setCustomChallenge({ name:'', icon:'💪', dailyTarget:'', unit:'reps', difficulty:'medio', color:CHALLENGE_COLORS[0] })
  }

  const handleGymCheckIn = () => {
    if (!todayDone) addXP(30, 'Gym Check-in')
    toggleCompletedDate(todayStr)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Dumbbell size={24} className="text-emerald-400" /> Físico</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sistema de salud y rendimiento</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => { setProfileForm({ weight:String(userProfile.weight||''), height:String(userProfile.height||''), age:String(userProfile.age||''), sex:userProfile.sex, activityLevel:userProfile.activityLevel, goal:userProfile.goal }); setProfileModal(true) }} variant="ghost" size="sm"><User size={14} /> Perfil</Button>
          <Button onClick={() => setMeasModal(true)} variant="ghost" size="sm"><Scale size={14} /> Peso</Button>
          <Button onClick={() => setWorkoutModal(true)} variant="glow" size="sm"><Plus size={14} /> Entreno</Button>
        </div>
      </motion.div>

      {/* Score bar */}
      <motion.div variants={fadeUp}>
        <div className={cn('rounded-2xl px-5 py-4 border flex items-center gap-4', dayStatus.bg)}>
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="28" cy="28" r="23" fill="none" stroke={dayStatus.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 23}`} strokeDashoffset={`${2 * Math.PI * 23 * (1 - score.total / 100)}`}
                style={{ transition:'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-white">{score.total}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-lg leading-tight">{dayStatus.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">Score de Salud Físico</p>
            <div className="flex gap-3 mt-2 flex-wrap text-[10px]">
              <span style={{ color: score.workout===30?'#10B981':'#64748b' }}>💪 {score.workout}/30</span>
              <span style={{ color: score.protein>=25?'#10B981':'#64748b' }}>🥩 {score.protein}/30</span>
              <span style={{ color: score.water>=18?'#10B981':'#64748b' }}>💧 {score.water}/20</span>
              <span style={{ color: score.calories>=8?'#10B981':'#64748b' }}>🔥 {score.calories}/10</span>
              <span style={{ color: score.fiber>=8?'#10B981':'#64748b' }}>🌿 {score.fiber}/10</span>
            </div>
          </div>
          {!profileSet && (
            <button onClick={() => setProfileModal(true)} className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all">
              Config. perfil
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.05] overflow-x-auto">
        {([['hoy','🏠 Hoy'],['nutricion','🥗 Nutrición'],['entreno','💪 Entreno'],['progreso','📈 Progreso'],['perfil','👤 Perfil']] as [Tab,string][]).map(([tab,label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('flex-1 min-w-[60px] py-2 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap', activeTab===tab ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300')}>
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ HOY ══ */}
        {activeTab === 'hoy' && (
          <motion.div key="hoy" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
            {recommendations.length > 0 && (
              <GlassCard className="p-5" animate={false}>
                <h3 className="font-semibold text-white flex items-center gap-2 mb-3"><Target size={16} className="text-amber-400" /> ¿Qué hacer hoy?</h3>
                <div className="space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-lg leading-none mt-0.5">{r.icon}</span>
                      <div><p className="text-sm text-slate-200">{r.text}</p>{r.foods && <p className="text-xs text-slate-500 mt-1">{r.foods.join(' · ')}</p>}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Droplets size={16} className="text-cyan-400" /> Hidratación</h3>
                <button onClick={() => { setWaterInput(''); setWaterModal(true) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"><Pencil size={12} /></button>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <div><span className="text-3xl font-black text-white tabular-nums">{waterToday.toFixed(1)}</span><span className="text-slate-400 text-sm ml-1">L</span></div>
                <div className="text-slate-500 text-sm pb-1">/ {waterTarget.toFixed(1)}L</div>
                <div className="ml-auto text-right"><p className="text-lg font-bold tabular-nums" style={{ color: waterToday>=waterTarget?'#10B981':'#06B6D4' }}>{Math.min(100,Math.round((waterToday/waterTarget)*100))}%</p></div>
              </div>
              <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <motion.div className="h-full rounded-full bg-cyan-500" initial={{ width:0 }} animate={{ width:`${Math.min(100,(waterToday/waterTarget)*100)}%` }} transition={{ duration:0.6 }} />
              </div>
              {waterToday < waterTarget && <p className="text-xs text-cyan-400/70 mb-3">Te faltan {Math.max(0,waterTarget-waterToday).toFixed(1)}L</p>}
              <div className="flex gap-2">
                {[[0.25,'+250ml'],[0.5,'+500ml'],[1,'+1L']].map(([amount,label]) => (
                  <button key={String(label)} onClick={() => { addWater(Number(amount)); addXP(2,'Agua') }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-all">
                    {String(label)}
                  </button>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-5" animate={false}>
              <h3 className="font-semibold text-white flex items-center gap-2 mb-4"><Flame size={16} className="text-orange-400" /> Nutrición de Hoy</h3>
              <div className="space-y-3">
                <MacroBar label="Proteína"       value={macros.protein}  target={targets.protein}  color="#7C3AED" />
                <MacroBar label="Calorías"       value={macros.calories} target={targets.calories} color="#F59E0B" unit=" kcal" />
                <MacroBar label="Carbohidratos"  value={macros.carbs}    target={targets.carbs}    color="#06B6D4" />
                <MacroBar label="Grasas"         value={macros.fats}     target={targets.fats}     color="#F97316" />
                <MacroBar label="Fibra"          value={macros.fiber}    target={targets.fiber}    color="#10B981" />
              </div>
              <button onClick={() => setActiveTab('nutricion')} className="mt-4 w-full py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500 hover:text-violet-400 hover:border-violet-500/20 transition-all">Ver nutrición detallada →</button>
            </GlassCard>
            <GlassCard className="p-5 border-amber-500/15" animate={false}>
              <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                <Zap size={16} className="text-amber-400" /> Niveles de Testosterona
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: todayDone&&macros.protein>=targets.protein*0.8?'#10B98120':'#F59E0B20', color: todayDone&&macros.protein>=targets.protein*0.8?'#10B981':'#F59E0B' }}>
                  {todayDone&&macros.protein>=targets.protein*0.8?'OPTIMIZANDO':'MEJORABLE'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">Basado en tus hábitos de hoy</p>
              <div className="space-y-2">
                {tInsights.map((t, i) => (
                  <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border',
                    t.level==='boost'?'bg-emerald-500/08 border-emerald-500/20':t.level==='warn'?'bg-amber-500/06 border-amber-500/20':'bg-white/[0.02] border-white/[0.05]')}>
                    <span className="text-lg leading-none mt-0.5 shrink-0">{t.icon}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══ NUTRICIÓN ══ */}
        {activeTab === 'nutricion' && (
          <motion.div key="nutricion" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
            <GlassCard className="p-5" animate={false}>
              <h3 className="font-semibold text-white flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-violet-400" /> Macros del Día</h3>
              <div className="space-y-3">
                <MacroBar label="Proteína"      value={macros.protein}  target={targets.protein}  color="#7C3AED" />
                <MacroBar label="Carbohidratos" value={macros.carbs}    target={targets.carbs}    color="#06B6D4" />
                <MacroBar label="Grasas"        value={macros.fats}     target={targets.fats}     color="#F97316" />
                <MacroBar label="Fibra"         value={macros.fiber}    target={targets.fiber}    color="#10B981" />
                <MacroBar label="Calorías"      value={macros.calories} target={targets.calories} color="#F59E0B" unit=" kcal" />
              </div>
            </GlassCard>
            {MEAL_ORDER.map(mealType => {
              const log = todayLogs.find(l => l.mealType === mealType)
              const mm = log ? log.items.reduce((a,i) => ({ calories:a.calories+i.calories, protein:a.protein+i.protein }), { calories:0, protein:0 }) : null
              const { label, icon } = MEAL_LABELS[mealType]
              return (
                <GlassCard key={mealType} className="p-4" animate={false}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span>{icon}</span> {label}
                      {mm && <span className="text-xs text-slate-500 font-normal">{Math.round(mm.calories)} kcal · {Math.round(mm.protein)}g prot</span>}
                    </h3>
                    <button onClick={() => { setFoodSearch(''); setFoodCategory(null); setSelectedFood(null); setFoodQty(''); setManualMode(false); setFoodModal(mealType) }}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-2 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all">
                      <Plus size={11} /> Agregar
                    </button>
                  </div>
                  {!log || log.items.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">Sin alimentos registrados</p>
                  ) : (
                    <div className="space-y-1.5">
                      {log.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">🔥 {Math.round(item.calories)} kcal · P:{item.protein.toFixed(1)}g · C:{item.carbs.toFixed(1)}g · G:{item.fats.toFixed(1)}g</p>
                          </div>
                          <button onClick={() => removeMealItem(log.id, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </motion.div>
        )}

        {/* ══ ENTRENO ══ */}
        {activeTab === 'entreno' && (
          <motion.div key="entreno" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">

            {/* Gym Check-in */}
            <GlassCard className="overflow-hidden" animate={false}>
              <AnimatePresence mode="wait">
                {!todayDone ? (
                  <motion.div key="checkin" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="p-6 text-center">
                    {weeklyPlan[todayDow] && (
                      <div className="mb-4 flex items-center justify-center gap-2">
                        <span className="text-2xl">{weeklyPlan[todayDow].icon}</span>
                        <div className="text-left"><p className="text-xs text-slate-500">Hoy toca</p><p className="text-white font-bold">{weeklyPlan[todayDow].name}</p></div>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale:1.02, boxShadow:'0 0 40px rgba(16,185,129,0.35)' }}
                      whileTap={{ scale:0.97 }}
                      onClick={handleGymCheckIn}
                      className="w-full py-6 rounded-2xl text-white text-xl font-black shadow-2xl flex items-center justify-center gap-3"
                      style={{ background:'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', boxShadow:'0 8px 32px rgba(16,185,129,0.25)' }}>
                      <Dumbbell size={26} /> ¡FUI AL GYM HOY!
                    </motion.button>
                    <p className="mt-3 text-slate-500 text-sm">🔥 Racha actual: <strong className="text-orange-400">{weekStats.streak} días</strong></p>
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', bounce:0.4 }}
                    className="p-6 text-center bg-gradient-to-b from-emerald-500/10 to-transparent">
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', bounce:0.6, delay:0.1 }} className="text-6xl mb-3">🏆</motion.div>
                    <p className="text-emerald-400 font-black text-2xl tracking-tight">¡GYM COMPLETADO!</p>
                    {weeklyPlan[todayDow] && <p className="text-slate-400 text-sm mt-1">Sesión de {weeklyPlan[todayDow].name}</p>}
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-3xl">🔥</span>
                      <span className="text-3xl font-black text-orange-400">{weekStats.streak}</span>
                      <span className="text-slate-400 text-sm">días de racha</span>
                    </div>
                    <button onClick={handleGymCheckIn} className="mt-4 text-xs text-slate-700 hover:text-slate-500 underline transition-colors">Desmarcar</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Monthly Calendar */}
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><CalendarDays size={16} className="text-emerald-400" /> {MONTH_NAMES[calMonth]} {calYear}</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Gym</span>
                  <span className="flex items-center gap-1 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500/40 inline-block" /> Perdido</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D','L','M','M','J','V','S'].map((d,i) => <span key={i} className="text-[10px] font-bold text-slate-600">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_,i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_,i) => i+1).map(day => {
                  const ds  = format(new Date(calYear, calMonth, day), 'yyyy-MM-dd')
                  const gone   = isGymDay(day)
                  const isToday = ds === todayStr
                  const isPast  = ds < todayStr
                  return (
                    <motion.button key={day} whileTap={{ scale:0.85 }} onClick={() => toggleCompletedDate(ds)}
                      className={cn('aspect-square rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                        gone ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' :
                        isToday ? 'ring-2 ring-emerald-400 text-emerald-400' :
                        isPast ? 'bg-red-500/20 text-red-400/60' : 'text-slate-700 hover:text-slate-500')}>
                      {day}
                    </motion.button>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">{gymDaysMonth}/{now.getDate()} días ({Math.round(gymDaysMonth/now.getDate()*100)}% consistencia)</span>
                <span className="font-semibold" style={{ color: gymDaysMonth/now.getDate()>=0.7?'#10B981':gymDaysMonth/now.getDate()>=0.4?'#F59E0B':'#EF4444' }}>
                  {gymDaysMonth/now.getDate()>=0.7?'🔥 Elite':gymDaysMonth/now.getDate()>=0.4?'⚡ Regular':'😴 Bajo'}
                </span>
              </div>
            </GlassCard>

            {/* Retos Activos */}
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Trophy size={16} className="text-amber-400" /> Retos Activos</h3>
                <button onClick={() => setAddChallengeModal(true)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all font-semibold">
                  <Plus size={12} /> Agregar reto
                </button>
              </div>
              {challenges.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl">🎯</div>
                  <p className="text-slate-400 font-semibold">No tienes retos activos</p>
                  <p className="text-slate-600 text-sm">100 push-ups, plancha diaria, 10k pasos... ¡escoge uno!</p>
                  <Button variant="glow" size="sm" onClick={() => setAddChallengeModal(true)}><Plus size={13} /> Agregar primer reto</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {challenges.map(c => (
                    <ChallengeCard key={c.id} challenge={c}
                      progress={todayProgress[c.id] ?? 0}
                      streak={getChallengeStreak(c.id)}
                      onLog={amt => handleLogChallenge(c, amt)}
                      onCustomLog={() => { setLogChallengeModal(c); setLogAmount('') }}
                      onRemove={() => removeChallenge(c.id)}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Weekly Plan */}
            <GlassCard className="p-5" animate={false}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><CalendarDays size={16} className="text-emerald-400" /> Plan Semanal</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }, (_,i) => {
                  const plan=weeklyPlan[i]; const isToday=i===todayDow; const done=isDayDone(i); const wt=WORKOUT_TYPES.find(t=>t.type===plan?.type); const ds=getDayDate(i)
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <motion.button whileTap={{ scale:0.95 }} onClick={() => openPlanModal(i)}
                        className={cn('w-full flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center',
                          done?'border-emerald-500/40 bg-emerald-500/[0.08]':isToday?'border-emerald-500/50 bg-emerald-500/10':plan?'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]':'border-dashed border-white/[0.08] hover:border-white/20')}>
                        <span className={cn('text-[10px] font-bold uppercase', done||isToday?'text-emerald-400':'text-slate-500')}>{DAY_NAMES[i]}</span>
                        {plan?(<><span className="text-lg leading-none">{plan.icon}</span><span className="text-[8px] font-semibold leading-tight" style={{ color:done?'#10B981':(wt?.color??'#94a3b8') }}>{plan.name}</span></>):(<><span className="text-slate-700 text-sm">+</span><span className="text-[8px] text-slate-700">Plan</span></>)}
                      </motion.button>
                      <motion.button whileTap={{ scale:0.85 }} onClick={() => toggleCompletedDate(ds)}
                        className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', done?'bg-emerald-500 border-emerald-500':'border-white/20 hover:border-emerald-400/60')}>
                        {done && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </motion.button>
                    </div>
                  )
                })}
              </div>
              {weeklyPlan[todayDow] && (
                <div className={cn('mt-4 flex items-center gap-3 p-3 rounded-xl border', todayDone?'bg-emerald-500/[0.12] border-emerald-500/30':'bg-emerald-500/[0.08] border-emerald-500/20')}>
                  <span className="text-2xl">{weeklyPlan[todayDow].icon}</span>
                  <div className="flex-1"><p className="text-sm font-bold text-white">{todayDone?'¡Completado! ':'Hoy: '}{weeklyPlan[todayDow].name}</p><p className="text-xs text-slate-400">{DAY_FULL[todayDow]}</p></div>
                  {!todayDone && <Button variant="glow" size="sm" onClick={handleGymCheckIn}><Check size={13} /> Marcar</Button>}
                </div>
              )}
            </GlassCard>

            {/* Recent Sessions */}
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Activity size={16} className="text-emerald-400" /> Sesiones Recientes</h3>
                <button onClick={() => setWorkoutModal(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all"><Plus size={12} /> Registrar</button>
              </div>
              {workoutSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-600"><Dumbbell size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin sesiones registradas</p></div>
              ) : (
                <div className="space-y-2">
                  {workoutSessions.slice(-5).reverse().map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">{WORKOUT_TYPES.find(t=>t.type===s.type)?.icon??'💪'}</div>
                      <div className="flex-1"><p className="text-sm font-semibold text-white">{s.name}</p><p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString('es-ES')} · {s.duration}min</p></div>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">{s.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* ══ PROGRESO ══ */}
        {activeTab === 'progreso' && (
          <motion.div key="progreso" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon:'💪', label:'Entrenamientos', val:`${weekStats.sessions}/7`,                                              color:'#10B981' },
                { icon:'🥩', label:'Proteína prom.',  val: weekStats.avgProtein>0?`${weekStats.avgProtein}g`:'—',               color:'#7C3AED' },
                { icon:'🏆', label:'Días perfectos',  val: String(weekStats.perfectDays),                                       color:'#F59E0B' },
                { icon:'🔥', label:'Racha actual',    val:`${weekStats.streak} días`,                                           color:'#EF4444' },
              ].map(s => (
                <GlassCard key={s.label} className="p-4" animate={false}>
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xl font-black text-white">{s.val}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </GlassCard>
              ))}
            </div>
            <GlassCard className="p-5" animate={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><TrendingDown size={16} className="text-violet-400" /> Evolución de Peso</h3>
                <div className="flex items-center gap-2">
                  {latest && <span className="text-sm font-bold text-white tabular-nums">{latest.weight} kg</span>}
                  <button onClick={() => setMeasModal(true)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 hover:text-white transition-all"><Plus size={12} /></button>
                </div>
              </div>
              {weightData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="i" tick={{ fontSize:10, fill:'#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#475569' }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                    <Tooltip contentStyle={{ background:'#1A1A27', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'12px', color:'#F8FAFC' }} formatter={(v) => [`${v} kg`,'Peso']} />
                    <Line type="monotone" dataKey="peso" stroke="#7C3AED" strokeWidth={2} dot={{ fill:'#7C3AED', strokeWidth:0, r:3 }} activeDot={{ r:5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Scale size={28} className="opacity-30" /><p className="text-sm">Agrega mediciones para ver tu progreso</p>
                  <Button variant="glow" size="sm" onClick={() => setMeasModal(true)}><Plus size={13} /> Registrar peso</Button>
                </div>
              )}
            </GlassCard>
            <GlassCard className="p-5" animate={false}>
              <h3 className="font-semibold text-white flex items-center gap-2 mb-3"><Star size={16} className="text-amber-400" /> Insights de la Semana</h3>
              <div className="space-y-2">
                {[
                  weekStats.sessions>=4&&{ icon:'🔥', text:`¡${weekStats.sessions} entrenamientos esta semana!` },
                  weekStats.avgProtein>0&&{ icon:'🥩', text:`Proteína promedio: ${weekStats.avgProtein}g${weekStats.avgProtein>=targets.protein*0.9?' — excelente!':` (meta: ${targets.protein}g)`}` },
                  weekStats.perfectDays>0&&{ icon:'🏆', text:`${weekStats.perfectDays} día${weekStats.perfectDays>1?'s':''} perfecto${weekStats.perfectDays>1?'s':''} esta semana.` },
                  weekStats.streak>=3&&{ icon:'⚡', text:`${weekStats.streak} días de entreno consecutivos. ¡Mantén la racha!` },
                  { icon:'💡', text:'Consistencia > Intensidad. Los resultados vienen de semanas y meses de hábitos sostenidos.' },
                ].filter(Boolean).slice(0,5).map((ins,i) => ins&&(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-base leading-none mt-0.5">{ins.icon}</span>
                    <p className="text-sm text-slate-300 leading-snug">{ins.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══ PERFIL ══ */}
        {activeTab === 'perfil' && (
          <motion.div key="perfil" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
            {!profileSet ? (
              <GlassCard className="p-6 text-center border-amber-500/20" animate={false}>
                <User size={32} className="mx-auto text-amber-400 mb-3" />
                <p className="font-semibold text-white mb-1">Configura tu perfil</p>
                <p className="text-sm text-slate-400 mb-4">Con tu peso, talla y objetivo calculo tus macros, calorías y agua personalizados.</p>
                <Button variant="glow" onClick={() => { setProfileForm({ weight:'', height:'', age:'', sex:'male', activityLevel:'moderate', goal:'muscle' }); setProfileModal(true) }}><Settings size={14} /> Configurar perfil</Button>
              </GlassCard>
            ) : (
              <>
                <GlassCard className="p-5" animate={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2"><User size={16} className="text-violet-400" /> Tu Perfil</h3>
                    <button onClick={() => { setProfileForm({ weight:String(userProfile.weight), height:String(userProfile.height), age:String(userProfile.age), sex:userProfile.sex, activityLevel:userProfile.activityLevel, goal:userProfile.goal }); setProfileModal(true) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 hover:text-white transition-all"><Pencil size={12} /></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[['⚖️','Peso',`${userProfile.weight} kg`],['📏','Talla',`${userProfile.height} cm`],['🎂','Edad',`${userProfile.age} años`],['⚡','Actividad',ACTIVITY_LABELS[userProfile.activityLevel]?.split('(')[0].trim()??'—'],['🎯','Objetivo',userProfile.goal==='muscle'?'Ganar músculo':userProfile.goal==='fat_loss'?'Perder grasa':'Mantenimiento'],['👤','Sexo',userProfile.sex==='male'?'Masculino':'Femenino']].map(([icon,label,val]) => (
                      <div key={String(label)} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-xs text-slate-500">{icon} {label}</p>
                        <p className="text-sm font-semibold text-white mt-0.5 truncate">{val}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard className="p-5" animate={false}>
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Flame size={16} className="text-orange-400" /> Objetivos Calculados</h3>
                  <div className="space-y-3">
                    {[
                      { label:'TMB (Metabolismo Basal)',   val:`${targets.tmb} kcal`,        desc:'Calorías en reposo absoluto',color:'#475569' },
                      { label:'Calorías de Mantenimiento', val:`${targets.maintenance} kcal`, desc:'Para mantener tu peso actual',color:'#06B6D4' },
                      { label:'Calorías Objetivo',         val:`${targets.calories} kcal`,   desc:userProfile.goal==='muscle'?'+400 (superávit)':userProfile.goal==='fat_loss'?'-450 (déficit)':'Mantenimiento',color:'#F59E0B' },
                      { label:'Proteína Diaria',           val:`${targets.protein}g`,         desc:`${userProfile.goal==='muscle'?2.2:userProfile.goal==='fat_loss'?2.0:1.8}g/kg`,color:'#7C3AED' },
                      { label:'Carbohidratos',             val:`${targets.carbs}g`,           desc:'Fuente principal de energía',color:'#06B6D4' },
                      { label:'Grasas',                    val:`${targets.fats}g`,            desc:'28% de calorías totales',color:'#F97316' },
                      { label:'Fibra',                     val:'35g',                         desc:'Recomendación diaria',color:'#10B981' },
                      { label:'Agua Diaria',               val:`${targets.water}L`,           desc:`38ml × ${userProfile.weight}kg`,color:'#06B6D4' },
                    ].map(t => (
                      <div key={t.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                        <div><p className="text-sm text-white">{t.label}</p><p className="text-[10px] text-slate-600">{t.desc}</p></div>
                        <span className="text-sm font-bold tabular-nums" style={{ color:t.color }}>{t.val}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════ MODALS ════════ */}

      {/* Registrar entreno */}
      <Modal open={workoutModal} onClose={() => setWorkoutModal(false)} title="Nueva Sesión">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.filter(t => t.type!=='rest'&&t.type!=='custom').map(t => (
              <button key={t.type} onClick={() => { addWorkout({ date:new Date().toISOString(), type:t.type as never, name:t.name, exercises:[], duration:60, volume:0, mood:4, completed:true }); addXP(25,`Entreno: ${t.name}`); toggleCompletedDate(todayStr); setWorkoutModal(false) }}
                className="flex items-center gap-2 p-3 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] transition-all text-left">
                <span className="text-xl">{t.icon}</span><span className="text-xs text-slate-300">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Registrar peso */}
      <Modal open={measModal} onClose={() => setMeasModal(false)} title="Registrar Peso">
        <div className="space-y-4">
          <Input label="Peso (kg)" type="number" step="0.1" placeholder="83.0" value={newWeight} onChange={e => setNewWeight(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setMeasModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => { if(!newWeight)return; addMeasurement({ date:new Date().toISOString(), weight:parseFloat(newWeight) }); setMeasModal(false); setNewWeight('') }}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Ajustar agua */}
      <Modal open={waterModal} onClose={() => setWaterModal(false)} title="💧 Ajustar Hidratación">
        <div className="space-y-4">
          <Input label="Litros totales hoy" type="number" step="0.1" min="0" placeholder="0.0" value={waterInput} onChange={e => setWaterInput(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setWaterModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={() => { const v=parseFloat(waterInput); if(!isNaN(v)&&v>=0)setWater(v); setWaterModal(false) }}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Log reto */}
      <Modal open={!!logChallengeModal} onClose={() => setLogChallengeModal(null)} title="Registrar progreso">
        {logChallengeModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <span className="text-2xl">{logChallengeModal.icon}</span>
              <div><p className="font-semibold text-white">{logChallengeModal.name}</p><p className="text-xs text-slate-500">Hoy: {todayProgress[logChallengeModal.id]??0} / {logChallengeModal.dailyTarget} {logChallengeModal.unit}</p></div>
            </div>
            <div className="flex gap-2">
              {getQuickAmounts(logChallengeModal).map(amt => (
                <button key={amt} onClick={() => setLogAmount(String((Number(logAmount||0)+amt)))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background:`${logChallengeModal.color}18`, color:logChallengeModal.color, border:`1px solid ${logChallengeModal.color}35` }}>
                  +{amt}
                </button>
              ))}
            </div>
            <Input label={`Cantidad (${logChallengeModal.unit})`} type="number" min={1} placeholder="0" value={logAmount} onChange={e => setLogAmount(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setLogChallengeModal(null)}>Cancelar</Button>
              <Button variant="glow" onClick={() => { if(!logAmount||Number(logAmount)<=0)return; handleLogChallenge(logChallengeModal,Number(logAmount)); setLogChallengeModal(null) }}>Registrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Challenge */}
      <Modal open={addChallengeModal} onClose={() => setAddChallengeModal(false)} title="🏆 Agregar Reto">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setChallengePresetTab('presets')} className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', challengePresetTab==='presets'?'bg-amber-500/20 text-amber-300 border border-amber-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>🎯 Presets</button>
            <button onClick={() => setChallengePresetTab('custom')} className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', challengePresetTab==='custom'?'bg-amber-500/20 text-amber-300 border border-amber-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>✏️ Personalizado</button>
          </div>
          {challengePresetTab === 'presets' ? (
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
              {PRESET_CHALLENGES.map((p,i) => {
                const exists = challenges.some(c => c.name===p.name)
                return (
                  <button key={i} onClick={() => !exists&&handleAddPreset(p)} disabled={exists}
                    className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                      exists?'border-emerald-500/20 bg-emerald-500/5 opacity-60 cursor-default':'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20')}>
                    <span className="text-2xl shrink-0">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{p.dailyTarget} {p.unit}/día</span>
                        <span className="text-[10px] font-semibold px-1.5 rounded-full" style={{ background:`${DIFF_COLOR[p.difficulty]}18`, color:DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>
                        <span className="text-[10px] text-amber-400">+{p.xpReward} XP</span>
                      </div>
                    </div>
                    {exists?<span className="text-[10px] text-emerald-400 shrink-0">✓</span>:<Plus size={14} className="text-slate-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-20"><Input label="Ícono" placeholder="💪" value={customChallenge.icon} onChange={e => setCustomChallenge(f => ({ ...f, icon:e.target.value }))} /></div>
                <div className="flex-1"><Input label="Nombre del reto" placeholder="150 push-ups diarios" value={customChallenge.name} onChange={e => setCustomChallenge(f => ({ ...f, name:e.target.value }))} /></div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><Input label="Meta diaria" type="number" min={1} placeholder="100" value={customChallenge.dailyTarget} onChange={e => setCustomChallenge(f => ({ ...f, dailyTarget:e.target.value }))} /></div>
                <div className="flex-1">
                  <label className="text-sm text-slate-400 font-medium block mb-1.5">Unidad</label>
                  <select value={customChallenge.unit} onChange={e => setCustomChallenge(f => ({ ...f, unit:e.target.value }))}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/40">
                    {['reps','seg','min','pasos','km'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 font-medium block mb-1.5">Dificultad</label>
                <div className="flex gap-2">
                  {['fácil','medio','difícil','extremo'].map(d => (
                    <button key={d} onClick={() => setCustomChallenge(f => ({ ...f, difficulty:d }))}
                      className={cn('flex-1 py-2 rounded-xl text-xs font-semibold transition-all', customChallenge.difficulty===d?'border':'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08]')}
                      style={customChallenge.difficulty===d?{ background:`${DIFF_COLOR[d]}15`, color:DIFF_COLOR[d], borderColor:`${DIFF_COLOR[d]}40` }:undefined}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 font-medium block mb-1.5">Color</label>
                <div className="flex gap-2">
                  {CHALLENGE_COLORS.map(col => (
                    <button key={col} onClick={() => setCustomChallenge(f => ({ ...f, color:col }))}
                      className={cn('w-8 h-8 rounded-full transition-all', customChallenge.color===col?'ring-2 ring-white ring-offset-2 ring-offset-black scale-110':'opacity-60 hover:opacity-100')}
                      style={{ background:col }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="ghost" onClick={() => setAddChallengeModal(false)}>Cancelar</Button>
                <Button variant="glow" onClick={handleAddCustomChallenge}><Plus size={14} /> Crear reto</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Perfil */}
      <Modal open={profileModal} onClose={() => setProfileModal(false)} title="👤 Perfil Físico">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Peso (kg)" type="number" step="0.1" placeholder="83" value={profileForm.weight} onChange={e => setProfileForm(f => ({ ...f, weight:e.target.value }))} />
            <Input label="Talla (cm)" type="number" placeholder="175" value={profileForm.height} onChange={e => setProfileForm(f => ({ ...f, height:e.target.value }))} />
            <Input label="Edad" type="number" placeholder="28" value={profileForm.age} onChange={e => setProfileForm(f => ({ ...f, age:e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Sexo</label>
            <div className="flex gap-2">
              {(['male','female'] as const).map(s => (
                <button key={s} onClick={() => setProfileForm(f => ({ ...f, sex:s }))}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all', profileForm.sex===s?'bg-violet-500/20 text-violet-300 border border-violet-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                  {s==='male'?'♂ Masculino':'♀ Femenino'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Nivel de Actividad</label>
            <div className="space-y-1.5">
              {Object.entries(ACTIVITY_LABELS).map(([val,label]) => (
                <button key={val} onClick={() => setProfileForm(f => ({ ...f, activityLevel:val as never }))}
                  className={cn('w-full px-3 py-2 rounded-xl text-sm text-left transition-all', profileForm.activityLevel===val?'bg-violet-500/20 text-violet-300 border border-violet-500/40':'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-transparent')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">Objetivo</label>
            <div className="grid grid-cols-3 gap-2">
              {[['muscle','💪 Músculo'],['fat_loss','🔥 Grasa'],['maintenance','⚖️ Mantener']].map(([val,label]) => (
                <button key={val} onClick={() => setProfileForm(f => ({ ...f, goal:val as never }))}
                  className={cn('py-2.5 rounded-xl text-xs font-semibold transition-all text-center', profileForm.goal===val?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setProfileModal(false)}>Cancelar</Button>
            <Button variant="glow" onClick={handleSaveProfile}>Guardar perfil</Button>
          </div>
        </div>
      </Modal>

      {/* Agregar comida */}
      <Modal open={!!foodModal} onClose={() => { setFoodModal(null); setSelectedFood(null); setFoodSearch(''); setFoodCategory(null); setManualMode(false) }} title={`${foodModal?MEAL_LABELS[foodModal].icon:''} ${foodModal?MEAL_LABELS[foodModal].label:''}`}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setManualMode(false)} className={cn('flex-1 py-2 rounded-xl text-xs font-semibold transition-all', !manualMode?'bg-violet-500/20 text-violet-300 border border-violet-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>🔍 Buscar alimento</button>
            <button onClick={() => setManualMode(true)} className={cn('flex-1 py-2 rounded-xl text-xs font-semibold transition-all', manualMode?'bg-violet-500/20 text-violet-300 border border-violet-500/40':'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>✏️ Entrada manual</button>
          </div>
          {!manualMode ? (
            <>
              {/* Category chips */}
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => { setFoodCategory(null); setSelectedFood(null); setFoodSearch('') }}
                  className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all', !foodCategory?'bg-white/15 text-white':'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08]')}>
                  Todos
                </button>
                {Object.entries(FOOD_CATEGORIES).map(([key,{ label,emoji }]) => (
                  <button key={key} onClick={() => { setFoodCategory(foodCategory===key?null:key); setSelectedFood(null); setFoodSearch('') }}
                    className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all', foodCategory===key?'bg-violet-500/25 text-violet-300 border border-violet-500/40':'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08]')}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={foodSearch} onChange={e => { setFoodSearch(e.target.value); setSelectedFood(null) }} placeholder="Buscar alimento..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40" />
              </div>
              {searchResults.length > 0 && !selectedFood && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map(f => (
                    <button key={f.id} onClick={() => { setSelectedFood(f); setFoodQty(String(f.per)); setFoodSearch(f.name) }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-left transition-all">
                      <span className="text-sm text-white">{f.name}</span>
                      <span className="text-[10px] text-slate-500">{f.cal} kcal / {f.per} {f.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedFood && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-sm font-semibold text-violet-300">{selectedFood.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Por {selectedFood.per} {selectedFood.unit}: {selectedFood.cal} kcal · P:{selectedFood.pro}g · C:{selectedFood.car}g · G:{selectedFood.fat}g</p>
                  </div>
                  <Input label={`Cantidad (${selectedFood.unit})`} type="number" step="0.5" min="0" placeholder={String(selectedFood.per)} value={foodQty} onChange={e => setFoodQty(e.target.value)} />
                  {foodQty && Number(foodQty)>0 && (
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {[['Cal',Math.round(selectedFood.cal*Number(foodQty)/selectedFood.per),'kcal','#F59E0B'],['P',Math.round(selectedFood.pro*Number(foodQty)/selectedFood.per*10)/10,'g','#7C3AED'],['C',Math.round(selectedFood.car*Number(foodQty)/selectedFood.per*10)/10,'g','#06B6D4'],['G',Math.round(selectedFood.fat*Number(foodQty)/selectedFood.per*10)/10,'g','#F97316'],['F',Math.round(selectedFood.fib*Number(foodQty)/selectedFood.per*10)/10,'g','#10B981']].map(([label,val,unit,color]) => (
                        <div key={String(label)} className="p-1.5 rounded-lg bg-white/[0.03]">
                          <p className="text-[10px] text-slate-600">{label}</p>
                          <p className="text-xs font-bold" style={{ color:String(color) }}>{val}{unit}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <Input label="Nombre del alimento" placeholder="Ej: 3 huevos fritos con tostones..." value={manualEntry.name} onChange={e => setManualEntry(m => ({ ...m, name:e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Calorías (kcal)" type="number" min={0} placeholder="0" value={manualEntry.calories} onChange={e => setManualEntry(m => ({ ...m, calories:e.target.value }))} />
                <Input label="Proteína (g)" type="number" min={0} step="0.1" placeholder="0" value={manualEntry.protein} onChange={e => setManualEntry(m => ({ ...m, protein:e.target.value }))} />
                <Input label="Carbohidratos (g)" type="number" min={0} step="0.1" placeholder="0" value={manualEntry.carbs} onChange={e => setManualEntry(m => ({ ...m, carbs:e.target.value }))} />
                <Input label="Grasas (g)" type="number" min={0} step="0.1" placeholder="0" value={manualEntry.fats} onChange={e => setManualEntry(m => ({ ...m, fats:e.target.value }))} />
              </div>
              <Input label="Fibra (g)" type="number" min={0} step="0.1" placeholder="0" value={manualEntry.fiber} onChange={e => setManualEntry(m => ({ ...m, fiber:e.target.value }))} />
            </div>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" onClick={() => setFoodModal(null)}>Cancelar</Button>
            <Button variant="glow" onClick={handleAddFood}><Apple size={14} /> Agregar</Button>
          </div>
        </div>
      </Modal>

      {/* Plan semanal */}
      <Modal open={planModal !== null} onClose={() => setPlanModal(null)} title={planModal !== null ? `${DAY_FULL[planModal]} — Plan` : ''}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.map(wt => (
              <button key={wt.type} onClick={() => setSelectedType(wt)}
                className={cn('flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left', selectedType.type===wt.type?'border-opacity-60':'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]')}
                style={selectedType.type===wt.type?{ background:`${wt.color}15`, borderColor:`${wt.color}50` }:undefined}>
                <span className="text-xl">{wt.icon}</span>
                <div><p className="text-xs font-semibold text-white">{wt.name}</p><p className="text-[10px] text-slate-500">{wt.desc}</p></div>
              </button>
            ))}
          </div>
          {selectedType.type==='custom' && <Input label="Nombre del entreno" placeholder="Ej: Hombros + Core" value={customName} onChange={e => setCustomName(e.target.value)} />}
          <div className="flex items-center justify-between pt-1">
            {planModal !== null && weeklyPlan[planModal] && (
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if(planModal!==null)clearDayPlan(planModal); setPlanModal(null) }}><X size={14} /> Quitar</Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={() => setPlanModal(null)}>Cancelar</Button>
              <Button variant="glow" onClick={saveDayPlan}>Guardar</Button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
