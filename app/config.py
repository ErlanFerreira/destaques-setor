import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./local.db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

RESULTS_KEY = os.environ.get("RESULTS_KEY", "troque-esta-chave")

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-troque-em-producao")
