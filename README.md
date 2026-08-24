# Destaque do Setor

Formulário público (sem login) para que cada líder escolha o colaborador
destaque da sua equipe. O líder acessa o link, seleciona seu setor, seleciona
seu nome (dentre os líderes daquele setor) e escolhe o destaque entre os
liderados que aparecem automaticamente.

## Como funciona

1. Você importa uma planilha com a relação `setor / líder / funcionário`
   (uma linha por funcionário) usando `scripts/importar_planilha.py`.
2. Você compartilha o link do formulário com os líderes.
3. Cada líder só pode votar uma vez (tentativa de votar de novo mostra aviso).
4. Você acompanha os votos em `/resultados` — a página pede uma senha (definida
   na variável de ambiente `RESULTS_KEY`) e mostra os destaques agrupados por
   setor.

Por ser uma pesquisa pontual, não há histórico de rodadas — para uma nova
rodada, os votos antigos podem ser apagados do banco (ou avise para eu
adicionar suporte a rodadas com data).

## Rodando localmente

```bash
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8001
```

Sem `DATABASE_URL` preenchido, usa um arquivo SQLite local (`local.db`).

### Importar a planilha

```bash
python scripts/importar_planilha.py caminho/para/planilha.xlsx
```

A planilha precisa ter cabeçalho com as colunas `setor`, `lider`,
`funcionario` (uma linha por funcionário). Pode rodar de novo com uma
planilha atualizada — não duplica quem já existe.

## Deploy (Vercel + Neon)

1. Crie um projeto novo no [neon.tech](https://neon.tech) (banco separado do
   projeto de pendências) e copie a connection string **pooled**.
2. Suba este diretório como um repositório novo no GitHub.
3. Em [vercel.com](https://vercel.com), importe o repositório. O
   `vercel.json` já configura o runtime Python.
4. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string pooled da Neon |
   | `RESULTS_KEY` | a senha para acessar `/resultados` |
   | `SECRET_KEY` | string aleatória longa (gere com `python -c "import secrets; print(secrets.token_hex(32))"`) |

5. Deploy. Depois, rode o script de importação apontando `DATABASE_URL` para
   o mesmo banco da Neon (defina a variável no seu `.env` local antes de
   rodar `scripts/importar_planilha.py`).
6. Compartilhe a URL `*.vercel.app` com os líderes.

## Estrutura

```
app/
  main.py       rotas (formulário, APIs de setor/líder/funcionário, votos, resultados)
  config.py     variáveis de ambiente
  db.py         conexão SQLAlchemy
  models.py     tabelas: setores, lideres, funcionarios, votos
  seed.py       cria as tabelas na primeira subida
templates/      index.html (formulário) e resultados.html
static/         app.css + form.js
scripts/importar_planilha.py   importa a planilha de setor/líder/funcionário
```
