from pydantic import BaseModel
from typing import Optional

class Garment(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    image_url: str 