"""LangGraph form of the hierarchical multi-agent system (the documented graph).

    supervisor ──► crowd  ─┐
              ──► train  ─┤──► decision ──► action ──► END
              ──► safety ─┘
    (the three perception agents run as parallel branches; decision waits for all)

Each node calls the SAME pure agent functions used by the in-process supervisor,
so the graph and the runner make identical decisions (parity-tested). LangGraph is
optional — the runner uses supervisor.run_tick directly for single-process
reliability; this module provides the documented graph form.
"""
from typing import TypedDict

from .agents import action, crowd, decision, safety, train
from .types import (CrowdReport, DecisionOutput, Policy, SafetyReport, TickResult,
                    TrainReport)


class GraphState(TypedDict, total=False):
    snapshot: list
    policy: Policy
    draft: object
    crowd: CrowdReport
    train: TrainReport
    safety: SafetyReport
    decision: DecisionOutput
    result: TickResult


def _supervisor(state: GraphState) -> GraphState:
    return state  # entry; fans out to the parallel layer below


def _crowd(state: GraphState) -> GraphState:
    return {"crowd": crowd.analyze(state["snapshot"])}


def _train(state: GraphState) -> GraphState:
    return {"train": train.analyze(state["snapshot"])}


def _safety(state: GraphState) -> GraphState:
    return {"safety": safety.analyze(state["snapshot"], state["policy"])}


def _decision(state: GraphState) -> GraphState:
    d = decision.decide(state["snapshot"], state["crowd"], state["train"],
                        state["safety"], state["policy"])
    return {"decision": d}


def _action(state: GraphState) -> GraphState:
    d = state["decision"]
    if not d.act:
        return {"result": TickResult(False, d.reason)}
    record, se = action.act(d, state["snapshot"], state.get("draft"))
    return {"result": TickResult(True, d.reason, decision=record, side_effects=se)}


def build_graph():
    from langgraph.graph import END, StateGraph  # lazy: optional dependency

    g = StateGraph(GraphState)
    for name, fn in (("supervisor", _supervisor), ("crowd", _crowd), ("train", _train),
                     ("safety", _safety), ("decision", _decision), ("action", _action)):
        g.add_node(name, fn)

    g.set_entry_point("supervisor")
    # fan-out: supervisor -> the three parallel perception agents
    for a in ("crowd", "train", "safety"):
        g.add_edge("supervisor", a)
    # fan-in: decision waits for all three, then action
    for a in ("crowd", "train", "safety"):
        g.add_edge(a, "decision")
    g.add_edge("decision", "action")
    g.add_edge("action", END)
    return g.compile()


def run_graph(snapshot: list[dict], policy: Policy, draft=None) -> TickResult:
    app = build_graph()
    out = app.invoke({"snapshot": snapshot, "policy": policy, "draft": draft})
    return out["result"]
