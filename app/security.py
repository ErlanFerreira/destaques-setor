from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from . import config

serializer = URLSafeTimedSerializer(config.SECRET_KEY, salt="resultados")

COOKIE_NAME = "resultados_auth"
COOKIE_MAX_AGE = 60 * 60 * 8  # 8 horas


def criar_cookie_resultados() -> str:
    return serializer.dumps({"ok": True})


def cookie_resultados_valido(token: str | None) -> bool:
    if not token:
        return False
    try:
        data = serializer.loads(token, max_age=COOKIE_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return False
    return data.get("ok") is True
