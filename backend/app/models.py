from typing import List, Optional

from pydantic import BaseModel


class BookMatch(BaseModel):
    title: str
    authors: Optional[str] = None
    published_date: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    info_link: Optional[str] = None
    amazon_url: str = ""
    page_count: Optional[int] = None
    categories: List[str] = []
    sub_genres: List[str] = []


class ScanResponse(BaseModel):
    ocr_text: str
    query_used: str
    matches: List[BookMatch]


class TBRBook(BaseModel):
    book: BookMatch
    status: str = "tbr"  # tbr | reading | read
    added_at: str = ""
    tags: List[str] = []
