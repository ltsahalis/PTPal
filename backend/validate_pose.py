"""
PT Pal – Pose Validator

This module scores common rehab poses given pre-computed joint angles/metrics
(e.g., from BlazePose). It is model-agnostic: you pass angles/distances you
already computed and it returns a score (1–5 stars), pass/fail, and concrete cues.

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
- sway_peak_deg                  # hip-shoulder alignment angle (horizontal deviation)
- pelvic_drop_deg                # frontal pelvic obliquity; + means stance hip dropped
- foot_line_deviation_cm         # distance between front heel and back toe (should be minimal)
- head_feet_alignment_deg        # head-to-feet alignment angle (horizontal deviation)
- reach_distance_ratio           # reach distance / arm length (unitless)
- stepped_during_task            # 1.0 if stepped/lost base, else 0.0
- arm_overhead_alignment_deg     # angle error from symmetric overhead alignment
- leg_lift_height_cm             # vertical height difference between ankles (for tree pose)

All thresholds are configurable via the Thresholds dataclass.
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Optional OpenAI integration - only if API key is set
try:
    from openai import OpenAI  # pyright: ignore[reportMissingImports]
    api_key = os.environ.get('OPENAI_API_KEY')
    client = OpenAI(api_key=api_key) if api_key else None
    if client:
        print("✓ OpenAI client initialized successfully")
    else:
        print("ℹ OpenAI API key not found. Set OPENAI_API_KEY environment variable to enable AI feedback.")
except ImportError:
    client = None
    print("ℹ OpenAI package not installed. Install with: pip install openai")

@dataclass
class Thresholds:
    # Partial Squat
    squat_min_depth_deg: float = 140.0     # knee flexion ≤ this → adequate depth (not too straight) - adjusted for partial squat (was 150°)
    squat_max_depth_deg: float = 100.0     # knee flexion ≥ this → not too deep (not too bent) - adjusted for partial squat (was 80°)
    squat_max_forward_lean_deg: float = 35.0
    squat_max_knee_valgus_deg: float = 15.0  # frontal knee collapse beyond this - increased threshold (was 10°) since current measurement is approximate
    squat_max_heel_lift_cm: float = 5.0

    # Heel Raises
    heel_min_raise_cm: float = 2.0
    heel_symmetry_max_diff_pct: float = 15.0
    heel_max_ankle_roll_deg: float = 8.0  # inversion/eversion
    heel_max_trunk_lean_deg: float = 15.0  # keep trunk upright

    # Single-Leg Stance
    sls_max_sway_deg: float = 8.0
    sls_max_pelvic_drop_deg: float = 7.0

    # Tandem Stance
    tandem_max_foot_line_dev_cm: float = 10.0  # max distance between front heel and back toe
    tandem_max_trunk_lean_deg: float = 10.0
    tandem_max_head_feet_deviation_deg: float = 10.0  # head should be over feet

    # Functional Reach
    fr_min_reach_ratio: float = 0.7  # ~70% of arm length as conservative floor
    fr_min_trunk_flexion_deg: float = 10.0
    fr_max_trunk_flexion_deg: float = 30.0

    # Tree Pose
    tree_max_pelvic_shift_deg: float = 8.0
    tree_max_trunk_sway_deg: float = 8.0
    tree_max_arm_misalignment_deg: float = 10.0
    tree_min_leg_lift_cm: float = 10.0  # minimum ankle height difference to confirm leg is lifted


@dataclass
class PoseResult:
    pose: str
    score: int  # 1–5 (star rating)
    pass_fail: bool
    reasons: List[str]
    metrics: Dict[str, float]
    thresholds: Dict[str, float]


def _score_from_flags(total_checks: int, fails: int) -> int:
    """
    Convert pass/fail checks to a 1-5 star rating.
    - 100% pass (0 fails) = 5 stars
    - 80%+ pass = 4 stars
    - 60%+ pass = 3 stars
    - 40%+ pass = 2 stars
    - Below 40% = 1 star
    """
    passed = max(0, total_checks - fails)
    pass_percentage = passed / max(1, total_checks)
    
    if pass_percentage >= 1.0:
        return 5
    elif pass_percentage >= 0.8:
        return 4
    elif pass_percentage >= 0.6:
        return 3
    elif pass_percentage >= 0.4:
        return 2
    else:
        return 1


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
    # Start with 5 checks, but reduce if facing sideways (skip knee alignment)
    checks = 5
    is_facing_sideways = metrics.get("is_facing_sideways", False)
    if is_facing_sideways:
        checks = 4  # Skip knee alignment check when facing sideways

    fails += _bool_fail(metrics["knee_flexion_deg"] > th.squat_min_depth_deg,
                        f"Go deeper: knee flexion {metrics['knee_flexion_deg']:.0f}° > {th.squat_min_depth_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["knee_flexion_deg"] < th.squat_max_depth_deg,
                        f"Don't go too deep: knee flexion {metrics['knee_flexion_deg']:.0f}° < {th.squat_max_depth_deg:.0f}°.", reasons)
    # Only check knee alignment if facing forward (not sideways)
    # When facing sideways, knees should be apart, so this check doesn't apply
    if not is_facing_sideways:
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

    Required metrics: heel_height_cm, symmetry_diff_pct, ankle_roll_deg, trunk_forward_lean_deg
    """
    req = ["heel_height_cm", "symmetry_diff_pct", "ankle_roll_deg", "trunk_forward_lean_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Heel Raises missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4

    fails += _bool_fail(metrics["heel_height_cm"] < th.heel_min_raise_cm,
                        f"Raise higher: heel height {metrics['heel_height_cm']:.1f} cm < {th.heel_min_raise_cm:.1f} cm.", reasons)
    fails += _bool_fail(metrics["symmetry_diff_pct"] > th.heel_symmetry_max_diff_pct,
                        f"Match sides: asymmetry {metrics['symmetry_diff_pct']:.0f}% > {th.heel_symmetry_max_diff_pct:.0f}%.", reasons)
    fails += _bool_fail(abs(metrics.get("ankle_roll_deg", 0.0)) > th.heel_max_ankle_roll_deg,
                        f"Neutral ankles: roll {metrics.get('ankle_roll_deg', 0.0):.0f}° > {th.heel_max_ankle_roll_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["trunk_forward_lean_deg"] > th.heel_max_trunk_lean_deg,
                        f"Keep trunk upright: lean {metrics['trunk_forward_lean_deg']:.0f}° > {th.heel_max_trunk_lean_deg:.0f}°.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Heel Raises",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Good height and symmetry."],
        metrics={k: metrics[k] for k in req if k in metrics},
        thresholds=asdict(th),
    )


def validate_single_leg_stance(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Single-Leg Stance (SLS).

    Required metrics: sway_peak_deg, pelvic_drop_deg
    """
    req = ["sway_peak_deg", "pelvic_drop_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"SLS missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 2

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
    """Validate Tandem Stance (auto-detects foot position based on rightmost point).

    Required metrics: foot_line_deviation_cm, trunk_forward_lean_deg, head_feet_alignment_deg
    """
    req = ["foot_line_deviation_cm", "trunk_forward_lean_deg", "head_feet_alignment_deg"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tandem Stance missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 3

    fails += _bool_fail(metrics["foot_line_deviation_cm"] > th.tandem_max_foot_line_dev_cm,
                        f"Bring feet closer: gap {metrics['foot_line_deviation_cm']:.1f} cm > {th.tandem_max_foot_line_dev_cm:.1f} cm.", reasons)
    fails += _bool_fail(abs(metrics["trunk_forward_lean_deg"]) > th.tandem_max_trunk_lean_deg,
                        f"Stand tall: trunk lean {metrics['trunk_forward_lean_deg']:.0f}° > {th.tandem_max_trunk_lean_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["head_feet_alignment_deg"] > th.tandem_max_head_feet_deviation_deg,
                        f"Align head over feet: {metrics['head_feet_alignment_deg']:.0f}° > {th.tandem_max_head_feet_deviation_deg:.0f}°.", reasons)

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
    checks = 4

    fails += _bool_fail(metrics["reach_distance_ratio"] < th.fr_min_reach_ratio,
                        f"Reach further: ratio {metrics['reach_distance_ratio']:.2f} < {th.fr_min_reach_ratio:.2f}.", reasons)
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
    """Validate Tree Pose (auto-detects which leg is lifted).

    Required metrics: pelvic_drop_deg, sway_peak_deg, arm_overhead_alignment_deg, leg_lift_height_cm
    """
    req = ["pelvic_drop_deg", "sway_peak_deg", "arm_overhead_alignment_deg", "leg_lift_height_cm"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tree Pose missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4
    
    # Determine which leg is lifted for pose name
    lifted_leg = metrics.get('lifted_leg', 'unknown')
    pose_name = f"Tree Pose (Right Leg Lifted)" if lifted_leg == 'right' else f"Tree Pose (Left Leg Lifted)" if lifted_leg == 'left' else "Tree Pose"

    fails += _bool_fail(abs(metrics["pelvic_drop_deg"]) > th.tree_max_pelvic_shift_deg,
                        f"Level hips: shift {metrics['pelvic_drop_deg']:.0f}° > {th.tree_max_pelvic_shift_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["sway_peak_deg"] > th.tree_max_trunk_sway_deg,
                        f"Align shoulders over hips: {metrics['sway_peak_deg']:.0f}° > {th.tree_max_trunk_sway_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["arm_overhead_alignment_deg"]) > th.tree_max_arm_misalignment_deg,
                        f"Align arms overhead: error {metrics['arm_overhead_alignment_deg']:.0f}° > {th.tree_max_arm_misalignment_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["leg_lift_height_cm"] < th.tree_min_leg_lift_cm,
                        f"Lift {lifted_leg} leg higher: {metrics['leg_lift_height_cm']:.1f} cm < {th.tree_min_leg_lift_cm:.1f} cm.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose=pose_name,
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Centered and aligned."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_tree_pose_right(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Tree Pose with right leg lifted (standing on left leg).

    Required metrics: pelvic_drop_deg, sway_peak_deg, arm_overhead_alignment_deg, leg_lift_height_cm
    """
    req = ["pelvic_drop_deg", "sway_peak_deg", "arm_overhead_alignment_deg", "leg_lift_height_cm"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tree Pose (Right) missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4

    fails += _bool_fail(abs(metrics["pelvic_drop_deg"]) > th.tree_max_pelvic_shift_deg,
                        f"Level hips: shift {metrics['pelvic_drop_deg']:.0f}° > {th.tree_max_pelvic_shift_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["sway_peak_deg"] > th.tree_max_trunk_sway_deg,
                        f"Align shoulders over hips: {metrics['sway_peak_deg']:.0f}° > {th.tree_max_trunk_sway_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["arm_overhead_alignment_deg"]) > th.tree_max_arm_misalignment_deg,
                        f"Align arms overhead: error {metrics['arm_overhead_alignment_deg']:.0f}° > {th.tree_max_arm_misalignment_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["leg_lift_height_cm"] < th.tree_min_leg_lift_cm,
                        f"Lift right leg higher: {metrics['leg_lift_height_cm']:.1f} cm < {th.tree_min_leg_lift_cm:.1f} cm.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Tree Pose (Right Leg)",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Centered and aligned - right leg lifted."],
        metrics={k: metrics[k] for k in req},
        thresholds=asdict(th),
    )


def validate_tree_pose_left(metrics: Dict[str, float], th: Thresholds = Thresholds()) -> PoseResult:
    """Validate Tree Pose with left leg lifted (standing on right leg).

    Required metrics: pelvic_drop_deg, sway_peak_deg, arm_overhead_alignment_deg, leg_lift_height_cm
    """
    req = ["pelvic_drop_deg", "sway_peak_deg", "arm_overhead_alignment_deg", "leg_lift_height_cm"]
    missing = [k for k in req if k not in metrics]
    if missing:
        raise KeyError(f"Tree Pose (Left) missing metrics: {missing}")

    reasons: List[str] = []
    fails = 0
    checks = 4

    fails += _bool_fail(abs(metrics["pelvic_drop_deg"]) > th.tree_max_pelvic_shift_deg,
                        f"Level hips: shift {metrics['pelvic_drop_deg']:.0f}° > {th.tree_max_pelvic_shift_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["sway_peak_deg"] > th.tree_max_trunk_sway_deg,
                        f"Align shoulders over hips: {metrics['sway_peak_deg']:.0f}° > {th.tree_max_trunk_sway_deg:.0f}°.", reasons)
    fails += _bool_fail(abs(metrics["arm_overhead_alignment_deg"]) > th.tree_max_arm_misalignment_deg,
                        f"Align arms overhead: error {metrics['arm_overhead_alignment_deg']:.0f}° > {th.tree_max_arm_misalignment_deg:.0f}°.", reasons)
    fails += _bool_fail(metrics["leg_lift_height_cm"] < th.tree_min_leg_lift_cm,
                        f"Lift left leg higher: {metrics['leg_lift_height_cm']:.1f} cm < {th.tree_min_leg_lift_cm:.1f} cm.", reasons)

    score = _score_from_flags(checks, fails)
    return PoseResult(
        pose="Tree Pose (Left Leg)",
        score=score,
        pass_fail=(fails == 0),
        reasons=reasons or ["Centered and aligned - left leg lifted."],
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
    "tree_pose_left": validate_tree_pose_left,
    "tree_pose_right": validate_tree_pose_right,
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
    "You are PT Pal, a friendly physical-therapy coaching assistant for kids age 4-9. "
    "CRITICAL RULES FOR FEEDBACK: "
    "1. Keep ALL messages extremely brief - MAXIMUM 4-6 WORDS EACH. "
    "2. Use SIMPLE, CONCRETE words that a 5-year-old understands. "
    "3. NEVER use vague terms like 'align', 'adjust', 'position', 'straighten' - be SPECIFIC. "
    "4. Tell the child EXACTLY what to do with their body parts using simple action words. "
    "5. Use visual/spatial language: 'move your knees closer together', 'bend your knees more', 'keep your heels on the floor'. "
    "6. Be SPECIFIC about which body part and what direction: 'bend your knees more', 'lower your body down', 'stand up straighter'. "
    "7. Use only the metrics and reasons provided. Do not make diagnoses or medical claims. "
    "8. Return a STRICT JSON object that matches the provided JSON Schema exactly. "
    "9. Limit to at most 3 concrete cues. Each cue ACTION must be a simple, specific instruction. "
    ""
    "GOOD EXAMPLES (specific, child-friendly): "
    "- 'Bend your knees more' (not 'align knees') "
    "- 'Keep your heels on the floor' (not 'adjust foot position') "
    "- 'Stand up straighter' (not 'improve posture') "
    "- 'Lower your body down more' (not 'increase depth') "
    "- 'Keep your back straight' (not 'maintain alignment') "
    ""
    "IMPORTANT: If the person is facing sideways (is_facing_sideways=true in metrics), "
    "NEVER suggest 'move knees closer together' or 'bring knees together' - this doesn't make sense when facing sideways. "
    "When facing sideways, knees should be apart. Only check knee alignment when facing forward."
    ""
    "BAD EXAMPLES (vague, not child-friendly): "
    "- 'Align knees' (too vague - what does align mean?) "
    "- 'Adjust position' (what position? how?) "
    "- 'Improve form' (what form? how?) "
    "- 'Correct alignment' (what alignment? how?) "
    ""
    "For each cue, the ACTION field must be a simple, specific instruction that tells the child exactly what to do with their body."
)

LLM_USER_TEMPLATE = (
    "Pose: {pose}\n"
    "Score: {score} (pass: {passed})\n"
    "Reasons: {reasons}\n"
    "Metrics: {metrics}\n"
    "Thresholds: {thresholds}\n"
    "\n"
    "IMPORTANT: Generate feedback for a child age 5-9. "
    "Each cue ACTION must be:\n"
    "- A simple, specific instruction (4-6 words max)\n"
    "- Use concrete action words (bend, move, keep, lower, raise, stand, etc.)\n"
    "- Specify which body part and what to do (e.g., 'Bend your knees more', not 'Align knees')\n"
    "- Avoid vague words like 'align', 'adjust', 'position', 'straighten' - be very specific\n"
    "- Make it something a 5-year-old can understand and do immediately\n"
    "\n"
    "User profile: tone={tone}, reading_level={reading_level}, language={language}.\n"
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


def get_llm_feedback(result: PoseResult, tone: str = "coach", reading_level: str = "elementary", language: str = "en") -> dict:
    """Get AI-enhanced feedback from OpenAI for a pose result.
    
    Returns a dict with LLM feedback or None if OpenAI is not configured.
    """
    if not client:
        print("LLM feedback unavailable: OpenAI client not initialized. Check OPENAI_API_KEY environment variable.")
        return None
    
    try:
        messages = build_llm_messages(result, tone, reading_level, language)
        
        response = client.chat.completions.create(
            model="gpt-4o",  # gpt-4o supports JSON mode
            messages=messages,
            temperature=0.7,  # Slightly higher for more creative, child-friendly language
            max_tokens=200,  # Increased to allow for slightly longer but clearer instructions
            response_format={"type": "json_object"}  # Ensures JSON output
        )
        
        # Parse the JSON response
        import json
        llm_output = json.loads(response.choices[0].message.content)
        
        return {
            "pose": llm_output.get("pose", result.pose),
            "severity": llm_output.get("severity", "ok"),
            "summary": llm_output.get("summary", ""),
            "cues": llm_output.get("cues", []),
            "next_rep_focus": llm_output.get("next_rep_focus", ""),
            "encouragement": llm_output.get("encouragement", "Keep going!"),
            "safety_flags": llm_output.get("safety_flags", []),
            "confidence": llm_output.get("confidence", 1.0)
        }
    
    except Exception as e:
        print(f"Error getting LLM feedback: {e}")
        return None



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
    "metrics": {"sway_peak_deg": 9, "pelvic_drop_deg": 4}
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
            "trunk_forward_lean_deg": 8.0,
        },
        "single_leg_stance": {
            "sway_peak_deg": 20.0,
            "pelvic_drop_deg": 5.0,
        },
        "tandem_stance": {
            "foot_line_deviation_cm": 8.0,
            "trunk_forward_lean_deg": 6.0,
            "head_feet_alignment_deg": 5.0,
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
            "leg_lift_height_cm": 25.0,
            "lifted_leg": "right",
        },
        "tree_pose_left": {
            "pelvic_drop_deg": 3.0,
            "sway_peak_deg": 5.0,
            "arm_overhead_alignment_deg": 6.0,
            "leg_lift_height_cm": 25.0,
        },
        "tree_pose_right": {
            "pelvic_drop_deg": 3.0,
            "sway_peak_deg": 5.0,
            "arm_overhead_alignment_deg": 6.0,
            "leg_lift_height_cm": 25.0,
        },
    }

    for k, m in sample.items():
        res = evaluate_pose(k, m)
        print(f"{res.pose}: score={res.score}, pass={res.pass_fail}, reasons={res.reasons}")
        # Only use LLM if client is available
        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=build_llm_messages(res),
                    response_format={"type": "json_object"}
                )
                print(f"LLM Response: {response.choices[0].message.content}")
            except Exception as e:
                print(f"LLM Error: {e}")
        else:
            print("LLM client not available (no API key)")
