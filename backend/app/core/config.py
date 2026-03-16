from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Haikou Yummy API"
    MONGODB_URL: str = "mongodb://localhost:27017" # Default, overridden by .env
    DATABASE_NAME: str = "haikou_yummy"

    class Config:
        env_file = ".env"

settings = Settings()
