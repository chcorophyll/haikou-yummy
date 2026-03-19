from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_validator
from typing import List, Optional, Any

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class RestaurantBase(BaseModel):
    name: str = Field(..., description="The name of the restaurant")
    category: List[str] = Field(default_factory=list, description="Categories like 'Seafood', 'Snack'")
    location: GeoJSONPoint = Field(..., description="GeoJSON Point")
    address: Optional[str] = Field(None, description="Physical address")
    images: List[Any] = Field(default_factory=list, description="List of image URLs")
    price_per_person: Optional[float] = Field(None, description="Average price per person")
    opening_hours: Optional[str] = Field(None, description="Opening hours of the restaurant")
    rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Rating from 0.0 to 5.0")
    source: str = Field("pgc", description="Source of the data: pgc, crawler, or ugc")
    is_verified: bool = Field(False, description="Whether the restaurant is verified by admin")
    telephone: Optional[str] = Field(None, description="Contact phone number")
    reason: Optional[str] = Field(None, description="Reason for recommendation (UGC)")

    @field_validator('address', mode='before')
    @classmethod
    def validate_address(cls, v: Any) -> Optional[str]:
        if isinstance(v, list):
            return ", ".join(v) if v else None
        return v

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[List[str]] = None
    location: Optional[GeoJSONPoint] = None
    address: Optional[str] = None
    images: Optional[List[Any]] = None
    price_per_person: Optional[float] = None
    opening_hours: Optional[str] = None
    rating: Optional[float] = None
    is_verified: Optional[bool] = None
    reason: Optional[str] = None

class RestaurantInDB(RestaurantBase):
    id: str = Field(..., alias="_id", description="MongoDB output _id")
    model_config = ConfigDict(populate_by_name=True)
