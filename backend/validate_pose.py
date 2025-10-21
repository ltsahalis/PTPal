"""
PT Pal – Pose Validator

This module scores common rehab poses given pre-computed joint angles/metrics
(e.g., from BlazePose). It is model-agnostic: you pass angles/distances you
already computed and it returns a score (0–100), pass/fail, and concrete cues.

Input schema
------------
Each pose validator takes a dict[metric_name -> float] (degrees for angles unless
specified) and optional metadata. You can compute these from landmarks upstream.

Common metric keys used below (all degrees unless noted):
- knee_flexion_deg
- hip_knee_ankle_alignment_deg  # frontal-plane knee valgus (+) or varus (−)
- heel_height_cm                 # vertical calcaneus raise above neutral
- trunk_forward_lean_deg         # sagittal trunk angle from vertical (+ forward)
- ankle_dorsiflexion_deg
- symmetry_diff_pct              # |left - right| / max(left,right) * 100
- sway_peak_deg                  # peak-to-peak trunk sway about vertical
- pelvic_drop_deg                # frontal pelvic obliquity; + means stance hip dropped
- foot_line_deviation_deg        # angle between back-heel→front-toe and midline (0 is ideal)
- hold_time_s
- reach_distance_ratio           # reach distance / arm length (unitless)
- stepped_during_task            # 1.0 if stepped/lost base, else 0.0
- arm_overhead_alignment_deg     # angle error from symmetric overhead alignment

All thresholds are configurable via the Thresholds dataclass.
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional
import os

# Optional OpenAI integration - only if API key is set
try:
    from openai import OpenAI
    api_key = os.environ.get('OPENAI_API_KEY')
    client = OpenAI(api_key=api_key) if api_key else None
except ImportError:
    client = None

@dataclass
class Thresholds:
    # Partial Squat
    squat_min_depth_deg: float = 45.0     # knee flexion ≥ this → adequate depth
    squat_max_forward_lean_deg: float = 35.0
    squat_max_knee_valgus_deg: float = 10.0  # frontal knee collapse beyond this
    squat_max_heel_lift_cm: float = 1.0

    # Heel Raises
    heel_min_raise_cm: float = 2.0
    heel_symmetry_max_diff_pct: float = 15.0
    heel_max_ankle_roll_deg: float = 8.0  # inversion/eversion

    # Single-Leg Stance
    sls_min_hold_s: float = 10.0
    sls_max_sway_deg: float = 8.0
    sls_max_pelvic_drop_deg: float = 7.0

    # Tandem Stance
    tandem_max_foot_line_dev_deg: float = 6.0
    tandem_max_trunk_lean_deg: float = 10.0
    tandem_min_hold_s: float = 10.0

    # Functional Reach
    fr_min_reach_ratio: float = 0.7  # ~70% of arm length as conservative floor
    fr_min_trunk_flexion_deg: float = 10.0
    fr_max_trunk_flexion_deg: float = 30.0

    # Tree Pose
    tree_max_pelvic_shift_deg: float = 8.0
    tree_max_trunk_sway_deg: float = 8.0
    tree_max_arm_misalignment_deg: float = 10.0
    tree_min_hold_s: float = 10.0


@dataclass
class PoseResult:
    pose: str
    score: int  # 0–100
    pass_fail: bool
    reasons: List[str]
    metrics: Dict[str, float]
    thresholds: Dict[str, float]


def _score_from_flags(total_checks: int, fails: int) -> int:
    # Base score on proportion of checks that pass, scaled to 100.
    passed = max(0, total_checks - fails)
    return int(round(100 * passed / max(1, total_checks)))


def _bool_fail(condition: bool, msg: str, reasons: List[str]) -> int:
    if condition:
        reasons.append(msg)
        return 1
    return 0


def validate_partial_squat(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Partial Squat quality.

    Required metrics: knee_flexion_deg, hip_knee_ankle_alignment_deg,
    heel_height_cm, trunk_forward_lean_deg
    """
    req = ["knee_flexion_deg", "hip_knee_ankle_alignment_deg", "heel_height_cm", "trunk_forward_lean_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Partial Squat missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4

    fails += _bool_fail(metrics["knee_flexion_deg"] < th.squat_min_depth_deg,
                        f"Go deeper: knee flexion {metrics['knee_flexion_deg']:.0f}° < {th.squat_min_depth_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["hip_knee_ankle_alignment_deg"]) > th.squat_max_knee_valgus_deg,
                        f"Knees in line: valgus/varus {metrics['hip_knee_ankle_alignment_deg']:.0f}° > {th.squat_max_knee_valgus_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["heel_height_cm"] > th.squat_max_heel_lift_cm,
                        f"Keep heels down: heel lift {metrics['heel_height_cm']:.1f} cm > {th.squat_max_heel_lift_cm:.1f} cm.", reasons)
    fails += _bool_fail(metrics["trunk_forward_lean_deg"] > th.squat_max_forward_lean_deg,
                        f"Upright chest: trunk lean {metrics['trunk_forward_lean_deg']:.0f}° > {th.squat_max_forward_lean_deg:.0f}°.", reasons)
    
    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Partial Squat",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Nice control and alignment."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_heel_raises(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Heel Raises (bilateral/single).

    Required metrics: heel_height_cm, symmetry_diff_pct, ankle_roll_deg
    Optional: hold_time_s (for endurance sets)
    """
    req = ["heel_height_cm", "symmetry_diff_pct", "ankle_roll_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Heel Raises missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 3

    fails += _bool_fail(metrics["heel_height_cm"] < th.heel_min_raise_cm,
                        f"Raise higher: heel height {metrics['heel_height_cm']:.1f} cm < {th.heel_min_raise_cm:.1f} cm.", reasons)
    fails += _bool_fail(metrics["symmetry_diff_pct"] > th.heel_symmetry_max_diff_pct,
                        f"Match sides: asymmetry {metrics['symmetry_diff_pct']:.0f}% > {th.heel_symmetry_max_diff_pct:.0f}%.", reasons)
    fails += _bool_fail(abs(metrics.get("ankle_roll_deg", 0.0)) > th.heel_max_ankle_roll_deg,
                        f"Neutral ankles: roll {metrics.get('ankle_roll_deg', 0.0):.0f}° > {th.heel_max_ankle_roll_deg:.0f}°.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Heel Raises",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Good height and symmetry."],
        metrics={k: metrics[k] for k in req if k in metrics} | {k: v for k, v in metrics.items() if k == "hold_time_s"},
        thresholds=asdict(th),
    )


def validate_single_leg_stance(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Single-Leg Stance (SLS).

    Required metrics: hold_time_s, sway_peak_deg, pelvic_drop_deg
    """
    req = ["hold_time_s", "sway_peak_deg", "pelvic_drop_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"SLS missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 3

    fails += _bool_fail(metrics["hold_time_s"] < th.sls_min_hold_s,
                        f"Hold longer: {metrics['hold_time_s']:.1f}s < {th.sls_min_hold_s:.1f}s.", reasons)
    fails += _bool_fail(metrics["sway_peak_deg"] > th.sls_max_sway_deg,
                        f"Reduce sway: {metrics['sway_peak_deg']:.0f}° > {th.sls_max_sway_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["pelvic_drop_deg"] > th.sls_max_pelvic_drop_deg,
                        f"Level pelvis: drop {metrics['pelvic_drop_deg']:.0f}° > {th.sls_max_pelvic_drop_deg:.0f}°.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Single-Leg Stance",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Stable and level."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_tandem_stance(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Tandem Stance (heel-to-toe).

    Required metrics: foot_line_deviation_deg, trunk_forward_lean_deg, hold_time_s
    """
    req = ["foot_line_deviation_deg", "trunk_forward_lean_deg", "hold_time_s"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tandem Stance missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 3

    fails += _bool_fail(abs(metrics["foot_line_deviation_deg"]) > th.tandem_max_foot_line_dev_deg,
                        f"Line up feet: deviation {metrics['foot_line_deviation_deg']:.0f}° > {th.tandem_max_foot_line_dev_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["trunk_forward_lean_deg"]) > th.tandem_max_trunk_lean_deg,
                        f"Stand tall: trunk lean {metrics['trunk_forward_lean_deg']:.0f}° > {th.tandem_max_trunk_lean_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["hold_time_s"] < th.tandem_min_hold_s,
                        f"Hold longer: {metrics['hold_time_s']:.1f}s < {th.tandem_min_hold_s:.1f}s.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Tandem Stance",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Aligned and steady."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_functional_reach(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Functional Reach Test.

    Required metrics: reach_distance_ratio, trunk_forward_lean_deg, stepped_during_task
    """
    req = ["reach_distance_ratio", "trunk_forward_lean_deg", "stepped_during_task"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Functional Reach missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 3

    fails += _bool_fail(metrics["reach_distance_ratio"] < th.fr_min_reach_ratio,
                        f"Reach further: ratio {metrics['reach_distance_ratio']:.2f} < {th.fr_min_reach_ratio:.2f}.", reasons)
    #fails += _bool_fail(metrics["trunk_forward_lean_deg"] > th.fr_max_trunk_flexion_deg,
                       # f"Reach with arms, not trunk: flexion {metrics['trunk_forward_lean_deg']:.0f}° > {th.fr_max_trunk_flexion_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["stepped_during_task"] >= 0.5,
                        "Keep feet planted: stepping detected.", reasons)
    fails += _bool_fail(metrics["trunk_forward_lean_deg"] < th.fr_min_trunk_flexion_deg,
                    f"Lean forward slightly: trunk flexion {metrics['trunk_forward_lean_deg']:.0f}° < {th.fr_min_trunk_flexion_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["trunk_forward_lean_deg"] > th.fr_max_trunk_flexion_deg,
                    f"Reach with arms, not trunk: flexion {metrics['trunk_forward_lean_deg']:.0f}° > {th.fr_max_trunk_flexion_deg:.0f}°.", reasons)                     
                    

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Functional Reach",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Strong, controlled reach."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_tree_pose(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Tree Pose.

    Required metrics: pelvic_drop_deg, sway_peak_deg, arm_overhead_alignment_deg, hold_time_s
    """
    req = ["pelvic_drop_deg", "sway_peak_deg", "arm_overhead_alignment_deg", "hold_time_s"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tree Pose missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4

    fails += _bool_fail(abs(metrics["pelvic_drop_deg"]) > th.tree_max_pelvic_shift_deg,
                        f"Level hips: shift {metrics['pelvic_drop_deg']:.0f}° > {th.tree_max_pelvic_shift_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["sway_peak_deg"] > th.tree_max_trunk_sway_deg,
                        f"Steady trunk: sway {metrics['sway_peak_deg']:.0f}° > {th.tree_max_trunk_sway_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["arm_overhead_alignment_deg"]) > th.tree_max_arm_misalignment_deg,
                        f"Align arms overhead: error {metrics['arm_overhead_alignment_deg']:.0f}° > {th.tree_max_arm_misalignment_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["hold_time_s"] < th.tree_min_hold_s,
                        f"Hold longer: {metrics['hold_time_s']:.1f}s < {th.tree_min_hold_s:.1f}s.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Tree Pose",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Centered and aligned."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


# --- Convenience dispatcher -------------------------------------------------

POSE_DISPATCH = {
    "partial_squat": validate_partial_squat,
    "heel_raises": validate_heel_raises,
    "single_leg_stance": validate_single_leg_stance,
    "tandem_stance": validate_tandem_stance,
    "functional_reach": validate_functional_reach,
    "tree_pose": validate_tree_pose,
}


def evaluate_pose(pose_key: str, metrics: Dict[str, float], th: Optional[Thresholds] = None) -> PoseResult:
    """Evaluate a pose by key.

    pose_key: one of POSE_DISPATCH keys.
    metrics: dict of required values for that pose.
    th: optional Thresholds override.
    """
    if pose_key not in POSE_DISPATCH:
        raise KeyError(f"Unknown pose '{pose_key}'. Valid: {list(POSE_DISPATCH)}")
    th = th or Thresholds()
    return POSE_DISPATCH[pose_key](metrics, th)


# --- LLM Integration (Prompt + Schema) -------------------------------------

LLM_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["pose", "severity", "cues"],
    "properties": {
        "pose": {"type": "string"},
        "severity": {"type": "string", "enum": ["ok", "minor", "major"]},
        "summary": {"type": "string"},
        "cues": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["issue", "action"],
                "properties": {
                    "issue": {"type": "string"},
                    "metric": {"type": "string"},
                    "value": {"type": ["number", "string"]},
                    "threshold": {"type": ["number", "string"]},
                    "action": {"type": "string"},
                    "why_it_matters": {"type": "string"}
                }
            },
            "minItems": 1,
            "maxItems": 3
        },
        "next_rep_focus": {"type": "string"},
        "encouragement": {"type": "string"},
        "safety_flags": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1}
    }
}

LLM_SYSTEM_PROMPT = (
    "You are PT Pal, a physical-therapy coaching assistant. "
    "Speak in short, encouraging sentences. Use only the metrics and reasons provided. "
    "Do not make diagnoses or medical claims. Do not invent new measurements. "
    "Return a STRICT JSON object that matches the provided JSON Schema exactly. "
    "Limit to at most 3 concrete cues. Each cue must include a plain-language ACTION."
)

LLM_USER_TEMPLATE = (
    "Pose: {pose}" \
    "Score: {score} (pass: {passed})" \
    "Reasons: {reasons}" \
    "Metrics: {metrics}" \
    "Thresholds: {thresholds}" \
    "User profile: tone={tone}, reading_level={reading_level}, language={language}." \
    "Output JSON only matching this schema: {schema}"
)


def build_llm_messages(result: PoseResult, tone: str = "coach", reading_level: str = "elementary", language: str = "en") -> List[Dict[str, str]]:
    """Create messages for an LLM chat/completions API call.

    Post-process model output with a JSON schema validator in your backend.
    If invalid, retry with the same messages plus a short system reminder.
    """
    user_text = LLM_USER_TEMPLATE.format(
        pose=result.pose,
        score=result.score,
        passed=result.pass_fail,
        reasons=", ".join(result.reasons),
        metrics=result.metrics,
        thresholds={k: result.thresholds[k] for k in result.thresholds if k.startswith(result.pose.split()[0].lower()) or k.startswith(result.pose.split('-')[0].lower())},
        tone=tone,
        reading_level=reading_level,
        language=language,
        schema=LLM_OUTPUT_SCHEMA,
    )
    return [
        {"role": "system", "content": LLM_SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]



# --- Example few-shots (for testing locally) --------------------------------

FEWSHOT_PARTIAL_SQUAT_FAIL = {
    "pose": "Partial Squat",
    "score": 55,
    "pass_fail": False,
    "reasons": [
        "Go deeper: knee flexion 30° < 45°.",
        "Knees in line: valgus/varus 14° > 10°."
    ],
    "metrics": {
        "knee_flexion_deg": 30,
        "hip_knee_ankle_alignment_deg": 14,
        "heel_height_cm": 0.8,
        "trunk_forward_lean_deg": 22
    }
}

FEWSHOT_SLS_BORDERLINE = {
    "pose": "Single-Leg Stance",
    "score": 80,
    "pass_fail": True,
    "reasons": ["Reduce sway: 9° > 8° (borderline)."],
    "metrics": {"hold_time_s": 15, "sway_peak_deg": 9, "pelvic_drop_deg": 4}
}


# --- Example usage ----------------------------------------------------------
if __name__ == "__main__":
    sample = {
        "partial_squat": {
            "knee_flexion_deg": 52,
            "hip_knee_ankle_alignment_deg": 6,  # small valgus
            "heel_height_cm": 0.5,
            "trunk_forward_lean_deg": 28,
        },
        "heel_raises": {
            "heel_height_cm": 0.2,
            "symmetry_diff_pct": 9.0,
            "ankle_roll_deg": 4.0,
        },
        "single_leg_stance": {
            "hold_time_s": 12.0,
            "sway_peak_deg": 20.0,
            "pelvic_drop_deg": 5.0,
        },
        "tandem_stance": {
            "foot_line_deviation_deg": 4.0,
            "trunk_forward_lean_deg": 6.0,
            "hold_time_s": 12.0,
        },
        "functional_reach": {
            "reach_distance_ratio": 0.75,
            "trunk_forward_lean_deg": 2.0,
            "stepped_during_task": 0.0,
        },
        "tree_pose": {
            "pelvic_drop_deg": 3.0,
            "sway_peak_deg": 5.0,
            "arm_overhead_alignment_deg": 6.0,
            "hold_time_s": 14.0,
        },
    }

    for k, m in sample.items():
        res = evaluate_pose(k, m)
        print(f"{res.pose}: score={res.score}, pass={res.pass_fail}, reasons={res.reasons}")
        response = client.responses.create(
        model="gpt-4.1",
        input= build_llm_messages(res),
        store=True,
)


