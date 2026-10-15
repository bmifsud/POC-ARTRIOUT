from pathlib import Path
import pytest
import yaml

WORKFLOWS_DIR = Path(__file__).resolve().parents[2] / ".github" / "workflows"


def parse_workflow(file_path: Path) -> dict:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    data = yaml.safe_load(content)
    # PyYAML parses 'on:' as True if unquoted key
    if True in data and "on" not in data:
        data["on"] = data.pop(True)
    return data


def validate_concurrency(workflow_dict: dict) -> bool:
    concurrency = workflow_dict.get("concurrency")
    if not isinstance(concurrency, dict):
        return False
    group = str(concurrency.get("group", ""))
    cancel = concurrency.get("cancel-in-progress")
    return (group.startswith("group: pr-agent-") or group.startswith("pr-agent-")) and cancel is False


def validate_bot_rejection(workflow_dict: dict) -> bool:
    jobs = workflow_dict.get("jobs", {})
    if not jobs:
        return False
    for job in jobs.values():
        if_cond = str(job.get("if", ""))
        if "!endsWith(github.actor, '[bot]')" not in if_cond or "github.actor != 'github-actions[bot]'" not in if_cond:
            return False
    return True


def validate_label_gate(workflow_dict: dict, required_labels: list[str]) -> bool:
    jobs = workflow_dict.get("jobs", {})
    if not jobs:
        return False
    for job in jobs.values():
        if_cond = str(job.get("if", ""))
        for label in required_labels:
            if f"'{label}'" in if_cond:
                return True
    return False


def validate_label_consumption(workflow_dict: dict, label: str) -> bool:
    jobs = workflow_dict.get("jobs", {})
    if not jobs:
        return False
    for job in jobs.values():
        steps = job.get("steps", [])
        for step in steps:
            run_cmd = str(step.get("run", ""))
            if "--remove-label" in run_cmd and label in run_cmd:
                return True
    return False


def test_policy_harness():
    compliant = {
        "concurrency": {
            "group": "pr-agent-${{ github.event.pull_request.number || github.ref }}",
            "cancel-in-progress": False,
        },
        "jobs": {
            "test": {
                "if": "!endsWith(github.actor, '[bot]') && github.actor != 'github-actions[bot]' && contains(github.event.pull_request.labels.*.name, 'ai-fix')",
                "steps": [
                    {
                        "name": "Consume Label",
                        "run": 'gh pr edit --remove-label "ai-fix" || true',
                    }
                ],
            }
        },
    }
    non_compliant = {
        "concurrency": {
            "group": "other-${{ github.ref }}",
            "cancel-in-progress": True,
        },
        "jobs": {
            "test": {
                "if": "github.actor != 'bot'",
                "steps": [],
            }
        },
    }

    assert validate_concurrency(compliant) is True
    assert validate_concurrency(non_compliant) is False

    assert validate_bot_rejection(compliant) is True
    assert validate_bot_rejection(non_compliant) is False

    assert validate_label_gate(compliant, ["ai-fix"]) is True
    assert validate_label_gate(non_compliant, ["ai-fix"]) is False

    assert validate_label_consumption(compliant, "ai-fix") is True
    assert validate_label_consumption(non_compliant, "ai-fix") is False


def test_consolidated_workflow_governance():
    workflow_files = list(WORKFLOWS_DIR.glob("*.yml")) + list(WORKFLOWS_DIR.glob("*.yaml"))
    assert len(workflow_files) == 1, f"Expected exactly 1 consolidated workflow file, found {len(workflow_files)}"

    data = parse_workflow(workflow_files[0])
    assert validate_concurrency(data) is True
    assert validate_bot_rejection(data) is True
    assert validate_label_consumption(data, "ai-fix") is True
