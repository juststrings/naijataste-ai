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

    # Append language detection instruction
    prompt += (
        "\n\nLANGUAGE DETECTION — CRITICAL:\n"
        "Detect the language the user is writing in and respond in that SAME language throughout.\n\n"
        "Supported languages:\n"
        "- English → respond in English\n"
        "- Nigerian Pidgin → respond in Pidgin (e.g. 'how e dey', 'na so', 'correct chop')\n"
        "- Yoruba → respond in Yoruba (e.g. 'o dara', 'jẹ ká jẹun')\n"
        "- Hausa → respond in Hausa (e.g. 'mai kyau', 'bari mu ci')\n"
        "- Igbo → respond in Igbo (e.g. 'ọ dị mma', 'ka anyị rie nri')\n\n"
        "Rules:\n"
        "- If the user writes in Yoruba, your ENTIRE response must be in Yoruba\n"
        "- If the user writes in Hausa, your ENTIRE response must be in Hausa\n"
        "- If the user writes in Igbo, your ENTIRE response must be in Igbo\n"
        "- If the user writes in Pidgin, your ENTIRE response must be in Pidgin\n"
        "- If the user writes in English, respond in English\n"
        "- If language is unclear or mixed, default to Nigerian Pidgin\n"
        "- Keep Nigerian food/restaurant names as-is regardless of language\n"
        "- Never mix languages in a single response"
    )

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
