// Calculates how much money the player has left after expenses
// This is called "disposable income"

window.calculateDisposableIncome = function () {
  let totalExpenses = Object.values(player.expenses)
    .reduce((a, b) => a + b, 0);

  return player.salary - totalExpenses;
};

// Generates yearly financial breakdown text
window.getFinancialBreakdown = function () {

  let yearlyIncome = player.salary * 12;

  let tax = yearlyIncome * 0.2;
  let studentLoan = 500;
  let rentBills = 6000;
  let food = 1000;
  let lifestyle = 4000;
  let debtMinimum = 500;

  return `
This year you earned £${yearlyIncome}

£${tax} goes to taxes
£${studentLoan} student loan repayment
£${rentBills} rent & bills
£${food} food
£${lifestyle} lifestyle
£${debtMinimum} debt minimums
`;
};