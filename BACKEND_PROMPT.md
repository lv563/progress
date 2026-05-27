# PROMPT: Kingdom OS — Backend Completo

Actúa como Senior Backend Architect, Senior DevOps Engineer y Platform Engineer
experto en SaaS moderno, alta disponibilidad, event-driven architecture y
escalabilidad enterprise.

Voy a construir el BACKEND COMPLETO de "Kingdom OS" — un sistema operativo
personal todo-en-uno con:
- Hábitos con streaks, XP y gamificación
- Pomodoro con sesiones, estadísticas y modo deep work
- Tareas y proyectos (kanban, prioridades, fechas)
- Rutinas con time blocking y templates
- Seguimiento físico: gym, nutrición, peso, agua
- Ministerio espiritual: personas, discipulados, seguimientos, devocionales
- Vault personal: documentos cifrados, notas, credenciales
- Analytics completo con reportes y dashboards

El frontend ya existe en Next.js 14 App Router + TypeScript + Zustand +
TanStack Query. Las rutas son: /dashboard, /dashboard/habits,
/dashboard/pomodoro, /dashboard/tasks, /dashboard/routine,
/dashboard/physical, /dashboard/ministry, /dashboard/vault,
/dashboard/analytics, /dashboard/settings.

NO quiero ideas generales. Quiero arquitectura REAL, código de referencia,
esquemas completos y decisiones concretas con justificaciones.

---

## 1. ARQUITECTURA GENERAL

Diseña:
- Monolito modular vs microservicios — justificación según etapa (MVP → escala)
- Diagrama textual de módulos y sus responsabilidades
- Communication patterns: REST síncrono, eventos async, WebSockets
- BFF (Backend for Frontend) pattern para Next.js App Router
- API Gateway con rate limiting, auth, logging
- Health checks y circuit breakers

Entrega:
- Diagrama ASCII de la arquitectura completa
- Decisión final justificada
- Plan de migración cuando escale a 10k+ usuarios

---

## 2. STACK TECNOLÓGICO COMPLETO

Evalúa y elige definitivamente entre:
- Framework: **NestJS** vs Fastify vs Express
- ORM: **Prisma** vs Drizzle
- Base de datos: **PostgreSQL** (Supabase/Neon/Railway) vs PlanetScale
- Cache: **Redis** (Upstash) vs Valkey
- Jobs: **BullMQ** vs Inngest vs Temporal
- Auth: **Auth.js v5** vs Clerk vs Supabase Auth vs JWT propio
- Storage: **Cloudflare R2** vs AWS S3 vs Supabase Storage
- Email: **Resend** vs SendGrid
- Realtime: **Socket.io** (con Redis adapter) vs Pusher vs Partykit

Para cada elección:
- Decisión final
- Razón concreta
- Trade-offs
- Costo a 10k usuarios

---

## 3. DATABASE SCHEMA COMPLETO (PostgreSQL + Prisma)

Genera el archivo `schema.prisma` COMPLETO con TODOS los modelos para:

### Auth & Users
```
User, Session, Account (OAuth), RefreshToken
```

### Gamificación
```
UserLevel (xp, nivel, historial), UserStreak (por categoría, record),
Badge (definición), UserBadge (desbloqueados), XPTransaction (auditoría)
```

### Hábitos
```
Habit (definición, tipo, frecuencia, meta, color, icono),
HabitLog (completions diarias con valor), HabitStats (cache de estadísticas)
```

### Pomodoro
```
PomodoroSession (completadas, duración, modo, tarea asociada),
PomodoroConfig (por usuario)
```

### Tareas
```
Project (nombre, color, icono, estado),
Task (título, estado, prioridad, fecha límite, jerarquía, etiquetas),
TaskLabel, TaskComment
```

### Rutina
```
RoutineTemplate (plantillas), RoutineBlock (bloques dentro de plantilla),
DailyRoutine (rutina de un día específico), DailyRoutineBlock (bloque de día)
```

### Físico
```
WorkoutSession (fecha, tipo, duración, volumen, estado de ánimo),
Exercise (catálogo), ExerciseLog (ejercicios en sesión),
ExerciseSet (sets: reps, peso, RPE, is_pr),
BodyMeasurement (peso, grasa corporal, medidas),
NutritionLog (calorías, macros), Meal (comida individual),
WaterLog (registro diario de agua)
```

