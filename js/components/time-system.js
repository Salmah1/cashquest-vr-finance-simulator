//Calculates income based salary and total expenses, and returns the disposable income

window.calculateDisposableIncome = function () {
  let totalExpenses = Object.values(player.expenses)
    .reduce((a, b) => a + b, 0);

  return player.salary - totalExpenses;
};