"""
Pydantic schemas — sumber kebenaran tunggal untuk request/response.
Tidak ada lagi SQLAlchemy model; id sekarang bertipe str (Firestore document ID).
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import date, datetime


# ---------- Food ----------
class FoodBase(BaseModel):
    name: str
    category: str
    image_url: Optional[str] = None
    calories: float
    protein: float
    fat: float
    carbs: float
    serving_size: float = 100.0
    # Optional enriched fields (added in dataset expansion v2).
    subcategory: Optional[str] = None
    source: Optional[str] = None                  # e.g. "Panganku Indonesia", "USDA FDC"
    serving_unit: Optional[str] = None            # "g", "portion", "piece"
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None                # milligrams


class FoodCreate(FoodBase):
    pass


class FoodOut(FoodBase):
    id: str  # Firestore document ID (string)

    class Config:
        from_attributes = True


# ---------- User ----------
ActivityLevel = Literal["sedentary", "light", "moderate", "very_active", "athlete"]
Goal = Literal["weight_loss", "maintenance", "muscle_gain"]
Sex = Literal["male", "female"]
DietaryPreference = Literal["none", "vegetarian", "vegan", "halal", "pescatarian"]


class UserBase(BaseModel):
    name: str = "User"
    age: int = Field(..., gt=0, lt=120)
    sex: Sex
    weight: float = Field(..., gt=0, lt=400)
    height: float = Field(..., gt=0, lt=260)
    activity_level: ActivityLevel = "moderate"
    goal: Goal = "maintenance"


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[Sex] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None
    goal: Optional[Goal] = None
    # Optional personalisation fields — all backwards-compatible.
    target_weight: Optional[float] = Field(None, gt=20, lt=400)
    dietary_preference: Optional[DietaryPreference] = None
    allergies: Optional[List[str]] = None
    meal_frequency: Optional[int] = Field(None, ge=2, le=6)


class UserOut(UserBase):
    age: int = Field(0, ge=0, lt=120)
    weight: float = Field(0.0, ge=0, lt=400)
    height: float = Field(0.0, ge=0, lt=260)
    id: str  # Firestore document ID (string)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_complete: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    target_weight: Optional[float] = None
    dietary_preference: Optional[DietaryPreference] = None
    allergies: Optional[List[str]] = None
    meal_frequency: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Auth ----------
class RegisterIn(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileSetupIn(BaseModel):
    age: int = Field(..., gt=0, lt=120)
    sex: Sex
    weight: float = Field(..., gt=0, lt=400)
    height: float = Field(..., gt=0, lt=260)
    activity_level: ActivityLevel = "moderate"
    goal: Goal = "maintenance"


class TokenPair(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Targets ----------
class MetabolicTargets(BaseModel):
    bmr: float
    tdee: float
    target_calories: float
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float


# ---------- Log items ----------
class LogItemCreate(BaseModel):
    food_id: str  # Firestore document ID (string)
    grams: float = Field(..., gt=0)


class LogItemOut(BaseModel):
    id: str  # Firestore document ID (string)
    food_id: str
    grams: float
    food: FoodOut


class DailyLogOut(BaseModel):
    id: str       # format: YYYY-MM-DD (digunakan sebagai doc ID)
    user_id: str
    date: date
    items: List[LogItemOut]


# ---------- Analysis ----------
class MacroIntake(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


class DeficiencyInsight(BaseModel):
    nutrient: str
    severity: Literal["low", "medium", "high"]
    message: str
    delta: float  # gram atau kcal (negatif = defisit, positif = surplus)


class QualityScores(BaseModel):
    protein_density: float  # protein g / kcal
    energy_density: float   # kcal / g of food
    macro_balance_score: float  # 0–100


class AnalysisOut(BaseModel):
    targets: MetabolicTargets
    intake: MacroIntake
    fulfillment_pct: MacroIntake
    quality: QualityScores
    insights: List[DeficiencyInsight]


# ---------- Optimization ----------
class RecommendationItem(BaseModel):
    food: FoodOut
    grams: float
    added_calories: float
    added_protein: float
    added_carbs: float
    added_fat: float


class OptimizationOut(BaseModel):
    status: str
    objective_value: float
    recommendations: List[RecommendationItem]
    projected_intake: MacroIntake
    projected_fulfillment_pct: MacroIntake


# ---------- Meal Planner ----------
MealKey = Literal["breakfast", "lunch", "dinner", "snack"]


class MealSlotOut(BaseModel):
    meal: MealKey
    share: float           # 0..1 of daily target this meal targets
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    items: List[RecommendationItem]
    totals: MacroIntake
    status: str            # ILP solver status for this slot
    objective_value: float


class DailyMealPlanOut(BaseModel):
    id: str                # YYYY-MM-DD
    user_id: str
    date: date
    targets: MetabolicTargets
    distribution: dict[str, float]   # meal -> share (sums to 1)
    meals: List[MealSlotOut]
    totals: MacroIntake
    fulfillment_pct: MacroIntake


class WeeklyMealPlanOut(BaseModel):
    user_id: str
    start_date: date
    end_date: date
    days: List[DailyMealPlanOut]


class MealPlanGenerateIn(BaseModel):
    start_date: Optional[date] = None
    distribution: Optional[dict[str, float]] = None     # custom meal splits, must sum to 1
    days: int = Field(7, ge=1, le=14)
    overwrite: bool = True


class GroceryEntry(BaseModel):
    food: FoodOut
    total_grams: float
    pieces: Optional[float] = None                       # for whole-fruit categories
    appearances: int                                     # how many meal slots this food shows in


class GroceryListOut(BaseModel):
    user_id: str
    start_date: date
    end_date: date
    days_covered: int
    entries: List[GroceryEntry]


# ---------- Progress / weight tracking ----------
class WeightLogIn(BaseModel):
    date: Optional[date] = None
    weight: float = Field(..., gt=20, lt=400)
    note: Optional[str] = Field(None, max_length=200)


class WeightLogOut(BaseModel):
    id: str
    date: date
    weight: float
    note: Optional[str] = None
    created_at: Optional[datetime] = None


class DailyComplianceOut(BaseModel):
    date: date
    intake: MacroIntake
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    score: float                  # 0..100 calorie+macro adherence
    energy_balance_kcal: float    # intake - target (negative = deficit)
    macro_share: dict[str, float] # actual % of kcal: protein/carbs/fat


class AdherenceSummary(BaseModel):
    days: int                     # window size (e.g., 7)
    calorie_score: float
    protein_score: float
    carbs_score: float
    fat_score: float
    nas: float                    # nutrition adherence score 0..100
    classification: Literal["Poor", "Fair", "Good", "Excellent"]
    avg_energy_balance: float
    days_protein_target_met: int
    insights: List[str]


class ProgressOut(BaseModel):
    user_id: str
    window_days: int
    daily: List[DailyComplianceOut]
    summary: AdherenceSummary
    weight_history: List[WeightLogOut]
    weight_change_kg: Optional[float] = None