### Ministerio
```
SpiritualPerson (perfil, nivel espiritual, progreso discipulado),
Discipleship (relación discipulador-discipulado),
FollowUp (tipo, fecha, estado),
MinistryNote (notas de seguimiento),
PrayerRequest (peticiones de oración),
Devotional (devocionales propios),
ChurchEvent (calendario de iglesia)
```

### Vault
```
VaultFolder (carpetas), VaultItem (documentos, notas, credenciales, links),
VaultTag (etiquetas)
```

Para cada modelo incluye:
- Todos los campos con tipos Prisma
- Índices (@index, @@index compuestos)
- Relaciones correctas (@relation)
- Campos de auditoría (createdAt, updatedAt, deletedAt para soft delete)
- Constraints y validaciones donde aplique

---

## 4. AUTENTICACIÓN Y AUTORIZACIÓN

Diseña sistema completo:

### JWT Strategy
- Access token: 15min, firmado con RS256
- Refresh token: 30 días, rotación con family tracking
- Device fingerprinting para multi-device
- Revocación de sesiones específicas o todas

### OAuth
- Google y Apple como providers
- Callback handlers en NestJS

### Guards y Decoradores (NestJS)
```typescript
@JwtAuthGuard()      // verifica access token
@CurrentUser()       // inyecta usuario del token
@Roles('admin')      // RBAC básico
@Public()            // rutas sin auth
```

### Seguridad
- Argon2id para passwords (con benchmarks vs Bcrypt)
- CSRF protection con tokens double-submit
- Rate limiting por IP y por usuario
- Brute force protection en /auth/login
- Refresh token rotation con detección de robo (family invalidation)

Dame código real de:
- `AuthModule` completo en NestJS
- `JwtStrategy` con Passport
- Refresh token rotation con detección de robo
- Guards y decoradores listos para usar

---

## 5. API DESIGN — TODOS LOS ENDPOINTS

### Formato estándar de respuesta
```typescript
// Success
{ success: true, data: T, meta?: PaginationMeta }

// Error
{ success: false, error: { code: string, message: string, details?: any } }
```

### Paginación
- Cursor-based para feeds y listados grandes
- Offset para dashboards y reports

### Endpoints por módulo (dame TODOS):

**Auth** — /api/v1/auth/
- POST /register, POST /login, POST /refresh, POST /logout
- POST /logout-all, GET /me, PATCH /me
- POST /oauth/google/callback, POST /oauth/apple/callback

**Habits** — /api/v1/habits/
- GET / (con filtros: category, frequency), POST /
- GET /:id, PATCH /:id, DELETE /:id
- POST /:id/log (registrar completion)
- GET /:id/logs (historial con paginación cursor)
- GET /:id/stats (streak, completion rate, heatmap data)
- GET /today (todos los hábitos con su log de hoy)
- GET /heatmap (datos para heatmap anual)

**Pomodoro** — /api/v1/pomodoro/
- POST /sessions/start, PATCH /sessions/:id/complete
- PATCH /sessions/:id/cancel
- GET /sessions (historial), GET /sessions/today
- GET /stats (weekly, monthly summary)
- GET /config, PATCH /config

**Tasks** — /api/v1/tasks/
- GET / (filtros: status, priority, project, dueDate), POST /
- GET /:id, PATCH /:id, DELETE /:id
- PATCH /:id/move (cambiar status)
- POST /bulk-update (actualizar múltiples)
- GET /today

**Projects** — /api/v1/projects/
- GET /, POST /, GET /:id, PATCH /:id, DELETE /:id
- GET /:id/tasks

**Routine** — /api/v1/routine/
- GET /templates, POST /templates
- GET /templates/:id, PATCH /templates/:id, DELETE /templates/:id
- GET /daily/:date, POST /daily (apply template to date)
- PATCH /daily/:id/blocks/:blockId/toggle
- POST /daily/:id/blocks, DELETE /daily/:id/blocks/:blockId

**Physical/Gym** — /api/v1/physical/
- GET /workouts, POST /workouts
- GET /workouts/:id, PATCH /workouts/:id, DELETE /workouts/:id
- POST /workouts/:id/exercises
- GET /measurements, POST /measurements
- GET /exercises (catálogo), POST /exercises
- GET /stats (semana, mes, PRs)

