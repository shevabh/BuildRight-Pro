/**
 * Construction Cost Calculation Engine
 * Computes phase-by-phase and total estimates for all builder types
 */

const Calculator = {
  /**
   * Get the regional multiplier (city-level if selected, else state-level)
   */
  getRegionalMultiplier(stateCode, cityKey) {
    const region = CostData.REGIONS[stateCode];
    if (!region) return 1.0;
    if (cityKey && region.cities[cityKey]) {
      return region.cities[cityKey].multiplier;
    }
    return region.multiplier;
  },

  /**
   * Get the permit multiplier for a state
   */
  getPermitMultiplier(stateCode) {
    const region = CostData.REGIONS[stateCode];
    return region ? region.permitMultiplier : 1.0;
  },

  /**
   * Calculate cost for a single phase
   */
  calculatePhaseCost(phaseKey, config) {
    const phase = CostData.BASE_PHASE_COSTS[phaseKey];
    if (!phase) return null;

    const {
      sqft,
      stateCode,
      cityKey,
      builderType,
      qualityTier,
      homeType,
      foundationType
    } = config;

    const regionalMult = this.getRegionalMultiplier(stateCode, cityKey);
    const qualityMult = CostData.QUALITY_TIERS[qualityTier]?.multiplier || 1.0;
    const homeMult = CostData.HOME_TYPES[homeType]?.multiplier || 1.0;
    const builder = CostData.BUILDER_TYPE_MULTIPLIERS[builderType];

    // Base calculation
    let baseCost = phase.baseCostPerSqft * sqft;

    // Apply permit multiplier only to permits phase
    if (phaseKey === 'permits') {
      baseCost *= this.getPermitMultiplier(stateCode);
    }

    // Regional cost adjustment
    baseCost *= regionalMult;

    // Quality tier
    baseCost *= qualityMult;

    // Home type
    baseCost *= homeMult;

    // Foundation adder (only for foundation phase)
    let foundationAdder = 0;
    if (phaseKey === 'foundation' && foundationType) {
      foundationAdder = (CostData.FOUNDATION_TYPES[foundationType]?.adder || 0) * sqft * regionalMult;
    }

    baseCost += foundationAdder;

    // Owner-builder discount (sweat equity)
    let ownerDiscount = 0;
    if (builderType === 'ownerBuilder' && phase.ownerBuilderDiscount > 0) {
      ownerDiscount = baseCost * phase.ownerBuilderDiscount;
      baseCost -= ownerDiscount;
    }

    // GC markup
    let gcMarkup = 0;
    if (builderType === 'gc') {
      gcMarkup = baseCost * (builder.markup - 1);
    }

    // Management fee (noGc and ownerBuilder)
    let mgmtFee = 0;
    if (builder.managementFee > 0) {
      mgmtFee = baseCost * builder.managementFee;
    }

    const totalCost = baseCost + gcMarkup + mgmtFee;

    return {
      phaseKey,
      phaseName: phase.name,
      description: phase.description,
      order: phase.order,
      durationWeeks: phase.durationWeeks,
      baseCost: Math.round(baseCost),
      gcMarkup: Math.round(gcMarkup),
      mgmtFee: Math.round(mgmtFee),
      ownerDiscount: Math.round(ownerDiscount),
      totalCost: Math.round(totalCost),
      costPerSqft: Math.round((totalCost / sqft) * 100) / 100
    };
  },

  /**
   * Calculate garage cost
   */
  calculateGarageCost(garageKey, config) {
    if (!garageKey || garageKey === 'none') return { totalCost: 0, sqft: 0 };
    const garage = CostData.GARAGE_OPTIONS[garageKey];
    if (!garage) return { totalCost: 0, sqft: 0 };

    const regionalMult = this.getRegionalMultiplier(config.stateCode, config.cityKey);
    const qualityMult = CostData.QUALITY_TIERS[config.qualityTier]?.multiplier || 1.0;
    const builder = CostData.BUILDER_TYPE_MULTIPLIERS[config.builderType];

    let cost = garage.cost * regionalMult * qualityMult;

    if (config.builderType === 'gc') {
      cost *= builder.markup;
    } else if (builder.managementFee > 0) {
      cost *= (1 + builder.managementFee);
    }

    return {
      name: garage.name,
      sqft: garage.sqft,
      totalCost: Math.round(cost)
    };
  },

  /**
   * Full project estimate — all phases + garage + contingency
   */
  calculateFullEstimate(config) {
    const phases = {};
    let subtotal = 0;
    let totalWeeks = 0;
    let totalGcMarkup = 0;
    let totalOwnerSavings = 0;

    // Calculate each phase
    Object.keys(CostData.BASE_PHASE_COSTS).forEach(key => {
      const result = this.calculatePhaseCost(key, config);
      phases[key] = result;
      subtotal += result.totalCost;
      totalWeeks += result.durationWeeks;
      totalGcMarkup += result.gcMarkup;
      totalOwnerSavings += result.ownerDiscount;
    });

    // Garage
    const garage = this.calculateGarageCost(config.garageType, config);
    subtotal += garage.totalCost;

    // Contingency (recommend 10-15%)
    const contingencyRate = config.contingencyRate || 0.10;
    const contingency = Math.round(subtotal * contingencyRate);

    const grandTotal = subtotal + contingency;

    return {
      phases,
      garage,
      subtotal,
      contingency,
      contingencyRate,
      grandTotal,
      totalWeeks,
      totalGcMarkup,
      totalOwnerSavings,
      costPerSqft: Math.round((grandTotal / config.sqft) * 100) / 100,
      config
    };
  },

  /**
   * Compare all three builder types side by side
   */
  compareBuilderTypes(baseConfig) {
    const results = {};
    ['gc', 'noGc', 'ownerBuilder'].forEach(type => {
      results[type] = this.calculateFullEstimate({ ...baseConfig, builderType: type });
    });

    // Savings vs GC
    const gcTotal = results.gc.grandTotal;
    results.noGc.savingsVsGc = gcTotal - results.noGc.grandTotal;
    results.noGc.savingsPercent = Math.round((results.noGc.savingsVsGc / gcTotal) * 100);
    results.ownerBuilder.savingsVsGc = gcTotal - results.ownerBuilder.grandTotal;
    results.ownerBuilder.savingsPercent = Math.round((results.ownerBuilder.savingsVsGc / gcTotal) * 100);

    return results;
  },

  /**
   * Format currency
   */
  formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};

if (typeof window !== 'undefined') {
  window.Calculator = Calculator;
}
