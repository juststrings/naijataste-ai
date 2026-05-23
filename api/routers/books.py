from pydantic import BaseModel

from fastapi import APIRouter
from core.gemini_client import generate_json

router = APIRouter()


class RestaurantHint(BaseModel):
    name: str
    vicinity: str = ""
    types: list[str] = []


class BooksRequest(BaseModel):
    restaurants: list[RestaurantHint]
    persona: str = "Curious Taster"


class BookItem(BaseModel):
    title: str
    author: str
    reason: str
    goodreads_url: str


class BooksResponse(BaseModel):
    books: list[BookItem]


@router.post("/books", response_model=BooksResponse)
def recommend_books(body: BooksRequest):
    restaurant_lines = "\n".join(
        f"- {r.name} ({', '.join(r.types[:3]) or 'restaurant'}) — {r.vicinity}"
        for r in body.restaurants[:5]
    )

    prompt = (
        f"Based on these Nigerian restaurant recommendations:\n{restaurant_lines}\n\n"
        f"And this user persona: {body.persona}\n\n"
        "Suggest 2 Nigerian books that match the cultural energy of these food picks.\n\n"
        "Rules:\n"
        "- Only suggest Nigerian authors or books about Nigeria\n"
        "- Match the vibe: buka/local food → grounded authentic books; "
        "fine dining → sharp sophisticated books; "
        "street food/suya → energetic Lagos street-life books; "
        "seafood/coastal → books with coastal Nigerian themes\n"
        "- goodreads_url must be in the format: "
        "https://www.goodreads.com/search?q=title+author (URL-encoded, spaces as +)\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"books": [{"title": "...", "author": "...", "reason": "one line why it matches the food vibe", '
        '"goodreads_url": "https://www.goodreads.com/search?q=..."}]}'
    )

    result = generate_json(prompt, max_tokens=600)

    books = []
    for b in result.get("books", [])[:2]:
        title = str(b.get("title", ""))
        author = str(b.get("author", ""))
        fallback_url = (
            "https://www.goodreads.com/search?q="
            + "+".join((title + " " + author).split())
        )
        books.append(BookItem(
            title=title,
            author=author,
            reason=str(b.get("reason", "")),
            goodreads_url=str(b.get("goodreads_url", fallback_url)) or fallback_url,
        ))

    return BooksResponse(books=books)