**Physical/Nutrition** — /api/v1/nutrition/
- GET /logs, POST /logs
- GET /logs/:date, PATCH /logs/:id
- GET /water/today, PATCH /water/today

**Ministry** — /api/v1/ministry/
- GET /people, POST /people
- GET /people/:id, PATCH /people/:id, DELETE /people/:id
- POST /people/:id/notes, GET /people/:id/notes
- POST /people/:id/follow-ups, PATCH /people/:id/follow-ups/:fId
- GET /people/pending-followups
- GET /events, POST /events
- GET /events/:id, PATCH /events/:id, DELETE /events/:id
- GET /devotionals, POST /devotionals
- GET /devotionals/:id

**Vault** — /api/v1/vault/
- GET /folders, POST /folders, DELETE /folders/:id
- GET /items (filtros: folderId, type, tags, starred), POST /items
- GET /items/:id, PATCH /items/:id, DELETE /items/:id
- PATCH /items/:id/star
- GET /search?q=query
- POST /items/:id/upload (para documentos con presigned URL)

**Gamification** — /api/v1/gamification/
- GET /profile (xp, level, streak, badges)
- GET /badges/all (catálogo completo)
- GET /badges/unlocked
- GET /xp/history (últimas transacciones)
- GET /leaderboard (futuro — top usuarios)

**Analytics** — /api/v1/analytics/
- GET /summary?period=week|month|year
- GET /habits/chart?period=week
- GET /focus/chart?period=week
- GET /physical/chart?period=month
- GET /productivity-score

Para cada endpoint crítico incluye:
- Método, ruta, descripción
- Request body/params con tipos TypeScript
- Response schema
- Posibles errores con códigos HTTP correctos
- Middleware aplicado (auth, rate limit, validación)

---

## 6. WEBSOCKETS Y REALTIME

Diseña con NestJS + Socket.io + Redis adapter para escala horizontal:

### Eventos necesarios
```typescript
// Cliente → Servidor
'habit:complete'        // marcar hábito
'pomodoro:start'        // iniciar timer
'pomodoro:tick'         // sincronizar timer entre dispositivos
'presence:heartbeat'    // mantener conexión viva

// Servidor → Cliente
'xp:gained'             // { amount, reason, totalXP, newLevel? }
'streak:updated'        // { habitId, streak, isNewRecord }
'badge:unlocked'        // { badge: BadgeData }
'level:up'              // { oldLevel, newLevel, title }
'habit:synced'          // sincronización entre dispositivos
'pomodoro:synced'       // estado del timer en otro dispositivo
'followup:reminder'     // recordatorio de seguimiento ministerial
```

### Gateway NestJS
```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/realtime',
})
export class RealtimeGateway {
  // implement with Redis adapter for horizontal scaling
}
```

Dame código real de:
- `RealtimeGateway` completo en NestJS
- Autenticación de conexiones WebSocket con JWT
- Hook del cliente Next.js: `useRealtimeSync()`
- Redis adapter configuration para escalar a múltiples instancias

---

## 7. GAMIFICACIÓN ENGINE (Backend)

### XP Engine
```typescript
// Event-driven: cada dominio emite eventos
@Injectable()
export class GamificationService {
  async awardXP(userId: string, event: XPEvent): Promise<XPResult>
  async checkBadges(userId: string, event: string): Promise<Badge[]>
  async updateStreak(userId: string, category: string): Promise<StreakResult>
}
```

### XP Weights (configurables)
```typescript
const XP_WEIGHTS = {
  habit_complete:      10,
  habit_perfect_day:   50,
  streak_7days:       100,
  streak_30days:      500,
  streak_100days:    2000,
  pomodoro_complete:   15,
  deep_work_complete:  30,
  workout_complete:    25,
  spiritual_devotional: 20,
  spiritual_followup:  20,
  task_complete:        5,
  goal_achieved:      200,
  early_morning:       30,  // antes de 7am
}
```

### Anti-gaming Limits
```typescript
const DAILY_XP_LIMITS = {
  habits:     200,   // máx 200 XP de hábitos por día
  pomodoro:   300,   // máx 300 XP de pomodoros por día
  tasks:      100,
  spiritual:  150,
  physical:   100,
}
```

### Streak Engine
- Cálculo automático con timezone awareness
- Grace period configurable (default: no grace)
- Mejor racha histórica tracking
- Streak por categoría (espiritual, físico, etc.)
- Evento al hacer streak milestone (7, 14, 30, 60, 100, 365)

