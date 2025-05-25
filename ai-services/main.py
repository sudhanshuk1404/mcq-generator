from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import whisper
import os
import shutil
import traceback
from pydantic import BaseModel
import httpx
import json
import re
import logging
import traceback

app = FastAPI()
model = whisper.load_model("base")  # You can switch to "small" or "medium" for better results

UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"📥 File saved at: {file_path}")
        print("🔍 Running Whisper transcription...")

        result = model.transcribe(file_path, task="transcribe", verbose=False)

        print("✅ Transcription complete")
        print("📝 Transcript preview:", result.get("text", "")[:100])
        print("📊 Full result keys:", result.keys())

        # Extra logging to inspect the result structure
        if "text" not in result:
            print("⚠️ No 'text' key found in result:", result)

        return {
            "text": result.get("text", ""),
            "segments": result.get("segments", []),
        }

    except Exception as e:
        print("❌ Whisper transcription failed")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


class PromptRequest(BaseModel):
    prompt: str

#multiple-mcq 
@app.post("/generate-mcq")
async def generate_mcq(request: PromptRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "mistral",
                    "prompt": request.prompt,
                    "stream": False
                },
                timeout=180
            )
        response.raise_for_status()

        raw = response.json().get("response", "")
        print("📤 Raw LLM output:\n", raw)

        if not raw:
            raise ValueError("LLM returned empty response")

        # Example parse block (adapt as needed)
        # Try finding JSON structure
        match = re.search(r'\{[\s\S]+\}', raw)
        if not match:
            raise ValueError("No JSON block found in LLM output")

        parsed = json.loads(match.group(0))
        return parsed

    except Exception as e:
        logging.error("❌ LLM error: %s", str(e))
        traceback.print_exc()
        return {"error": f"{type(e).__name__}: {str(e)}"}

