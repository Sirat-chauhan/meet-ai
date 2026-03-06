import hashlib
import json
import math
from typing import Iterable

try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # type: ignore

from ..config import settings


class AIService:
    def __init__(self) -> None:
        if OpenAI and settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)
        else:
            self.client = None

    def chat_reply(self, system_prompt: str, conversation: list[dict], temperature: float = 0.7) -> str:
        if not self.client:
            return self._local_interviewer_reply(system_prompt, conversation)

        response = self.client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[{"role": "system", "content": system_prompt}, *conversation],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    def summarize_meeting(self, transcript_text: str) -> dict:
        if not transcript_text.strip():
            return {
                "summary": "No transcript was captured for this meeting.",
                "key_points": "",
                "action_items": "",
            }

        if not self.client:
            return self._local_summary(transcript_text)

        prompt = (
            "You are a meeting analyst. Return strict JSON with keys: "
            "summary (string), key_points (string), action_items (string)."
        )
        response = self.client.chat.completions.create(
            model=settings.openai_summary_model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": transcript_text},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        return {
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", ""),
            "action_items": data.get("action_items", ""),
        }

    def embed_text(self, text: str) -> list[float]:
        if self.client:
            response = self.client.embeddings.create(model=settings.openai_embedding_model, input=text)
            return response.data[0].embedding
        return self._deterministic_embedding(text)

    def answer_from_context(self, question: str, context_chunks: list[str]) -> str:
        context_text = "\n".join(f"- {chunk}" for chunk in context_chunks if chunk.strip())
        if not context_text:
            return "I could not find relevant transcript context for that question."

        if self.client:
            response = self.client.chat.completions.create(
                model=settings.openai_chat_model,
                temperature=0.2,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Answer only from provided transcript context. "
                            "If context is insufficient, say so explicitly."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Question: {question}\n\nContext:\n{context_text}",
                    },
                ],
            )
            return response.choices[0].message.content or ""

        # Local fallback answer synthesis from top matching context lines.
        return f"From meeting memory: {context_chunks[0]}"

    @staticmethod
    def cosine_similarity(v1: Iterable[float], v2: Iterable[float]) -> float:
        a = list(v1)
        b = list(v2)
        if len(a) != len(b) or not a:
            return -1.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return -1.0
        return dot / (norm_a * norm_b)

    @staticmethod
    def _deterministic_embedding(text: str, dims: int = 64) -> list[float]:
        seed = hashlib.sha256(text.encode("utf-8")).digest()
        result = []
        for i in range(dims):
            byte = seed[i % len(seed)]
            result.append((byte / 255.0) - 0.5)
        return result

    @staticmethod
    def _extract_script_questions(system_prompt: str) -> list[str]:
        marker = "Interview Script:"
        if marker not in system_prompt:
            return []
        tail = system_prompt.split(marker, 1)[1].strip()
        if tail == "N/A":
            return []
        questions = [line.strip("- ").strip() for line in tail.splitlines() if line.strip()]
        return [q for q in questions if q]

    def _local_interviewer_reply(self, system_prompt: str, conversation: list[dict]) -> str:
        script_questions = self._extract_script_questions(system_prompt)
        asked_count = sum(1 for msg in conversation if msg.get("role") == "assistant")
        last_user = ""
        for msg in reversed(conversation):
            if msg.get("role") == "user":
                last_user = (msg.get("content") or "").strip()
                break

        if not conversation:
            if script_questions:
                return script_questions[0]
            return "Thanks for joining. Please introduce yourself and your recent experience."

        if script_questions:
            base_index = asked_count
            if asked_count == 0 and last_user:
                # First question is already asked by the UI when interview starts.
                base_index = 1
            next_index = min(base_index, len(script_questions) - 1)
            if base_index < len(script_questions):
                return f"Understood. {script_questions[next_index]}"

            return (
                "Thank you. Interview complete. Quick feedback: communication is clear, "
                "responses are structured, and technical depth is promising."
            )

        if last_user:
            return (
                "Thanks. Please share one challenging project you handled, your role, and the result."
            )
        return "Please continue with your answer."

    @staticmethod
    def _local_summary(transcript_text: str) -> dict:
        lines = [line.strip() for line in transcript_text.splitlines() if line.strip()]
        preview = lines[:5]
        action_lines = [line for line in lines if any(k in line.lower() for k in ["will ", "todo", "action", "next", "follow up"])]
        if not action_lines:
            action_lines = lines[-3:] if len(lines) >= 3 else lines

        return {
            "summary": "Local summary (free mode): conversation completed with captured transcript.",
            "key_points": "\n".join(f"- {line}" for line in preview) if preview else "- No key points found.",
            "action_items": "\n".join(f"- {line}" for line in action_lines) if action_lines else "- No action items identified.",
        }


ai_service = AIService()
