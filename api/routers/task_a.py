from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.gemini_client import generate_json
from core.voice import build_review_prompt
from core.yelp_loader import PersonaEncoder

router = APIRouter()


class SimulateReviewRequest(BaseModel):
    user_id: Optional[str] = None
    persona: Optional[dict] = None
    item_name: str
    item_type: str
    location: str
    features: list[str]


class SimulateReviewResponse(BaseModel):
    rating: int
    review_text: str
    tone_label: str


@router.post("/simulate-review", response_model=SimulateReviewResponse)
def simulate_review(body: SimulateReviewRequest):
    # Resolve persona
    if body.user_id:
        persona = PersonaEncoder(body.user_id)
    elif body.persona:
        persona = body.persona
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either user_id (to look up from Yelp data) or a persona dict directly.",
        )

    item = {
        "item_name": body.item_name,
        "item_type": body.item_type,
        "location": body.location,
        "features": body.features,
    }

    prompt = build_review_prompt(persona, item)

    # Append strict output instruction so Gemini doesn't stray from the schema
    prompt += (
        "\n\nIMPORTANT: Return ONLY this JSON object — no explanation, no markdown:\n"
        '{"rating": <integer 1-5>, "review_text": "<review>", '
        '"tone_label": "<pidgin-heavy|mixed|formal|casual>"}'
    )

    result = generate_json(prompt)

    return SimulateReviewResponse(
        rating=int(result["rating"]),
        review_text=str(result["review_text"]),
        tone_label=str(result["tone_label"]),
    )
