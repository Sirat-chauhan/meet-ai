from typing import Annotated, List, TypedDict, Union
import json

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from ..config import settings

class AgentState(TypedDict):
    """The state of the interview agent."""
    messages: List[BaseMessage]
    script: List[str]
    current_step: int
    behavior: str
    personality: str
    decision: str  # follow_up, next_question, wrap_up

def analyze_interview_progress(state: AgentState):
    """Analyzes the conversation to decide the next move."""
    llm = ChatOpenAI(model=settings.openai_chat_model, temperature=0)
    
    # Simple logic to determine if we should move forward
    # In a real scenario, this would be another LLM call to categorize the state
    last_message = state["messages"][-1].content if state["messages"] else ""
    
    # Basic heuristic: if it's the very beginning, start intro
    if len(state["messages"]) <= 1:
        return {"decision": "next_question"}
        
    # Analyze if the candidate answered enough
    prompt = (
        f"Interview Script: {state['script']}\n"
        f"Current Question: {state['script'][min(state['current_step'], len(state['script'])-1)] if state['script'] else 'N/A'}\n"
        "Based on the last response, should we ask a follow-up or move to the next question?\n"
        "Respond with 'follow_up' or 'next_question' or 'wrap_up'."
    )
    
    res = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=last_message)])
    decision = res.content.strip().lower()
    
    if "wrap_up" in decision or state["current_step"] >= len(state["script"]):
        return {"decision": "wrap_up"}
    elif "next_question" in decision:
        return {"decision": "next_question", "current_step": state["current_step"] + 1}
    else:
        return {"decision": "follow_up"}

def generate_response(state: AgentState):
    """Generates the actual AI response based on the decision."""
    llm = ChatOpenAI(model=settings.openai_chat_model, temperature=0.7)
    
    decision = state["decision"]
    script = state["script"]
    step = min(state["current_step"], len(script) - 1) if script else 0
    
    system_prompt = (
        f"Behavior: {state['behavior']}\n"
        f"Personality: {state['personality']}\n"
        f"Goal: {decision.replace('_', ' ')}\n"
    )
    
    if decision == "next_question" and script:
        system_prompt += f"Ask the next question: {script[step]}"
    elif decision == "follow_up":
        system_prompt += "Ask a relevant follow-up question based on their last answer."
    elif decision == "wrap_up":
        system_prompt += "The interview is over. Briefly thank them and wrap up."
    
    response = llm.invoke([SystemMessage(content=system_prompt)] + state["messages"])
    return {"messages": [response]}

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("analyze", analyze_interview_progress)
workflow.add_node("generate", generate_response)

workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "generate")
workflow.add_edge("generate", END)

interview_graph = workflow.compile()
