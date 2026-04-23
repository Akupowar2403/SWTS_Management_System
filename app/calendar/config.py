from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