### Badge Engine
- Badge conditions como JSON rules engine
- Evaluación async post-evento
- Secret badges (condición oculta)
- Badges únicos vs repetibles

Dame código real de todo el GamificationService incluyendo el evaluador de badges.

---

## 8. BACKGROUND JOBS (BullMQ + Redis)

### Queues necesarias

**analytics.queue** — agregación de datos
- Job: `aggregate-daily-stats` (cron 00:05 UTC diario)
  - Para cada usuario activo: calcula completion rates, focus hours, workout stats
  - Guarda en `DailySummary` tabla
  - TTL: mantener últimos 365 días

**gamification.queue** — evaluación de badges y XP
- Job: `evaluate-badges` (triggered por XPTransaction)
  - Recibe userId y eventType
  - Evalúa todas las condiciones de badge pendientes
  - Idempotente con idempotency key

**reminders.queue** — follow-ups ministeriales
- Job: `check-followups` (cron cada hora)
  - Query: `WHERE nextFollowUp <= NOW() AND NOT notified`
  - Enqueue notification (in-app via WebSocket)

**cleanup.queue** — mantenimiento
- Job: `cleanup-expired-sessions` (cron diario)
- Job: `cleanup-old-logs` (mantener 90 días de logs detallados)
- Job: `vacuum-analytics` (weekly VACUUM ANALYZE)

Para cada job incluye:
- Trigger (cron expression o event trigger)
- Payload TypeScript interface
- Retry strategy (attempts, backoff)
- Dead letter queue
- Idempotency approach
- Monitoring hook

---

## 9. STORAGE Y VAULT

### Cloudflare R2 Strategy
```
kingdoms-os-private/    # vault documents (con presigned URLs, exp 1h)
  users/{userId}/
    vault/
    profile/

kingdoms-os-public/     # avatars, assets públicos
  avatars/{userId}/
```

### Vault Encryption
- Documentos cifrados con AES-256-GCM
- Key derivation: PBKDF2 con salt por usuario
- Master key en env variable cifrada, user key derivada del password hash
- Opción zero-knowledge para credenciales (client-side encryption con WebCrypto API)
- Virus scanning con ClamAV antes de guardar (async job)

### Upload Flow
```
1. Cliente solicita presigned URL al backend
2. Backend verifica auth y permisos
3. Backend genera presigned PUT URL (15min exp)
4. Cliente sube directo a R2 (sin pasar por backend)
5. Cliente notifica al backend con metadata
6. Backend registra en DB y encola virus scan
7. Virus scan result actualiza estado del item
```

Dame:
- `StorageService` con métodos: getUploadUrl, getDownloadUrl, deleteFile
- `VaultEncryptionService` con encrypt/decrypt
- Endpoint para iniciar upload con presigned URL

---

## 10. CACHÉ CON REDIS

### Cache Layers

**L1 — In-memory (Map + TTL)** para datos ultra-hot:
- User profile: 60s TTL
- User XP/level: 30s TTL

**L2 — Redis** para datos hot:
- Habit list del día: `habits:today:{userId}` — 5min TTL
- Pomodoro config: `pomodoro:config:{userId}` — 30min TTL
- Analytics aggregations: `analytics:week:{userId}` — 1h TTL
- Streak counts: `streak:{userId}:{category}` — write-through

**Estrategias**:
- Cache-aside para datos de usuario
- Write-through para streaks y XP (críticos)
- Cache invalidation: tags por usuario (invalidar TODO para userId)
- Cache warming en login del usuario

### Database Performance
- PgBouncer connection pooling (max 100 connections)
- Read replica para analytics queries
- Partial indexes para queries comunes:
  ```sql
  CREATE INDEX idx_habit_logs_today ON habit_logs(habit_id, date)
    WHERE date = CURRENT_DATE;
  CREATE INDEX idx_tasks_pending ON tasks(user_id, status, due_date)
    WHERE status != 'done' AND deleted_at IS NULL;
  CREATE INDEX idx_followups_pending ON follow_ups(next_date, notified)
    WHERE next_date <= NOW() AND notified = false;
  ```
- Materialized view para analytics dashboard (refresh cada hora)

---

## 11. SEGURIDAD COMPLETA

