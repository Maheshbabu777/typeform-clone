from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Typeform Clone API"
    database_url: str = Field(default="typeform_clone.db", alias="DATABASE_URL")
    allowed_origins: str = Field(
        default="http://localhost:3000",
        alias="ALLOWED_ORIGINS",
    )

    @property
    def database_path(self) -> Path:
        raw_path = Path(self.database_url)
        if raw_path.is_absolute():
            return raw_path
        return Path(__file__).resolve().parents[1] / raw_path

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

