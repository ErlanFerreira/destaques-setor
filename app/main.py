from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from . import config
from .db import get_db
from .models import Funcionario, Lider, Setor, Voto
from .security import COOKIE_MAX_AGE, COOKIE_NAME, cookie_resultados_valido, criar_cookie_resultados
from .seed import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/lideres")
def api_lideres(setor_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Lider)
        .filter(Lider.setor_id == setor_id)
        .order_by(Lider.nome.asc())
        .all()
    )
    return {"lideres": [{"id": r.id, "nome": r.nome} for r in rows]}


@app.get("/api/lideres/todos")
def api_lideres_todos(db: Session = Depends(get_db)):
    rows = db.query(Lider).join(Setor, Lider.setor_id == Setor.id).order_by(Lider.nome.asc()).all()
    return {"lideres": [{"id": r.id, "nome": r.nome, "setor": r.setor.nome} for r in rows]}


@app.get("/api/funcionarios")
def api_funcionarios(lider_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Funcionario)
        .filter(Funcionario.lider_id == lider_id)
        .order_by(Funcionario.nome.asc())
        .all()
    )
    return {"funcionarios": [{"id": r.id, "nome": r.nome} for r in rows]}


@app.post("/api/votos")
def api_votos_criar(payload: dict, db: Session = Depends(get_db)):
    lider_id = payload.get("lider_id")
    funcionario_id = payload.get("funcionario_id")
    if not lider_id or not funcionario_id:
        return JSONResponse({"erro": "Selecione seu nome e o destaque do setor."}, status_code=400)

    lider = db.query(Lider).filter(Lider.id == lider_id).first()
    if not lider:
        return JSONResponse({"erro": "Líder não encontrado."}, status_code=404)

    funcionario = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not funcionario or funcionario.lider_id != lider.id:
        return JSONResponse({"erro": "Funcionário inválido para este líder."}, status_code=400)

    if db.query(Voto).filter(Voto.lider_id == lider.id).first():
        return JSONResponse(
            {"erro": "Você já registrou o destaque do seu setor nesta rodada."},
            status_code=409,
        )

    voto = Voto(lider_id=lider.id, funcionario_id=funcionario.id)
    db.add(voto)
    db.commit()
    return {"ok": True}


@app.get("/resultados", response_class=HTMLResponse)
def resultados(request: Request, db: Session = Depends(get_db)):
    if not cookie_resultados_valido(request.cookies.get(COOKIE_NAME)):
        return templates.TemplateResponse("resultados_login.html", {"request": request, "erro": None})

    votos = (
        db.query(Voto)
        .join(Lider, Voto.lider_id == Lider.id)
        .join(Setor, Lider.setor_id == Setor.id)
        .order_by(Setor.nome.asc(), Lider.nome.asc())
        .all()
    )

    setores = {}
    for v in votos:
        setor_nome = v.lider.setor.nome
        setores.setdefault(setor_nome, []).append(
            {
                "lider": v.lider.nome,
                "destaque": v.funcionario.nome,
                "data": v.criado_em.strftime("%d/%m/%Y %H:%M") if v.criado_em else "",
            }
        )
    grupos = [{"setor": nome, "itens": itens} for nome, itens in sorted(setores.items())]

    return templates.TemplateResponse("resultados.html", {"request": request, "grupos": grupos})


@app.post("/resultados", response_class=HTMLResponse)
def resultados_login(request: Request, senha: str = Form(...)):
    if senha != config.RESULTS_KEY:
        return templates.TemplateResponse(
            "resultados_login.html",
            {"request": request, "erro": "Senha incorreta."},
            status_code=401,
        )
    resp = RedirectResponse(url="/resultados", status_code=303)
    resp.set_cookie(
        COOKIE_NAME,
        criar_cookie_resultados(),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
    )
    return resp
