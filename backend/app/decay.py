import math

K0_BASE = 0.7
ALPHA = 1.2
BETA = 2.0


# K0 = Initial encoding(0-100)
def compute_k0(attention, interest, base_memory):
    return 100 * (0.4 * attention + 0.3 * interest + 0.3 * base_memory)

# Forgetting Rate
def compute_decay_rate(difficulty, interest, sleep_quality, base_memory, attention, revision_frequency, usage_frequency):
    numerator = difficulty
    denominator = interest + sleep_quality + base_memory + attention
    if denominator < 0.1:
        denominator = 0.1
    suppression = math.exp(-(ALPHA * revision_frequency + BETA * usage_frequency))
    return K0_BASE * (numerator / denominator) * suppression

# Knowledge retention over time
def compute_retention(k0, decay_rate, days_elapsed, memory_floor):
    return memory_floor + (k0 - memory_floor) * math.exp(-decay_rate * days_elapsed)

# Number of until 50% forgotten
def compute_half_life(decay_rate):
    return math.log(2) / decay_rate if decay_rate > 0 else float('inf')

# Time until practically forgotten
def compute_time_to_forget(k0, decay_rate, memory_floor, threshold=10.0):
    if decay_rate <= 0 or threshold <= memory_floor:
        return float('inf')
    return (1 / decay_rate) * math.log((k0 - memory_floor) / (threshold - memory_floor))