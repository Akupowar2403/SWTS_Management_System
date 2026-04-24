from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-production"

    KEYCLOAK_URL: str = "http://localhost:8080"        # used internally to fetch JWKS
    KEYCLOAK_ISSUER_URL: str = ""                      # public URL in token iss claim (defaults to KEYCLOAK_URL)
    KEYCLOAK_REALM: str = "swts-realm"
    KEYCLOAK_CLIENT_ID: str = "swts-app"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
