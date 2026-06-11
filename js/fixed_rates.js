const FinanceConfig = {
  savings: { annualRate: 0.03 },
  cashISA: { annualRate: 0.04, annualLimit: 20000 },
  lisa: { annualRate: 0.045, annualLimit: 4000, bonusRate: 0.25 },
  bonds: { annualRate: 0.02, totalLimit: 50000 }
};

function getMonthlyRate(rate) {
  return rate / 12;
}

function depositToSavings(player, amount) {
  if (player.money < amount || amount <= 0) return false;

  player.money -= amount;
  player.assets.savings += amount;
  return true;
}

function depositToCashISA(player, amount) {
  const remainingISAAllowance =
    FinanceConfig.cashISA.annualLimit - player.finance.yearlyISAContribution;

  if (player.money < amount || amount <= 0) return false;
  if (amount > remainingISAAllowance) return false;

  player.money -= amount;
  player.assets.cashISA += amount;
  player.finance.yearlyISAContribution += amount;
  return true;
}

function depositToLISA(player, amount) {
  const remainingISAAllowance =
    FinanceConfig.cashISA.annualLimit - player.finance.yearlyISAContribution;

  const remainingLISAAllowance =
    FinanceConfig.lisa.annualLimit - player.finance.yearlyLISAContribution;

  if (player.money < amount || amount <= 0) return false;
  if (amount > remainingISAAllowance) return false;
  if (amount > remainingLISAAllowance) return false;

  const bonus = amount * FinanceConfig.lisa.bonusRate;

  player.money -= amount;
  player.assets.lisa += amount + bonus;
  player.finance.yearlyISAContribution += amount;
  player.finance.yearlyLISAContribution += amount;

  return true;
}

function depositToBonds(player, amount) {
  const remainingBondAllowance =
    FinanceConfig.bonds.totalLimit - player.assets.bonds;

  if (player.money < amount || amount <= 0) return false;
  if (amount > remainingBondAllowance) return false;

  player.money -= amount;
  player.assets.bonds += amount;
  return true;
}

function applyMonthlyFinanceGrowth(player) {
  player.assets.savings *= 1 + getMonthlyRate(FinanceConfig.savings.annualRate);
  player.assets.cashISA *= 1 + getMonthlyRate(FinanceConfig.cashISA.annualRate);
  player.assets.lisa *= 1 + getMonthlyRate(FinanceConfig.lisa.annualRate);
  player.assets.bonds *= 1 + getMonthlyRate(FinanceConfig.bonds.annualRate);
}

function resetYearlyFinanceLimits(player) {
  player.finance.yearlyISAContribution = 0;
  player.finance.yearlyLISAContribution = 0;
}

function calculateNetWorth(player) {
  return (
    player.money +
    player.assets.savings +
    player.assets.cashISA +
    player.assets.lisa +
    player.assets.bonds -
    player.debt
  );
}

window.simulateYears = function(years) {

  for (let y = 0; y < years; y++) {

    // yearly salary growth 3%
    player.salary *= 1.03;

    for (let m = 0; m < 12; m++) {

      // earn salary monthly
      player.savings += player.salary;

      // pay expenses
      let expenses =
        player.expenses.rent +
        player.expenses.food +
        player.expenses.transport;

      player.savings -= expenses;

      // apply asset growth
      applyMonthlyFinanceGrowth(player);
    }

    resetYearlyFinanceLimits(player);
  }
};