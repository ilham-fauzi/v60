// ============================================================
// BrewMaster AI - Core Type Definitions
// ============================================================

export type BrewMethod = 'v60' | 'aeropress' | 'french_press' | 'chemex' | 'kalita' | 'custom'
export type GrindSize = 'extra_fine' | 'fine' | 'medium_fine' | 'medium' | 'medium_coarse' | 'coarse' | 'extra_coarse'
export type ScanType = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark'
export type ScaleType = 'acaia_pearl' | 'acaia_lunar' | 'timemore' | 'felicita' | 'mock'

// ------- Recipe & Stages -------

export interface BrewStage {
  id: string
  name: string
  targetWeight: number       // grams of water to pour in this stage
  targetSeconds: number      // duration of this stage in seconds
  temperature: number        // water temperature °C (0 = no heat requirement)
  notes?: string
}

export interface Recipe {
  id: string
  name: string
  method: BrewMethod
  coffeeGrams: number
  waterGrams: number
  ratio: number              // e.g. 15 means 1:15
  grindSize: GrindSize
  temperature: number        // °C
  stages: BrewStage[]
  roastType?: ScanType
  beanOrigin?: string        // e.g. "Ethiopia Yirgacheffe"
  notes?: string
  createdAt: string          // ISO date
  updatedAt: string          // ISO date
  aiGenerated?: boolean
}

// ------- Brew Session -------

export interface WeightDataPoint {
  timestamp: number          // ms since brew start
  weight: number             // grams
  flowRate: number           // g/s
}

export interface BrewSession {
  id: string
  recipeId: string
  startedAt: string          // ISO date
  completedAt?: string       // ISO date
  history: WeightDataPoint[]
  finalWeight: number
  sensoryFeedback?: SensoryFeedback
  aiOptimizations?: AIOptimization[]
}

// ------- Sensory Feedback -------

export interface SensoryFeedback {
  sweetness: 1 | 2 | 3 | 4 | 5    // 1=not sweet, 5=very sweet
  acidity: 1 | 2 | 3 | 4 | 5
  bitterness: 1 | 2 | 3 | 4 | 5
  body: 1 | 2 | 3 | 4 | 5          // 1=thin, 5=heavy
  overallScore: 1 | 2 | 3 | 4 | 5
  notes?: string
}

// ------- AI & Scale -------

export interface AIOptimization {
  parameter: string
  previousValue: string
  suggestedValue: string
  reason: string
}

export interface AIRecipeSuggestion {
  recipe: Partial<Recipe>
  reasoning: string
  tips: string[]
}

export interface ScaleConnectionState {
  type: ScaleType | null
  connected: boolean
  batteryLevel?: number
  lastError?: string
}

// ------- Store Slices -------

export interface BrewState {
  // Scale
  scaleConnection: ScaleConnectionState
  currentWeight: number
  targetWeight: number
  currentFlowRate: number

  // Timer
  isBrewing: boolean
  isPaused: boolean
  elapsedTime: number          // seconds (current stage)
  totalElapsedTime: number     // seconds (entire session)
  currentStageIndex: number

  // Session data
  history: WeightDataPoint[]
  currentSession: BrewSession | null
  activeRecipe: Recipe | null

  // UI
  isFocusMode: boolean
  isSidebarCollapsed: boolean
}

export interface RecipeState {
  recipes: Recipe[]
  isLoading: boolean
}

export interface AIState {
  isThinking: boolean
  lastSuggestion: string | null
  optimizations: AIOptimization[]
  error: string | null
}