### OWASP Top 10 Mitigations
```
A01 - Broken Access Control: ownership checks en cada query
A02 - Cryptographic Failures: Argon2id, TLS 1.3, vault encryption
A03 - Injection: Prisma parameterized, Zod input validation
A04 - Insecure Design: rate limiting, RBAC, audit logs
A05 - Security Misconfiguration: helmet.js, CSP headers, env validation
A06 - Vulnerable Components: npm audit en CI, Dependabot
A07 - Auth Failures: refresh rotation, brute force, 2FA ready
A08 - Data Integrity: signed JWTs RS256, webhook signatures
A09 - Logging Failures: structured audit logs, no PII en logs
A10 - SSRF: allowlist para uploads, no user-controlled URLs
```

### Headers de seguridad con Helmet.js
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*.r2.cloudflarestorage.com"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}))
```

### Rate Limiting
```typescript
// Por endpoint
/auth/login:    5 requests/15min por IP + 10/15min por email
/auth/register: 3 requests/hour por IP
/api/*:         1000 requests/15min por userId
/api/vault/*:   200 requests/15min por userId
```

### Audit Logging
```typescript
// Loguear siempre:
- Acceso a vault items
- Cambios en credenciales
- Login/logout/failed attempts
- Cambios de password
- Exports de datos
```

---

## 12. MÓDULO DE ANALYTICS

### Aggregation Pipeline
```
Raw events → BullMQ queue → Aggregation job → DailySummary table
                                             → WeeklySummary table
                                             → Materialized views
```

### Métricas calculadas (DailySummary)
```typescript
interface DailySummary {
  userId: string
  date: string
  habitsCompleted: number
  habitsTotal: number
  habitCompletionRate: number   // 0-1
  focusMinutes: number          // total de pomodoros
  pomodoroSessions: number
  workoutCompleted: boolean
  workoutVolume: number
  workoutDuration: number
  waterGlasses: number
  followUpsCompleted: number
  devotionalCompleted: boolean
  xpEarned: number
  streakDay: number             // snapshot del streak ese día
  productivityScore: number     // score compuesto 0-100
}
```

### Productivity Score Algorithm
```typescript
function calculateProductivityScore(day: DailySummary): number {
  const weights = {
    habitRate:    0.30,   // 30% — completion de hábitos
    focusHours:   0.25,   // 25% — horas de foco (meta: 4h)
    spiritual:    0.20,   // 20% — devocional + seguimientos
    physical:     0.15,   // 15% — gym
    tasks:        0.10,   // 10% — tareas completadas (normalizado)
  }
  // Implementación con normalización 0-100
}
```

### Chart APIs (optimizadas para Recharts)
- `GET /analytics/habits/chart?period=week` → [{date, completed, total}]
- `GET /analytics/focus/chart?period=week` → [{date, minutes}]
- `GET /analytics/physical/chart?period=month` → [{date, weight, sessions}]
- `GET /analytics/xp/chart?period=month` → [{date, earned, total}]
- `GET /analytics/radar` → [{category, value}] para RadarChart

---

## 13. DEVOPS Y DEPLOYMENT

### Docker Compose (development)
```yaml
services:
  api:         # NestJS
  db:          # PostgreSQL 16
  redis:       # Redis 7
  worker:      # BullMQ workers (misma imagen que api)
  redis-insight: # UI para Redis debug
```

### Estructura de archivos Docker
```
Dockerfile          # multi-stage: builder + runner
docker-compose.yml  # development
docker-compose.prod.yml  # production overrides
.dockerignore
```

### CI/CD con GitHub Actions
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test: lint + typecheck + unit tests + integration tests
  build: docker build
  deploy: on main → deploy to Railway/Fly.io
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_PRIVATE_KEY=  # RS256 private key (base64)
JWT_PUBLIC_KEY=   # RS256 public key (base64)
JWT_ACCESS_TTL=900      # 15 min en segundos
JWT_REFRESH_TTL=2592000 # 30 días

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_PRIVATE=
CLOUDFLARE_R2_BUCKET_PUBLIC=
CLOUDFLARE_R2_PUBLIC_URL=

# App
FRONTEND_URL=https://kingdom.os
NODE_ENV=production
PORT=3000

# Encryption
VAULT_MASTER_KEY=  # 32 bytes base64 para cifrado vault

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@kingdom.os
```

### Railway/Fly.io Deployment
- API: 2 replicas mínimo, autoscaling hasta 10
- Workers: 1 replica (BullMQ workers)
- PostgreSQL: Railway managed o Neon (serverless)
- Redis: Upstash (serverless con REST API)

---

## 14. ESTRUCTURA DE CARPETAS (NestJS)

```
src/
├── main.ts                    # Bootstrap con helmet, cors, validation pipe
├── app.module.ts              # Root module
│
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   └── storage.config.ts
│
├── common/
│   ├── decorators/            # @CurrentUser, @Public, @Roles
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── interceptors/          # TransformInterceptor, LoggingInterceptor
│   ├── filters/               # GlobalExceptionFilter
│   ├── pipes/                 # ZodValidationPipe
│   └── pagination/            # CursorPaginationDto, PaginationMeta
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/        # jwt.strategy.ts, refresh.strategy.ts
│   │   └── dto/
│   │
│   ├── habits/
│   │   ├── habits.module.ts
│   │   ├── habits.controller.ts
│   │   ├── habits.service.ts
│   │   └── dto/
│   │
│   ├── pomodoro/
│   ├── tasks/
│   ├── projects/
│   ├── routine/
│   ├── physical/
│   ├── ministry/
│   ├── vault/
│   ├── gamification/
│   │   ├── gamification.module.ts
│   │   ├── gamification.service.ts    # XP engine, badge evaluator
│   │   ├── streak.service.ts
│   │   └── badge-evaluator.service.ts
│   │
│   ├── analytics/
│   └── realtime/              # WebSocket Gateway
│
├── jobs/                      # BullMQ processors
│   ├── analytics.processor.ts
│   ├── gamification.processor.ts
│   ├── reminders.processor.ts
│   └── cleanup.processor.ts
│
├── prisma/
│   ├── prisma.service.ts      # PrismaService with health check
│   └── schema.prisma
│
├── redis/
│   └── redis.service.ts       # Cache helper methods
│
└── storage/
    ├── storage.service.ts     # R2 presigned URLs
    └── encryption.service.ts  # Vault AES-256-GCM
```

---

## 15. TESTING STRATEGY

### Unit Tests (Jest)
- GamificationService: XP calculations, badge conditions
- StreakService: timezone-aware streak calculations
- EncryptionService: encrypt/decrypt roundtrip
- Analytics: productivity score calculation

### Integration Tests (Jest + SuperTest)
- Auth flow: register → login → refresh → logout
- Habit flow: create → log → check stats → streak update
- Gamification: complete habit → XP awarded → badge checked

### E2E Tests (Jest + PrismaClient + real DB)
- Full user journey test
- Concurrent habit completions (no double-counting XP)
- Streak calculation across timezone boundaries

### Test Database
- Docker PostgreSQL para tests
- Migrations auto-run antes de tests
- Seed data con factories (faker.js)
- Rollback en cada test suite

---

## OUTPUT ESPERADO

Por favor entrega en este orden:

1. **Decisión de arquitectura** con justificación y diagrama ASCII
2. **Stack final** con table de decisiones y costos
3. **schema.prisma completo** — todos los modelos
4. **AuthModule completo** — código real NestJS
5. **Endpoints list** — tabla completa por módulo
6. **GamificationService** — código real del engine XP + badges
7. **RealtimeGateway** — código real WebSocket
8. **BullMQ processors** — código real de los jobs
9. **StorageService + VaultEncryption** — código real
10. **Docker Compose** — development y production
11. **GitHub Actions CI/CD** — workflow completo
12. **Environment variables** — lista completa con descripción
13. **Performance checklist** — índices DB, cache strategy, CDN
14. **Security checklist** — OWASP, headers, rate limits

---

## CONSTRAINTS Y REQUISITOS NO-FUNCIONALES

- **Latencia**: < 200ms para 95th percentile en reads
- **Throughput**: 1000 req/s por instancia mínimo
- **Uptime**: 99.9% SLA
- **Data retention**: 2 años de logs detallados, siempre para analytics aggregations
- **GDPR**: export completo de datos del usuario, delete all
- **Scale target**: 0 → 10k usuarios sin cambio de arquitectura
- **Cost target**: < $50/mes a 1k usuarios activos

NO omitas ningún detalle. Quiero arquitectura nivel startup unicornio lista para producción.
