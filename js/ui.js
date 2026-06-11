// Updates the on-screen text showing financial state

window.updateUI = function () {

  let disposable = calculateDisposableIncome();

  // Percentages
  let debtP = Math.round(allocations.debt * 100);
  let saveP = Math.round(allocations.save * 100);
  let investP = Math.round(allocations.invest * 100);

  // Money values
  let debtA = Math.round(disposable * allocations.debt);
  let saveA = Math.round(disposable * allocations.save);
  let investA = Math.round(disposable * allocations.invest);

  // 🔝 Top total display
  document.querySelector('#totalMoneyText')
    .setAttribute('value', `Available: £${disposable}`);

  // 📊 Per slider values
  document.querySelector('#debtValue')
    .setAttribute('value', `${debtP}% (£${debtA
    })`);

  document.querySelector('#saveValue')
    .setAttribute('value', `${saveP}% (£${saveA})`);

  document.querySelector('#investValue')
    .setAttribute('value', `${investP}% (£${investA})`);
};

// run once at start
window.onload = () => {
  updateUI();
};