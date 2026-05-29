from fastapi import FastAPI

from .middleware.cors import setup_cors
from .controllers import (
    analysis,
    auth,
    foods,
    logs,
    meal_plan,
    progress,
    users,
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="MacroPlus — Computational Nutrition Decision Support System",
        description=(
            "Metabolic modelling (Mifflin-St Jeor), AMDR macronutrient targets, "
            "multi-objective ILP optimisation (PuLP/CBC), meal planning, "
            "grocery aggregation, and longitudinal nutritional adherence."
        ),
        version="2.0.0",
    )

    setup_cors(app)

    # Controllers (routers)
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(foods.router)
    app.include_router(logs.router)
    app.include_router(analysis.router)
    app.include_router(meal_plan.router)
    app.include_router(meal_plan.me_router)
    app.include_router(progress.router)
    app.include_router(progress.me_router)

    @app.get("/", tags=["health"], summary="Health check")
    def root():
        return {
            "name": "MacroPlus API",
            "version": "2.0.0",
            "docs": "/docs",
        }

    return app


app = create_app()
