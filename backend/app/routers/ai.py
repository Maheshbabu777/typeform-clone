import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError

from app.config import get_settings
from app.database import get_connection
from app.schemas import FormCreate, QuestionCreate
from app.routers.forms import create_form, update_form
from app.schemas import FormUpdate
from app.routers.questions import create_question

from slowapi import Limiter

def get_real_ip(request: Request) -> str:
    if forwarded_for := request.headers.get("X-Forwarded-For"):
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])
limiter = Limiter(key_func=get_real_ip)

class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=1000)

class AIGenerateResponse(BaseModel):
    form_id: int

# --- Pydantic Schema for Gemini Structured Output ---
class GeneratedQuestion(BaseModel):
    type: str = Field(description="Must be one of: short_text, long_text, multiple_choice, dropdown, yes_no, rating, email, phone_number, website, date, statement.")
    title: str = Field(description="The actual question text.")
    description: str | None = Field(default=None, description="Optional subtext.")
    required: bool
    options: list[str] | None = Field(default=None, description="Required ONLY for multiple_choice and dropdown types. At least 2 options.")

class GeneratedForm(BaseModel):
    title: str = Field(description="A catchy, short title for the form.")
    welcome_title: str = Field(description="The big headline on the welcome screen.")
    welcome_description: str | None = Field(default=None, description="A subtitle or instructions for the welcome screen.")
    questions: list[GeneratedQuestion] = Field(description="Exactly 5 to 8 questions matching the user's request. Mix question types.")

settings = get_settings()
GEMINI_API_KEY = settings.gemini_api_key

if GEMINI_API_KEY and GEMINI_API_KEY != "dummy_key_replace_me":
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None

@router.post("/generate", response_model=AIGenerateResponse)
@limiter.limit("3/minute")
async def generate_form_with_ai(request: Request, payload: AIGenerateRequest):
    if not client:
        raise HTTPException(status_code=503, detail="AI features are not configured on this server.")
    
    system_instruction = """
    You are an expert form designer for a Typeform-like platform.
    Your job is to take a user's prompt and design a highly engaging, frictionless form.
    
    Rules:
    1. Create 5 to 8 questions total.
    2. Use a diverse mix of question types (e.g. yes_no, multiple_choice, rating, short_text, email).
    3. Keep questions clear and conversational.
    4. For multiple_choice and dropdown, provide 2-5 realistic options.
    5. Start with easier questions (like multiple_choice or rating) and leave heavier text input for the end.
    6. ALWAYS respond matching the provided JSON schema EXACTLY.
    """
    
    try:
        response = None
        last_error = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model='gemini-1.5-flash-8b',
                    contents=payload.prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeneratedForm,
                        system_instruction=system_instruction,
                        temperature=0.7,
                    ),
                )
                break
            except Exception as e:
                last_error = e
                if "503" in str(e) and attempt < 2:
                    logger.warning(f"503 Unavailable on attempt {attempt+1}. Retrying in 2s...")
                    await asyncio.sleep(2)
                else:
                    raise e
                    
        if not response:
            raise last_error or ValueError("Failed to generate content")
        
        raw_text = response.text
        if not raw_text:
            raise ValueError("Empty response from AI")
            
        data = json.loads(raw_text)
        
        form_title = data.get("title", "Generated Form")
        form_payload = FormCreate(title=form_title)
        
        with get_connection() as conn:
            new_form = create_form(form_payload)
            form_id = new_form["id"]
            
            update_form(form_id, FormUpdate(
                settings={
                    "welcome_title": data.get("welcome_title", form_title),
                    "welcome_description": data.get("welcome_description", ""),
                }
            ))
            
            questions = data.get("questions", [])
            for q in questions:
                q_type = q.get("type", "short_text")
                valid_types = {"short_text", "long_text", "multiple_choice", "dropdown", "yes_no", "rating", "email", "phone_number", "website", "date", "statement"}
                if q_type not in valid_types:
                    q_type = "short_text"
                    
                options = q.get("options")
                
                if q_type in ("multiple_choice", "dropdown"):
                    if not options or len(options) < 2:
                        options = ["Option 1", "Option 2"]
                elif q_type not in ("multiple_choice", "dropdown"):
                    options = None
                    
                q_payload = QuestionCreate(
                    type=q_type,
                    title=q.get("title", "Untitled Question"),
                    description=q.get("description", ""),
                    required=bool(q.get("required", False)),
                    options=options
                )
                create_question(form_id, q_payload)
                
            return {"form_id": form_id}
            
    except ValidationError as e:
        logger.error(f"Pydantic Validation Error during AI Generation: {e}")
        raise HTTPException(status_code=500, detail="AI generated invalid form data.")
    except Exception as e:
        logger.exception("AI Generation failed with an unexpected error:")
        raise HTTPException(status_code=503, detail=f"AI generation failed: {e}")
