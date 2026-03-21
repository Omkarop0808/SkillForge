"""
Graph Builder Service — NetworkX skill prerequisite graph construction.

Builds a DAG (Directed Acyclic Graph) of skills with prerequisite edges
for topological ordering of learning modules.
"""

import networkx as nx
from typing import Optional


# ─── Prerequisite Knowledge Base ──────────────────────────────
# Maps skills to their prerequisites. This is curated from O*NET
# and common industry knowledge graphs.

TECH_PREREQUISITES = {
    # Programming fundamentals
    "python": [],
    "javascript": [],
    "java": [],
    "c++": ["c"],
    "c": [],
    "typescript": ["javascript"],
    "rust": ["c", "c++"],
    "go": [],
    "r": [],
    "sql": [],

    # Web Development
    "react": ["javascript", "html", "css"],
    "angular": ["typescript", "html", "css"],
    "vue.js": ["javascript", "html", "css"],
    "next.js": ["react"],
    "node.js": ["javascript"],
    "express.js": ["node.js"],
    "django": ["python"],
    "flask": ["python"],
    "fastapi": ["python"],
    "html": [],
    "css": [],
    "tailwind css": ["css"],

    # Data Science & ML
    "machine learning": ["python", "statistics", "linear algebra"],
    "deep learning": ["machine learning", "python"],
    "nlp": ["machine learning", "python"],
    "computer vision": ["deep learning", "python"],
    "tensorflow": ["deep learning", "python"],
    "pytorch": ["deep learning", "python"],
    "scikit-learn": ["python", "machine learning"],
    "pandas": ["python"],
    "numpy": ["python"],
    "statistics": [],
    "linear algebra": [],
    "data analysis": ["python", "statistics"],
    "data visualization": ["python", "data analysis"],

    # DevOps & Cloud
    "docker": ["linux"],
    "kubernetes": ["docker"],
    "aws": ["cloud computing"],
    "azure": ["cloud computing"],
    "gcp": ["cloud computing"],
    "ci/cd": ["git", "docker"],
    "terraform": ["cloud computing"],
    "linux": [],
    "git": [],
    "cloud computing": [],

    # Databases
    "postgresql": ["sql"],
    "mysql": ["sql"],
    "mongodb": [],
    "redis": [],
    "elasticsearch": [],

    # General
    "api design": ["http"],
    "rest api": ["http", "api design"],
    "graphql": ["api design"],
    "microservices": ["docker", "api design"],
    "system design": ["data structures", "algorithms"],
    "data structures": ["python"],
    "algorithms": ["data structures"],
    "http": [],
}

OPERATIONAL_PREREQUISITES = {
    # Operations & Management
    "team leadership": [],
    "project management": ["team leadership"],
    "agile methodology": ["project management"],
    "scrum": ["agile methodology"],
    "kanban": ["agile methodology"],
    "six sigma": ["quality management"],
    "lean management": ["quality management"],
    "quality management": [],

    # Supply Chain & Logistics
    "inventory management": [],
    "supply chain management": ["inventory management"],
    "logistics": ["supply chain management"],
    "warehouse management": ["inventory management"],
    "procurement": ["supply chain management"],

    # Safety & Compliance
    "osha compliance": ["workplace safety"],
    "workplace safety": [],
    "risk assessment": ["workplace safety"],
    "safety compliance": ["workplace safety"],
    "regulatory compliance": [],

    # Finance
    "budgeting": [],
    "financial analysis": ["budgeting"],
    "cost optimization": ["financial analysis"],
    "accounting basics": [],

    # HR & Communication
    "conflict resolution": ["communication"],
    "performance management": ["team leadership"],
    "training & development": ["team leadership"],
    "communication": [],
    "presentation skills": ["communication"],
    "negotiation": ["communication"],
    "customer service": ["communication"],
}


def build_skill_graph(
    missing_skills: list[str],
    resume_skills: list[str],
    domain: str = "tech",
    partial_skills: list[str] = None
) -> nx.DiGraph:
    """
    Build a directed acyclic graph of skills with prerequisite edges.
    
    - Nodes = skills that need to be learned
    - Edges = prerequisite relationships (prereq → skill)
    - Filters out prerequisites the user already has
    
    Args:
        missing_skills: Skills identified as gaps
        resume_skills: Skills the user already has
        domain: "tech" or "operational"
        partial_skills: List of skills the user is near-competent in
        
    Returns:
        NetworkX DiGraph with skill nodes and prerequisite edges
    """
    if partial_skills is None:
        partial_skills = []
    
    prereq_db = TECH_PREREQUISITES if domain == "tech" else OPERATIONAL_PREREQUISITES
    resume_skills_lower = {s.lower().strip() for s in resume_skills}
    partial_skills_lower = {s.lower().strip() for s in partial_skills}

    G = nx.DiGraph()

    # Add all missing skills as nodes
    for skill in missing_skills:
        skill_lower = skill.lower().strip()
        difficulty = _estimate_difficulty(skill_lower, prereq_db)
        is_partial = skill_lower in partial_skills_lower
        G.add_node(skill, difficulty=difficulty, original_name=skill, is_partial=is_partial)

    # Add prerequisite edges
    for skill in missing_skills:
        skill_lower = skill.lower().strip()
        prereqs = prereq_db.get(skill_lower, [])

        for prereq in prereqs:
            prereq_lower = prereq.lower().strip()

            # Skip if user already has this prereq
            if prereq_lower in resume_skills_lower:
                continue

            # Add prereq as a node if it's not already a missing skill
            if prereq not in G.nodes:
                # Check if it's a needed prereq (not yet known)
                if prereq_lower not in resume_skills_lower:
                    difficulty = _estimate_difficulty(prereq_lower, prereq_db)
                    G.add_node(prereq, difficulty=difficulty, original_name=prereq)

            # Add edge: prereq → skill
            if prereq in G.nodes:
                G.add_edge(prereq, skill)

    # Verify DAG (no cycles)
    if not nx.is_directed_acyclic_graph(G):
        # Break cycles by removing weakest edges
        while not nx.is_directed_acyclic_graph(G):
            cycle = nx.find_cycle(G)
            G.remove_edge(*cycle[0][:2])

    return G


def _estimate_difficulty(skill_name: str, prereq_db: dict) -> str:
    """
    Estimate skill difficulty based on number of prerequisites.
    
    - 0 prereqs = beginner
    - 1-2 prereqs = intermediate
    - 3+ prereqs = advanced
    """
    prereqs = prereq_db.get(skill_name, [])
    if len(prereqs) == 0:
        return "beginner"
    elif len(prereqs) <= 2:
        return "intermediate"
    else:
        return "advanced"


def get_learning_order(graph: nx.DiGraph) -> list[str]:
    """Get topologically sorted learning order from the skill graph."""
    return list(nx.topological_sort(graph))
