import hashlib
import json
import math
import random
import time
from typing import Any, Iterable

try:
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    from langsmith import traceable
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

from ..config import settings

class AIService:
    def __init__(self) -> None:
        self.llm = None
        self.embeddings = None
        
        if LANGCHAIN_AVAILABLE and settings.openai_api_key:
            # Configure LangSmith if enabled
            if settings.langchain_tracing_v2 and settings.langchain_api_key:
                import os
                os.environ["LANGCHAIN_TRACING_V2"] = "true"
                os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
                os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
                os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"

            common_kwargs = {
                "api_key": settings.openai_api_key,
                "base_url": settings.openai_base_url or None,
            }
            
            self.llm = ChatOpenAI(
                model=settings.openai_chat_model,
                temperature=0.7,
                max_tokens=int(settings.openai_chat_max_tokens),
                **common_kwargs
            )
            
            self.embeddings = OpenAIEmbeddings(
                model=settings.openai_embedding_model,
                **common_kwargs
            )
        
        # Keep client for any direct legacy calls if needed, but we'll migrate most
        self.client = self.llm 

    @staticmethod
    def _is_langchain_enabled() -> bool:
        return LANGCHAIN_AVAILABLE and settings.openai_api_key

    @traceable
    def chat_reply(self, system_prompt: str, conversation: list[dict], temperature: float = 0.7) -> str:
        if not self.llm:
            return self._local_interviewer_reply(system_prompt, conversation)

        # Extract structured parts from system_prompt if possible
        # Realtime router format: Behavior: ... Personality: ... Interview Script: ...
        behavior = ""
        personality = ""
        script_text = ""
        if "Behavior:" in system_prompt:
            parts = system_prompt.split("Personality:", 1)
            behavior = parts[0].replace("Behavior:", "").strip()
            if len(parts) > 1:
                parts = parts[1].split("Interview Script:", 1)
                personality = parts[0].strip()
                if len(parts) > 1:
                    script_text = parts[1].split("\n\nResponse rules:", 1)[0].strip()

        script_questions = self._extract_script_questions(system_prompt)
        
        # Prepare LangChain messages
        messages = []
        for msg in conversation:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

        # If we have a script, use LangGraph for better flow control
        if script_questions:
            from .agent_graph import interview_graph
            
            # Estimate current step from history (simple heuristic for now)
            # A better way would be persisting state, but this works for stateless integration
            asked_questions = sum(1 for msg in conversation if msg["role"] == "assistant")
            
            initial_state = {
                "messages": messages,
                "script": script_questions,
                "current_step": max(0, asked_questions - 1),
                "behavior": behavior or system_prompt,
                "personality": personality,
                "decision": ""
            }
            
            result = interview_graph.invoke(initial_state)
            return str(result["messages"][-1].content)

        # Fallback to standard LLM call if no specific script logic is needed
        lc_messages = [SystemMessage(content=system_prompt)] + messages
        response = self.llm.invoke(lc_messages, config={"temperature": temperature})
        return str(response.content)

    @traceable
    def summarize_meeting(self, transcript_text: str) -> dict:
        if not transcript_text.strip():
            return {
                "summary": "No transcript was captured for this meeting.",
                "key_points": "",
                "action_items": "",
            }

        if not self.llm:
            return self._local_summary(transcript_text)

        prompt = (
            "You are a meeting analyst. Return strict JSON with keys: "
            "summary (string), key_points (string), action_items (string)."
        )
        
        messages = [
            ("system", prompt),
            ("human", transcript_text)
        ]
        
        try:
            # Using bind for JSON response if supported
            structured_llm = self.llm.bind(response_format={"type": "json_object"})
            response = structured_llm.invoke(messages, config={"temperature": 0.2})
            content = str(response.content)
        except Exception:
            response = self.llm.invoke(messages, config={"temperature": 0.2})
            content = str(response.content)

        try:
            data = json.loads(content or "{}")
        except Exception:
            return {
                "summary": (content or "").strip() or "Summary unavailable.",
                "key_points": "",
                "action_items": "",
            }

        return {
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", ""),
            "action_items": data.get("action_items", ""),
        }

    @traceable
    def embed_text(self, text: str) -> list[float]:
        if self.embeddings:
            try:
                return self.embeddings.embed_query(text)
            except Exception:
                return self._deterministic_embedding(text)
        return self._deterministic_embedding(text)

    @traceable
    def answer_from_context(self, question: str, context_chunks: list[str]) -> str:
        context_text = "\n".join(f"- {chunk}" for chunk in context_chunks if chunk.strip())
        if not context_text:
            return "I could not find relevant transcript context for that question."

        if self.llm:
            messages = [
                ("system", "Answer only from provided transcript context. If context is insufficient, say so explicitly."),
                ("human", f"Question: {question}\n\nContext:\n{context_text}")
            ]
            response = self.llm.invoke(messages, config={"temperature": 0.2})
            return str(response.content)

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
