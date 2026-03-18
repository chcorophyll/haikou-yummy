from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Haikou Yummy API"
    MONGODB_URL: str = "mongodb://localhost:27017" # Default, overridden by .env
    DATABASE_NAME: str = "haikou_yummy"
    TENCENT_MAP_KEY: Optional[str] = None
    AMAP_KEY: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
