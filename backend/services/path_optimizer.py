"""
Path Optimizer Service — Adaptive learning path generation.

Original algorithm that determines path mode and generates
React Flow-compatible nodes/edges.
"""

import networkx as nx
import uuid


# ─── Estimated Learning Hours ─────────────────────────────────

SKILL_HOURS = {
    "beginner": 6,
    "intermediate": 12,
    "advanced": 20,
}


def build_adaptive_path(
    graph: nx.DiGraph,
    gap_ratio: float,
    resume_skills: list[str],
) -> dict:
    """
    Build an adaptive learning path from the skill graph.
    
    Original adaptive pathing algorithm:
    1. Topological sort for prerequisite ordering
    2. Determine path mode based on gap ratio
    3. Phase grouping for overwhelmed learners
    4. Generate React Flow nodes and edges
    
    Path Modes:
    - almost_ready: gap_ratio < 0.2 → short path, only direct gaps
    - standard: 0.2 ≤ gap_ratio ≤ 0.7 → normal path
    - phased: gap_ratio > 0.7 → grouped into Foundation/Core/Advanced phases
    
    Args:
        graph: NetworkX DiGraph of skills with prerequisites
        gap_ratio: Fraction of missing skills (0 to 1)
        resume_skills: Skills the user already has
        
    Returns:
        {
            "mode": str,
            "phases": [...],
            "modules": [...],
            "nodes": [...],
            "edges": [...],
            "total_hours": float,
        }
    """
    # Step 1: Get topological ordering
    try:
        ordered_skills = list(nx.topological_sort(graph))
    except nx.NetworkXUnfeasible:
        ordered_skills = list(graph.nodes)

    if not ordered_skills:
        return _empty_path()

    # Step 2: Determine path mode
    if gap_ratio < 0.2:
        mode = "almost_ready"
    elif gap_ratio > 0.7:
        mode = "phased"
    else:
        mode = "standard"

    # Step 3: Build modules with metadata
    modules = []
    for skill in ordered_skills:
        node_data = graph.nodes.get(skill, {})
        difficulty = node_data.get("difficulty", "intermediate")
        is_partial = node_data.get("is_partial", False)
        
        if is_partial:
            estimated_hours = 2
        else:
            estimated_hours = SKILL_HOURS.get(difficulty, 10)

        # Get prerequisites from graph
        predecessors = list(graph.predecessors(skill))

        # Determine initial status
        if not predecessors:
            status = "available"
        else:
            status = "locked"

        module = {
            "id": f"mod-{uuid.uuid4().hex[:8]}",
            "skill": skill,
            "difficulty": difficulty,
            "estimated_hours": estimated_hours,
            "prerequisites": predecessors,
            "status": status,
        }
        modules.append(module)

    # Step 4: Phase grouping
    if mode == "phased":
        phases = _group_into_phases(modules)
    elif mode == "almost_ready":
        phases = [{"name": "Quick Wins", "week_range": "Week 1", "modules": modules}]
    else:
        phases = [{"name": "Learning Path", "week_range": None, "modules": modules}]

    # Step 5: Generate React Flow nodes and edges
    nodes = _generate_flow_nodes(modules)
    edges = _generate_flow_edges(graph, modules)

    total_hours = sum(m["estimated_hours"] for m in modules)

    return {
        "mode": mode,
        "phases": [
            {
                "name": p["name"],
                "week_range": p.get("week_range"),
                "modules": p["modules"],
            }
            for p in phases
        ],
        "modules": modules,
        "nodes": nodes,
        "edges": edges,
        "total_hours": total_hours,
    }


def _group_into_phases(modules: list[dict]) -> list[dict]:
    """
    Group modules into learning phases by difficulty.
    
    Phase 1: Foundation (beginner skills) — Weeks 1-2
    Phase 2: Core Skills (intermediate) — Weeks 3-5
    Phase 3: Advanced (advanced skills) — Weeks 6-8
    """
    foundation = [m for m in modules if m["difficulty"] == "beginner"]
    core = [m for m in modules if m["difficulty"] == "intermediate"]
    advanced = [m for m in modules if m["difficulty"] == "advanced"]

    phases = []
    if foundation:
        phases.append({
            "name": "Phase 1: Foundation",
            "week_range": "Weeks 1-2",
            "modules": foundation,
        })
    if core:
        phases.append({
            "name": "Phase 2: Core Skills",
            "week_range": "Weeks 3-5",
            "modules": core,
        })
    if advanced:
        phases.append({
            "name": "Phase 3: Advanced",
            "week_range": "Weeks 6-8",
            "modules": advanced,
        })

    # If no phases were created, put everything in one phase
    if not phases:
        phases.append({
            "name": "Learning Path",
            "week_range": None,
            "modules": modules,
        })

    return phases


def _generate_flow_nodes(modules: list[dict]) -> list[dict]:
    """Generate React Flow node objects for the roadmap graph."""
    nodes = []
    x_spacing = 250
    y_spacing = 120

    # Group by difficulty for layout
    beginner = [m for m in modules if m["difficulty"] == "beginner"]
    intermediate = [m for m in modules if m["difficulty"] == "intermediate"]
    advanced = [m for m in modules if m["difficulty"] == "advanced"]

    all_groups = [
        ("beginner", beginner),
        ("intermediate", intermediate),
        ("advanced", advanced),
    ]

    y_offset = 0
    for group_name, group_modules in all_groups:
        for i, module in enumerate(group_modules):
            node = {
                "id": module["id"],
                "type": "moduleNode",
                "position": {"x": i * x_spacing, "y": y_offset},
                "data": {
                    "label": module["skill"],
                    "difficulty": module["difficulty"],
                    "hours": module["estimated_hours"],
                    "status": module["status"],
                    "prerequisites": module["prerequisites"],
                },
            }
            nodes.append(node)
        if group_modules:
            y_offset += y_spacing

    return nodes


def _generate_flow_edges(graph: nx.DiGraph, modules: list[dict]) -> list[dict]:
    """Generate React Flow edge objects from graph edges."""
    # Build skill → module_id mapping
    skill_to_id = {m["skill"]: m["id"] for m in modules}

    edges = []
    for source, target in graph.edges():
        source_id = skill_to_id.get(source)
        target_id = skill_to_id.get(target)
        if source_id and target_id:
            edges.append({
                "id": f"e-{source_id}-{target_id}",
                "source": source_id,
                "target": target_id,
                "animated": True,
            })

    return edges


def _empty_path() -> dict:
    """Return an empty path when no skills need to be learned."""
    return {
        "mode": "almost_ready",
        "phases": [],
        "modules": [],
        "nodes": [],
        "edges": [],
        "total_hours": 0,
    }
