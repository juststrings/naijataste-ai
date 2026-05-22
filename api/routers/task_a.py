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
    preferred_language: Optional[str] = None


class SimulateReviewResponse(BaseModel):
    rating: int
    review_text: str
    tone_label: str


class AdjustReviewRequest(BaseModel):
    original_review: str
    feedback: str
    original_persona: dict = {}


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

    # Append language rule
    prompt += (
        "\n\nLANGUAGE RULE:\n"
        "You are writing this review as a Nigerian user. Detect the language from the "
        "restaurant name, location, and features provided.\n"
        "If the context contains Yoruba words, write the review in Yoruba.\n"
        "If Hausa, write in Hausa. If Igbo, write in Igbo. If Pidgin, write in Pidgin.\n"
        "If English only, write in English. If unclear, default to Nigerian Pidgin.\n"
        "If preferred_language is explicitly provided, use that language regardless "
        "of auto-detection.\n"
        "The review_text must be entirely in one language. Do not mix languages."
    )
    if body.preferred_language:
        prompt += f"\nWrite this review in {body.preferred_language} only."

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


@router.post("/adjust-review", response_model=SimulateReviewResponse)
def adjust_review(body: AdjustReviewRequest):
    persona = body.original_persona
    tone_hint = persona.get("rating_tendency", "balanced")

    prompt = (
        f'Here is a simulated restaurant review written by a {tone_hint} Nigerian reviewer:\n'
        f'"{body.original_review}"\n\n'
        f"The user wants these adjustments: {body.feedback}\n\n"
        "Rewrite the review incorporating the feedback while keeping the same Nigerian voice and persona style.\n\n"
        "IMPORTANT: Return ONLY this JSON object — no explanation, no markdown:\n"
        '{"rating": <integer 1-5>, "review_text": "<review>", '
        '"tone_label": "<pidgin-heavy|mixed|formal|casual>"}'
    )

    result = generate_json(prompt)

    return SimulateReviewResponse(
        rating=int(result["rating"]),
        review_text=str(result["review_text"]),
        tone_label=str(result["tone_label"]),
    )
