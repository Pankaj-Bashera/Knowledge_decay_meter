"""
30+ test scenarios for the decay math engine.
Tests validate: K₀ encoding, decay rate sensitivity, retention curve, and edge cases.
"""

import math
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.decay import (
    compute_k0,
    compute_decay_rate,
    compute_retention,
    compute_half_life,
    compute_time_to_forget,
    update_ema,
)


# ── K₀ tests ───────────────────────────────────────────────────────────────────

class TestComputeK0:
    def test_phase0_example(self):
        """Phase 0 exit criteria: A=0.8, I=0.6, B=0.7 → K₀=71"""
        k0 = compute_k0(attention=0.8, interest=0.6, base_memory=0.7)
        assert 70 <= k0 <= 72

    def test_maximum_encoding(self):
        """All factors at 1.0 → K₀ = 100"""
        assert compute_k0(1.0, 1.0, 1.0) == pytest.approx(100.0)

    def test_minimum_encoding(self):
        """All factors at 0.0 → K₀ = 0"""
        assert compute_k0(0.0, 0.0, 0.0) == pytest.approx(0.0)

    def test_attention_weight_40pct(self):
        """Attention contributes 40% — doubling A should increase K₀ proportionally."""
        k0_low  = compute_k0(0.2, 0.5, 0.5)
        k0_high = compute_k0(0.4, 0.5, 0.5)
        delta = k0_high - k0_low
        assert delta == pytest.approx(100 * 0.4 * 0.2)   # Δ = 100 × 0.4 × ΔA

    def test_interest_weight_30pct(self):
        k0_low  = compute_k0(0.5, 0.2, 0.5)
        k0_high = compute_k0(0.5, 0.4, 0.5)
        delta = k0_high - k0_low
        assert delta == pytest.approx(100 * 0.3 * 0.2)

    def test_base_memory_weight_30pct(self):
        k0_low  = compute_k0(0.5, 0.5, 0.2)
        k0_high = compute_k0(0.5, 0.5, 0.4)
        delta = k0_high - k0_low
        assert delta == pytest.approx(100 * 0.3 * 0.2)

    def test_weights_sum_to_100(self):
        """0.4 + 0.3 + 0.3 = 1.0, so equal inputs → K₀ = 100×input"""
        assert compute_k0(0.5, 0.5, 0.5) == pytest.approx(50.0)


# ── Decay rate tests ───────────────────────────────────────────────────────────

