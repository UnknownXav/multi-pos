/**
 * Water Billing calculation utilities
 */

interface Tier {
    fromCubicMeters: number;
    toCubicMeters: number | null;
    rate: number;
    isMinimum: boolean;
}

/**
 * Calculates the amount due based on tiered rates
 */
export function calculateTieredAmount(consumption: number, tiers: Tier[]): number {
    let total = 0;
    let remainingConsumption = consumption;

    // Sort tiers just in case
    const sortedTiers = [...tiers].sort((a, b) => a.fromCubicMeters - b.fromCubicMeters);

    for (const tier of sortedTiers) {
        if (remainingConsumption <= 0 && total > 0) break; // Already covered consumption

        const tierRange = tier.toCubicMeters === null ? Infinity : tier.toCubicMeters - tier.fromCubicMeters;

        if (tier.isMinimum) {
            total += tier.rate; // Minimum charge
            remainingConsumption -= Math.min(remainingConsumption, tier.toCubicMeters || Infinity);
        } else {
            const consumptionInTier = Math.min(Math.max(0, remainingConsumption), tierRange);
            total += consumptionInTier * tier.rate;
            remainingConsumption -= consumptionInTier;
        }
    }

    return total;
}
