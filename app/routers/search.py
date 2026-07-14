import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import Meeting, Transcript, TranscriptEmbedding, User
from ..schemas import SearchRequest, SearchResponse, SearchResultItem
from ..services.ai_service import ai_service

router = APIRouter(prefix="/meetings/{meeting_id}/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def search_transcript(
    meeting_id: int,
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    query_embedding = ai_service.embed_text(payload.query)

    rows = (
        db.query(TranscriptEmbedding, Transcript)
        .join(Transcript, Transcript.id == TranscriptEmbedding.transcript_id)
        .filter(TranscriptEmbedding.meeting_id == meeting_id)
        .all()
    )

    ranked: list[SearchResultItem] = []
    for embedding_row, transcript in rows:
        emb = json.loads(embedding_row.embedding_json)
        score = ai_service.cosine_similarity(query_embedding, emb)
        ranked.append(
            SearchResultItem(
                transcript_id=transcript.id,
                score=score,
                speaker=transcript.speaker,
                text=transcript.text,
                timestamp=transcript.timestamp,
            )
        )

    ranked.sort(key=lambda item: item.score, reverse=True)
    return SearchResponse(results=ranked[: payload.top_k])
