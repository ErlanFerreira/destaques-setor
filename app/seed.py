from . import models  # noqa: F401  (garante que as tabelas sejam registradas)
from .db import Base, engine


def init_db():
    Base.metadata.create_all(bind=engine)
