from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:devpass@localhost/app"
    REDIS_URL: str = "redis://localhost"
    SECRET_KEY: str = "supersecretkey_change_in_production"
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
