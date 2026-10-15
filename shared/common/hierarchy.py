"""The hierarchy: who approves whom, and which secrets each level sees.

    base minister (password)  approves everyone (the root: someone has to
                              approve the first registrations)
    minister                  approves managers and analysts
    manager                   approves analysts
    analyst                   approves nobody

Secrets: level 0 (ministers), 1 (managers), 2 (analysts). Each level sees
its own secrets and the ones below it.
"""

LEVELS = ("ANALYST", "MANAGER", "MINISTER")

# The role of the base minister's password session.
BASE = "BASE"

APPROVES = {
    BASE: {"MINISTER", "MANAGER", "ANALYST"},
    "MINISTER": {"MANAGER", "ANALYST"},
    "MANAGER": {"ANALYST"},
    "ANALYST": set(),
}

# Who approves each registration, for display.
APPROVED_BY = {"MINISTER": BASE, "MANAGER": "MINISTER", "ANALYST": "MANAGER"}

SECRET_LEVELS = {
    "MINISTER": ["MINISTER", "MANAGER", "ANALYST"],
    "MANAGER": ["MANAGER", "ANALYST"],
    "ANALYST": ["ANALYST"],
    BASE: [],
}


def can_approve(role: str, candidate_level: str) -> bool:
    return candidate_level in APPROVES.get(role, set())


def approvable_levels(role: str) -> list[str]:
    return sorted(APPROVES.get(role, set()))
