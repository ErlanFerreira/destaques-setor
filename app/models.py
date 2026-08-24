import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .db import Base


class Setor(Base):
    __tablename__ = "setores"

    id = Column(Integer, primary_key=True)
    nome = Column(String(120), unique=True, nullable=False)

    lideres = relationship("Lider", back_populates="setor")
    funcionarios = relationship("Funcionario", back_populates="setor")


class Lider(Base):
    __tablename__ = "lideres"

    id = Column(Integer, primary_key=True)
    nome = Column(String(255), nullable=False)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)

    setor = relationship("Setor", back_populates="lideres")
    funcionarios = relationship("Funcionario", back_populates="lider")


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(255), nullable=False)
    setor_id = Column(Integer, ForeignKey("setores.id"), nullable=False)
    lider_id = Column(Integer, ForeignKey("lideres.id"), nullable=False)

    setor = relationship("Setor", back_populates="funcionarios")
    lider = relationship("Lider", back_populates="funcionarios")


class Voto(Base):
    __tablename__ = "votos"
    __table_args__ = (UniqueConstraint("lider_id", name="uq_voto_por_lider"),)

    id = Column(Integer, primary_key=True)
    lider_id = Column(Integer, ForeignKey("lideres.id"), nullable=False)
    funcionario_id = Column(Integer, ForeignKey("funcionarios.id"), nullable=False)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)

    lider = relationship("Lider")
    funcionario = relationship("Funcionario")
