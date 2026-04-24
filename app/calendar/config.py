from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-production"

    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_ISSUER_URL: str = ""
    KEYCLOAK_REALM: str = "swts-realm"
    KEYCLOAK_CLIENT_ID: str = "swts-app"
    KEYCLOAK_ADMIN_USER: str = "admin"
    KEYCLOAK_ADMIN_PASSWORD: str = "admin"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
