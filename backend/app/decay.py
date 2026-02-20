"""
Core decay math — pure functions, no DB dependencies.

Equations:
  K₀  = 100 × (0.4A + 0.3I + 0.3B)
  k   = k₀ × (D / (I+S+B+A)) × exp(-(α·Rf + β·U))
  K(t) = M + (K₀ - M) × exp(-k·t)
  t½  = ln(2) / k
"""

import math

# ── Constants ──────────────────────────────────────────────────────────────────
K0_BASE = 0.7   # Base forgetting rate constant
ALPHA   = 1.2   # Revision-frequency weight
BETA    = 2.0   # Usage-frequency weight  (2× more effective than passive review)


# ── Core functions ─────────────────────────────────────────────────────────────

def compute_k0(attention: float, interest: float, base_memory: float) -> float:
    """
    Initial encoding strength on a 0-100 scale.

    Args:
        attention:   A  — how focused the learner was (0-1)
        interest:    I  — intrinsic interest in topic  (0-1)
        base_memory: B  — learner's general memory ability (0-1)

    Returns:
        K₀ in [0, 100]
    """
    return 100.0 * (0.4 * attention + 0.3 * interest + 0.3 * base_memory)


def compute_decay_rate(
    difficulty: float,
    interest: float,
    sleep_quality: float,
    base_memory: float,
    attention: float,
    revision_frequency: float,
    usage_frequency: float,
) -> float:
    """
    Forgetting rate k (per day).

    Higher k → faster forgetting.
    D increases k; I, S, B, A protect against decay.
    Active usage (β=2.0) suppresses decay more than passive review (α=1.2).

    Args:
        difficulty:         D  — topic complexity (0-1)
        interest:           I  — intrinsic interest   (0-1)
        sleep_quality:      S  — last night's sleep quality (0-1)
        base_memory:        B  — general memory ability (0-1)
        attention:          A  — encoding attention (0-1)
        revision_frequency: Rf — passive reviews per day (EMA)
        usage_frequency:    U  — real-world uses per day  (EMA)

    Returns:
        k (per day), always > 0
    """
    numerator   = difficulty
    denominator = interest + sleep_quality + base_memory + attention

    if denominator < 0.1:   # Guard against division by zero
        denominator = 0.1

    suppression = math.exp(-(ALPHA * revision_frequency + BETA * usage_frequency))

    return K0_BASE * (numerator / denominator) * suppression


def compute_retention(
    k0: float,
    decay_rate: float,
    days_elapsed: float,
    memory_floor: float,
) -> float:
    """
    Current knowledge retention K(t) in [M, K₀].

    K(t) = M + (K₀ - M) × exp(-k × t)

    The memory floor M ensures retention never reaches zero —
    matching the neuroscience finding that residual memory persists.
    """
    return memory_floor + (k0 - memory_floor) * math.exp(-decay_rate * days_elapsed)


def compute_half_life(decay_rate: float) -> float:
    """Days until 50% of *above-floor* knowledge is forgotten."""
    if decay_rate <= 0:
        return float("inf")
    return math.log(2) / decay_rate


def compute_time_to_forget(
    k0: float,
    decay_rate: float,
    memory_floor: float,
    threshold: float = 10.0,
) -> float:
    """
    Days until retention drops below `threshold` (default 10 %).

    t_forget = (1/k) × ln((K₀ - M) / (K_T - M))
    """
    if decay_rate <= 0 or threshold <= memory_floor:
        return float("inf")
    numerator = k0 - memory_floor
    denom     = threshold - memory_floor
    if denom <= 0 or numerator <= 0:
        return float("inf")
    return (1.0 / decay_rate) * math.log(numerator / denom)


def update_ema(current: float, new_event: float = 1.0, alpha: float = 0.1) -> float:
    """
    Exponential moving average update for Rf and U.

    EMA = (1 - α) × current + α × new_event
    Call with new_event=1 when review/usage occurs.
    """
    return (1.0 - alpha) * current + alpha * new_event