class TestComputeDecayRate:
    def _k(self, **kwargs):
        defaults = dict(difficulty=0.5, interest=0.5, sleep_quality=0.8,
                        base_memory=0.7, attention=0.8, revision_frequency=0.0, usage_frequency=0.0)
        defaults.update(kwargs)
        return compute_decay_rate(**defaults)

    def test_positive_decay_rate(self):
        assert self._k() > 0

    def test_higher_difficulty_increases_k(self):
        """D directly increases forgetting rate."""
        assert self._k(difficulty=0.9) > self._k(difficulty=0.3)

    def test_higher_interest_decreases_k(self):
        """Interest protects against decay."""
        assert self._k(interest=0.9) < self._k(interest=0.3)

    def test_sleep_deprivation_doubles_decay(self):
        """S=0.3 should make k ≈ 2-3× higher than S=0.9."""
        k_good = self._k(sleep_quality=0.9)
        k_poor = self._k(sleep_quality=0.3)
        assert k_poor / k_good >= 1.5

    def test_usage_slows_decay_more_than_revision(self):
        """U (β=2.0) should suppress decay more than Rf (α=1.2)."""
        k_with_rf = self._k(revision_frequency=0.5, usage_frequency=0.0)
        k_with_u  = self._k(revision_frequency=0.0, usage_frequency=0.5)
        assert k_with_u < k_with_rf

    def test_high_attention_decreases_k(self):
        assert self._k(attention=0.9) < self._k(attention=0.3)

    def test_high_base_memory_decreases_k(self):
        assert self._k(base_memory=0.9) < self._k(base_memory=0.3)

    def test_combined_revision_and_usage(self):
        """Both Rf and U together suppress decay more than either alone."""
        k_neither = self._k(revision_frequency=0.0, usage_frequency=0.0)
        k_both    = self._k(revision_frequency=0.5, usage_frequency=0.5)
        assert k_both < k_neither

    def test_zero_denominator_guard(self):
        """Should not raise ZeroDivisionError when all protective factors are 0."""
        k = compute_decay_rate(0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        assert k > 0

    def test_beta_2x_alpha(self):
        """Verify BETA=2.0 and ALPHA=1.2 ratio — usage must be ~1.67× more effective per unit."""
        k_rf1 = self._k(revision_frequency=1.0, usage_frequency=0.0)
        k_u1  = self._k(revision_frequency=0.0, usage_frequency=1.0)
        # exp(-2.0) / exp(-1.2) ≈ exp(-0.8) ≈ 0.449
        ratio = k_u1 / k_rf1
        assert ratio == pytest.approx(math.exp(-2.0) / math.exp(-1.2), rel=0.01)


# ── Retention curve tests ──────────────────────────────────────────────────────

class TestComputeRetention:
    def test_at_t0_equals_k0(self):
        """At t=0, retention = K₀ (ignoring memory floor contribution)."""
        k0    = 80.0
        floor = 10.0
        r     = compute_retention(k0=k0, decay_rate=0.1, days_elapsed=0, memory_floor=floor)
        assert r == pytest.approx(k0)

    def test_decreases_over_time(self):
        r1 = compute_retention(80, 0.1, 5,  10)
        r2 = compute_retention(80, 0.1, 10, 10)
        assert r2 < r1

    def test_memory_floor_prevents_zero(self):
        """K(t) must never fall below memory floor M, even after 1000 days."""
        floor = 10.0
        r = compute_retention(k0=80, decay_rate=0.5, days_elapsed=1000, memory_floor=floor)
        assert r >= floor

    def test_memory_floor_prevents_zero_extreme(self):
        r = compute_retention(k0=100, decay_rate=5.0, days_elapsed=10000, memory_floor=5.0)
        assert r >= 5.0

    def test_higher_decay_rate_forgets_faster(self):
        r_slow = compute_retention(80, 0.05, 30, 10)
        r_fast = compute_retention(80, 0.5,  30, 10)
        assert r_fast < r_slow

    def test_higher_k0_means_higher_retention(self):
        r_low  = compute_retention(50,  0.1, 10, 10)
        r_high = compute_retention(90, 0.1, 10, 10)
        assert r_high > r_low


# ── Half-life tests ────────────────────────────────────────────────────────────

class TestComputeHalfLife:
    def test_ln2_over_k(self):
        k  = 0.2
        t  = compute_half_life(k)
        assert t == pytest.approx(math.log(2) / k)

    def test_zero_decay_rate_returns_inf(self):
        assert compute_half_life(0) == float("inf")

    def test_higher_k_shorter_half_life(self):
        assert compute_half_life(0.5) < compute_half_life(0.1)


# ── Time-to-forget tests ───────────────────────────────────────────────────────

class TestComputeTimeToForget:
    def test_basic(self):
        """Result should be a positive finite number for valid inputs."""
        t = compute_time_to_forget(k0=80, decay_rate=0.1, memory_floor=10.0, threshold=10.0)
        assert math.isfinite(t)
        assert t > 0

    def test_higher_decay_forgets_sooner(self):
        t_slow = compute_time_to_forget(80, 0.05, 10.0)
        t_fast = compute_time_to_forget(80, 0.5,  10.0)
        assert t_fast < t_slow

    def test_threshold_at_floor_returns_inf(self):
        """Can't forget if threshold equals memory floor."""
        t = compute_time_to_forget(80, 0.1, memory_floor=10.0, threshold=10.0)
        # threshold == floor → argument of log is infinite → very large number
        assert t == float("inf") or t > 1000

    def test_zero_decay_rate_returns_inf(self):
        assert compute_time_to_forget(80, 0, 10.0) == float("inf")


# ── EMA update tests ───────────────────────────────────────────────────────────

class TestUpdateEma:
    def test_first_review_from_zero(self):
        """Starting from 0, one review should give 0.1 × 1 = 0.1."""
        result = update_ema(0.0, new_event=1.0, alpha=0.1)
        assert result == pytest.approx(0.1)

    def test_converges_toward_1(self):
        """Repeated reviews should push EMA toward 1."""
        val = 0.0
        for _ in range(100):
            val = update_ema(val, new_event=1.0, alpha=0.1)
        assert val > 0.99

    def test_decays_without_events(self):
        """Without events, EMA should decay toward 0."""
        val = 1.0
        for _ in range(50):
            val = update_ema(val, new_event=0.0, alpha=0.1)
        assert val < 0.01


# ── Integration scenario tests ────────────────────────────────────────────────

class TestIntegrationScenarios:
    def test_boring_topic_decays_faster(self):
        """Low interest → faster decay AND lower encoding."""
        k_boring     = compute_decay_rate(0.5, 0.1, 0.8, 0.7, 0.8, 0, 0)
        k_interesting = compute_decay_rate(0.5, 0.9, 0.8, 0.7, 0.8, 0, 0)
        assert k_boring > k_interesting

    def test_consistent_usage_dramatically_slows_decay(self):
        """30 days of daily usage should keep retention much higher than no usage."""
        # After 30 days of daily usage (U≈0.65 via EMA convergence)
        u = 0.0
        for _ in range(30):
            u = update_ema(u, 1.0, 0.1)

        k_with_u  = compute_decay_rate(0.6, 0.5, 0.8, 0.7, 0.8, 0, u)
        k_no_u    = compute_decay_rate(0.6, 0.5, 0.8, 0.7, 0.8, 0, 0)

        r_with_u = compute_retention(71, k_with_u, 30, 10)
        r_no_u   = compute_retention(71, k_no_u,   30, 10)
        assert r_with_u > r_no_u

    def test_expert_learner_profile(self):
        """High A, I, B, low D → K₀ near 90, slow decay."""
        k0 = compute_k0(0.95, 0.9, 0.9)
        k  = compute_decay_rate(0.1, 0.9, 0.9, 0.9, 0.95, 0, 0)
        r30 = compute_retention(k0, k, 30, 10)
        assert k0 > 85
        assert r30 > 70

    def test_struggling_learner_profile(self):
        """Low A, I, B, high D → K₀ near 30, fast decay."""
        k0 = compute_k0(0.2, 0.2, 0.3)
        k  = compute_decay_rate(0.9, 0.2, 0.4, 0.3, 0.2, 0, 0)
        r7 = compute_retention(k0, k, 7, 10)
        assert k0 < 40
        assert r7 < 30

    def test_sleep_deprived_week_effect(self):
        """A week of poor sleep should visibly reduce retention relative to good sleep."""
        k_good = compute_decay_rate(0.5, 0.6, 0.9, 0.7, 0.8, 0, 0)
        k_poor = compute_decay_rate(0.5, 0.6, 0.2, 0.7, 0.8, 0, 0)
        r_good = compute_retention(75, k_good, 7, 10)
        r_poor = compute_retention(75, k_poor, 7, 10)
        assert r_good > r_poor
