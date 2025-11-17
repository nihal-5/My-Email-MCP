#!/usr/bin/env python3
"""
LangGraph Orchestrator for JD → Resume → Email workflow
"""

import os
import json
import requests
import sys
from typing import Dict, Any, TypedDict

# LangGraph imports (install: pip install langgraph)
try:
    from langgraph.graph import StateGraph, END
except ImportError:
    print("ERROR: LangGraph not installed. Run: pip install langgraph langchain", file=sys.stderr)
    sys.exit(1)

MCP_BASE = os.environ.get("MCP_BASE", "http://localhost:3000")

class WorkflowState(TypedDict):
    jd: str
    event: Dict[str, str]
    parsed: Dict[str, Any]
    role: str
    cloud: str
    location: str
    latex: str
    validation: Dict[str, Any]
    valid: bool
    email_result: Dict[str, Any]
    meta: Dict[str, str]

def mcp_execute(tool: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute MCP tool via HTTP"""
    try:
        r = requests.post(
            f"{MCP_BASE}/execute",
            json={"tool": tool, "params": payload},
            timeout=60
        )
        r.raise_for_status()
        result = r.json()
        if result.get("success"):
            return result.get("result", {})
        else:
            raise Exception(result.get("error", "Tool execution failed"))
    except Exception as e:
        print(f"ERROR executing {tool}: {e}", file=sys.stderr)
        raise

def node_parse_jd(state: WorkflowState) -> WorkflowState:
    """Parse JD to extract role, cloud, location"""
    print("Step 1: Parsing JD...", file=sys.stderr)
    jd = state.get("jd", "")
    if not jd:
        print("ERROR: No JD text in state", file=sys.stderr)
        print(f"State keys: {state.keys()}", file=sys.stderr)
        raise ValueError("JD text is missing from workflow state")

    parsed = mcp_execute("parse_jd", {"jd": jd})

    state["parsed"] = parsed
    state["role"] = parsed.get("role", "AI/ML Engineer")
    state["cloud"] = parsed.get("cloud", "azure")
    state["location"] = parsed.get("location", "")

    # Extract recruiter email if present
    if "recruiterEmail" in parsed and parsed["recruiterEmail"]:
        state["meta"]["to_email"] = parsed["recruiterEmail"]
    if "recruiterName" in parsed and parsed["recruiterName"]:
        state["meta"]["recruiter_name"] = parsed["recruiterName"]

    print(f"  Role: {state['role']}", file=sys.stderr)
    print(f"  Cloud: {state['cloud']}", file=sys.stderr)
    print(f"  Location: {state['location']}", file=sys.stderr)

    return state

def node_tailor_resume(state: WorkflowState) -> WorkflowState:
    """Generate tailored LaTeX resume"""
    print("Step 2: Tailoring resume...", file=sys.stderr)
    result = mcp_execute("tailor_resume", {
        "cloud": state["cloud"],
        "role": state["role"],
        "location": state.get("location", "")
    })
    state["latex"] = result["latex"]
    print(f"  Generated {len(state['latex'])} chars of LaTeX", file=sys.stderr)
    return state

def node_validate_resume(state: WorkflowState) -> WorkflowState:
    """Validate resume against strict rules"""
    print("Step 3: Validating resume...", file=sys.stderr)
    validation = mcp_execute("validate_resume", {
        "latex": state["latex"],
        "cloud": state["cloud"]
    })
    state["validation"] = validation
    state["valid"] = bool(validation.get("ok"))
    print(f"  Valid: {state['valid']}", file=sys.stderr)
    if not state["valid"]:
        errors = validation.get("errors", [])
        for err in errors:
            print(f"  ❌ {err}", file=sys.stderr)
    return state

def node_on_valid(state: WorkflowState) -> WorkflowState:
    """Submit resume for approval if validation passed"""
    print("Step 4: Generating AI-powered email...", file=sys.stderr)
    
    # Extract role title (clean, short)
    role_full = state.get('role', 'Position')
    role_clean = role_full.split('.')[0].strip()[:60]
    
    # 🤖 GENERATE AI EMAIL using MCP tool
    try:
        # Get recruiter name and source from meta
        recruiter_name = state.get("meta", {}).get("recruiter_name", "")
        source = state.get("meta", {}).get("source", "whatsapp")
        
        email_result = mcp_execute("generate_personalized_email", {
            "candidateInfo": {
                "name": "Nihal Veeramalla",
                "email": "nihal.veeramalla@gmail.com",
                "phone": "313-288-2859",
                "title": "Data Scientist",
                "linkedin": "https://linkedin.com/in/nihalveeramalla"
            },
            "jdAnalysis": {
                "title": role_clean,
                "company": state.get("company", ""),
                "location": state.get("location", ""),
                "hiringManager": recruiter_name if recruiter_name else None,
                "source": source,  # 'email' or 'whatsapp'
                "technologies": [],
                "requirements": []
            },
            "originalJD": state["jd"]
        })
        
        subject = email_result.get("subject", "")
        body = email_result.get("body", "")
        print(f"  ✅ AI email generated", file=sys.stderr)
        print(f"  Subject: {subject}", file=sys.stderr)
        
    except Exception as e:
        print(f"  ⚠️ AI email failed: {e}, using clean fallback", file=sys.stderr)
        
        # Clean fallback with SHORT subject line
        subject = f"Application for {role_clean}"
        location = state.get('location', '')
        if location and len(location) > 50:
            location = location.split('.')[0].strip()[:50]
        
        body = (
            f"Hi,\n\n"
            f"I am interested in the {role_clean} position{' in ' + location if location else ''}. "
            f"With extensive experience in AI/ML systems, I have built production agentic systems and RAG-backed assistants. "
            f"Please find my resume attached for your review.\n\n"
            f"Best regards,\n"
            f"Nihal Veeramalla\n"
            f"nihal.veeramalla@gmail.com\n"
            f"313-288-2859"
        )
    
    print("Step 5: Submitting for approval...", file=sys.stderr)
    
    meta = state.get("meta", {})
    to = meta.get("to_email", os.environ.get("TO_EMAIL", ""))
    cc = "Srinu@blueridgeinfotech.com"

    if not to:
        print("  ⚠️ No recruiter email found, using fallback", file=sys.stderr)
        to = os.environ.get("TO_EMAIL", "")

    # Submit for approval instead of sending directly
    # ⚠️ CRITICAL: myNotificationChatId is YOUR WhatsApp number (from .env MY_WHATSAPP_CHATID)
    # This is where notifications go - NOT to Srinu!
    # Srinu (WA_FROM) only SENDS JDs, he never receives notifications from us.
    my_notification_id = os.environ.get("MY_WHATSAPP_CHATID", "15715026464@c.us")
    
    # Get source from event metadata (email, whatsapp, or manual)
    source = state.get("event", {}).get("source", "manual")
    
    result = mcp_execute("submit_for_approval", {
        "jd": state["jd"],
        "source": source,  # Track where JD came from
        "parsedData": {
            "role": state["role"],
            "cloud": state["cloud"],
            "location": state.get("location", ""),
            "recruiterEmail": to,
            "recruiterName": meta.get("recruiter_name", "")
        },
        "latex": state["latex"],
        "validation": state["validation"],
        "emailSubject": subject,
        "emailBody": body,
        "myNotificationChatId": my_notification_id  # YOUR number for notifications, NOT Srinu's!
    })
    state["email_result"] = result
    print(f"  Success: {result.get('success')}", file=sys.stderr)
    if result.get("success"):
        print(f"  Submission ID: {result.get('submissionId')}", file=sys.stderr)
        print(f"  {result.get('message')}", file=sys.stderr)
    return state

def node_on_invalid(state: WorkflowState) -> WorkflowState:
    """Handle validation failure - no email sent"""
    print("Step 4: Validation failed, no email sent", file=sys.stderr)
    errors = state["validation"].get("errors", [])
    state["email_result"] = {
        "ok": False,
        "error": "Validation failed: " + "; ".join(errors)
    }
    return state

def route_valid(state: WorkflowState) -> str:
    """Route based on validation result"""
    return "valid" if state.get("valid") else "invalid"

def build_graph() -> Any:
    """Build LangGraph state machine"""
    sg = StateGraph(WorkflowState)
    sg.add_node("parse_jd", node_parse_jd)
    sg.add_node("tailor_resume", node_tailor_resume)
    sg.add_node("validate_resume", node_validate_resume)
    sg.add_node("on_valid", node_on_valid)
    sg.add_node("on_invalid", node_on_invalid)

    sg.set_entry_point("parse_jd")
    sg.add_edge("parse_jd", "tailor_resume")
    sg.add_edge("tailor_resume", "validate_resume")
    sg.add_conditional_edges(
        "validate_resume",
        route_valid,
        {"valid": "on_valid", "invalid": "on_invalid"}
    )
    sg.add_edge("on_valid", END)
    sg.add_edge("on_invalid", END)

    return sg.compile()

def main():
    """Main entry point"""
    # Check if session file provided as argument
    session_data = {}
    if len(sys.argv) > 1:
        session_file = sys.argv[1]
        try:
            with open(session_file, 'r') as f:
                session_data = json.load(f)
                print(f"Loaded session file: {session_file}", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not load session file: {e}", file=sys.stderr)
    
    # Get JD text from session file, env, or stdin
    jd_text = session_data.get("jdText") or os.environ.get("JD_TEXT")
    if not jd_text:
        if not sys.stdin.isatty():
            jd_text = sys.stdin.read()
        else:
            print("ERROR: No JD text provided. Set JD_TEXT env or pipe to stdin", file=sys.stderr)
            sys.exit(1)

    event = {
        "from": session_data.get("recruiterEmail") or os.environ.get("WA_FROM", ""),
        "text": jd_text
    }

    # Build workflow graph
    graph = build_graph()

    # Initial state
    state: WorkflowState = {
        "jd": jd_text,
        "event": event,
        "parsed": {},
        "role": "",
        "cloud": "azure",
        "location": "",
        "latex": "",
        "validation": {},
        "valid": False,
        "email_result": {},
        "meta": {
            "source": session_data.get("source", "whatsapp"),  # 'email' or 'whatsapp'
            "recruiter_name": session_data.get("recruiterName", ""),
            "to_email": os.environ.get("TO_EMAIL", ""),
            "cc_email": os.environ.get("CC_EMAIL", ""),  # Optional CC (leave empty to disable)
            "subject": os.environ.get("SUBJECT", ""),
            "body": os.environ.get("BODY", ""),
            "filename_base": os.environ.get("FILENAME_BASE", "Nihal_Veeramalla_Resume")
        }
    }

    # Execute workflow
    print("=== Starting Resume Workflow ===", file=sys.stderr)
    final_state = graph.invoke(state)

    # Output result as JSON to stdout
    output = {
        "role": final_state.get("role"),
        "cloud": final_state.get("cloud"),
        "location": final_state.get("location"),
        "validation": final_state.get("validation"),
        "email_result": final_state.get("email_result")
    }
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
