// Calculates how much money the player has left after expenses
// This is called "disposable income"

// Tracks which step of the decision process the player is in
window.decisionState = 0;
// 0 = breakdown
// 1 = sliders
// 2 = detailed allocation

window.openDecision = function () {
  const nextBtn = document.querySelector('#nextButton');

  if (nextBtn) {
    nextBtn.setAttribute('visible', true);
    nextBtn.classList.add('clickable');
  }

  decisionState = 0;
  document.querySelector('#uiText')
    .setAttribute('visible', false);

  document.querySelector('#speechBubble')
    .setAttribute('visible', true);

  showBreakdown();
};

window.moveKnob = function(type) {

  let value = allocations[type];

  if (value === undefined) {
    console.error("Missing allocation for:", type);
    return;
  }

  // Convert % → position
  let x = value * 3 - 1.5;

  let knob = document.querySelector(`#${type}Knob`);

  if (!knob) {
    console.error("Knob not found:", type);
    return;
  }

  let pos = knob.getAttribute('position');

  knob.setAttribute('animation', {
    property: 'position',
    to: `${x} ${pos.y} ${pos.z}`,
    dur: 150
  });
};

window.allocations = {
  debt: 1.0,
  save: 0.0,
  invest: 0.0
};

window.updateDebtBubbleUI = function () {

  let totalDebt =
    player.debt.studentLoan +
    player.debt.mortgage;

  document.querySelector('#totalDebtText')
    .setAttribute('value', `Total Debt: £${Math.round(totalDebt)}`);

  document.querySelector('#studentDebtText')
    .setAttribute('value', `Student Loan: £${Math.round(player.debt.studentLoan)}`);

  document.querySelector('#mortgageDebtText')
    .setAttribute('value', `Mortgage: £${Math.round(player.debt.mortgage)}`);

  let disposable = calculateDisposableIncome();

  let repayAmount =
    disposable *
    allocations.debt *
    subBubbleAllocations.debtSub;

  document.querySelector('#debtPayText')
    .setAttribute('value', `Repayment: £${Math.round(repayAmount)}`);
};

function showBreakdown() {

  let yearlyIncome = player.salary * 12;

  // percentages
  let tax = yearlyIncome * 0.20;
  let studentLoan = yearlyIncome * 0.05;
  let housing = yearlyIncome * 0.30;
  let food = yearlyIncome * 0.10;
  let lifestyle = yearlyIncome * 0.15;

  let remaining =
    yearlyIncome -
    tax -
    studentLoan -
    housing -
    food -
    lifestyle;

  document.querySelector('#line1')
    .setAttribute('value', `This year you earned £${Math.round(yearlyIncome)}`);

  document.querySelector('#line2')
    .setAttribute('value', `£${Math.round(tax)} taxes (20%)`);

  document.querySelector('#line3')
    .setAttribute('value', `£${Math.round(studentLoan)} debt repayments (5%)`);

  document.querySelector('#line4')
    .setAttribute('value', `£${Math.round(housing)} housing (30%)`);

  document.querySelector('#line5')
    .setAttribute('value', `£${Math.round(food)} food (10%)`);

  document.querySelector('#line6')
    .setAttribute('value', `£${Math.round(remaining)} free to allocate`);

  let sliderSection = document.querySelector('#sliderSection');
  sliderSection.setAttribute('visible', false);
  sliderSection.setAttribute('scale', '0 0 0');
}

window.addEventListener('load', () => {

  // decision node click
  document.querySelector('#decisionNode')
    .addEventListener('click', openDecision);

  // next button click
  const nextBtn = document.querySelector("#nextButton");
  if(nextBtn){
    nextBtn.addEventListener("click", function(){});
  }
});

function nextStep() {

  if (decisionState === 0) {
    decisionState = 1;
    showSliders();
  } 
  else if (decisionState === 1) {
    decisionState = 2;

    document.querySelector('#speechBubble')
      .setAttribute('visible', false);

    spawnAllocationBubbles();
  }
}


function showSliders() {

  console.log("SHOW SLIDERS RUNNING");

  // Clear old text
  document.querySelector('#line1').setAttribute('value', "Allocate your money");
  document.querySelector('#line2').setAttribute('value', "Adjust sliders below");
  document.querySelector('#line3').setAttribute('value', "");
  document.querySelector('#line4').setAttribute('value', "");
  document.querySelector('#line5').setAttribute('value', "");
  document.querySelector('#line6').setAttribute('value', "");

  // Show sliders
  let sliderSection = document.querySelector('#sliderSection');
  sliderSection.setAttribute('visible', true);
  sliderSection.setAttribute('scale', '1 1 1');

  moveKnob("debt");
  moveKnob("save");
  moveKnob("invest");

  updateUI();
}

function applyDebtPayment(amount) {

  if (player.debt.studentLoan > 0) {
    player.debt.studentLoan -= amount;
  }
}

function showDetailedBreakdown() {

  let disposable = calculateDisposableIncome();

  let debtMoney = disposable * allocations.debt;
  let saveMoney = disposable * allocations.save;
  let investMoney = disposable * allocations.invest;

  // Apply debt
  applyDebtPayment(debtMoney);

  let text = `
Debt paid: £${Math.round(debtMoney)}

Savings → example1
Investments → example2
`;

  document.querySelector('#line1').setAttribute('value', "Allocate your money");
  document.querySelector('#line2').setAttribute('value', "");
  document.querySelector('#line3').setAttribute('value', "");
  document.querySelector('#line4').setAttribute('value', "");
  document.querySelector('#line5').setAttribute('value', "");
  document.querySelector('#line6').setAttribute('value', "");

  document.querySelector('#sliderSection')
    .setAttribute('visible', false);
}

function getMainCategory() {

  let max = Math.max(
    allocations.debt,
    allocations.save,
    allocations.invest
  );

  if (allocations.debt === max) return "debt";
  if (allocations.save === max) return "save";
  return "invest";
}

function spawnAllocationBubbles() {
  // Hide and disable next button
  const nextBtn = document.querySelector('#nextButton');

  if (nextBtn) {
    nextBtn.setAttribute('visible', false);
    nextBtn.classList.remove('clickable');
  }

  document.querySelector('#nextButton')
  ?.setAttribute('visible', false);

  document.querySelector('#nextText')
  ?.setAttribute('visible', false);

  console.log("SPAWNING BUBBLES", allocations);

  if (allocations.debt > 0) {
    document.querySelector('#debtBubble')
      .setAttribute('visible', true);

    updateDebtBubbleUI();
  }
  document.querySelector('#saveBubble')
  .setAttribute('visible', true);

  if (allocations.save <= 0) {
    document.querySelector('#submitFinance')
      .setAttribute('position', '0 -0.8 0.1');
  } else {
    document.querySelector('#submitFinance')
      .setAttribute('position', '0 -1.85 0.1');
  }

  if (allocations.invest > 0) {
    document.querySelector('#investBubble')
      .setAttribute('visible', true);
  }
  updateSaveBubbleUI();
}

function moveSubBubbleKnob(type) {

  let value;

  if (type === "savingsSub" ||
      type === "cashISASub" ||
      type === "lisaSub" ||
      type === "bondsSub") {

    value = subSaveBubbleAllocations[type];

  } else {

    value = subBubbleAllocations[type];
  }

  let x = value * 2 - 1;

  let knob = document.querySelector(`#${type}Knob`);

  let pos = knob.getAttribute('position');

  knob.setAttribute('position', `${x} ${pos.y} ${pos.z}`);
}

function updateSaveBubbleUI() {
  let saveBubble = document.querySelector('#saveBubble');

  if (allocations.save <= 0) {
    saveBubble.querySelectorAll('[slider-track]').forEach(el => el.setAttribute('visible', false));
    saveBubble.querySelectorAll('a-sphere').forEach(el => el.setAttribute('visible', false));
    saveBubble.querySelectorAll('a-text').forEach(el => {
      if (el.id !== "saveTotalText") el.setAttribute('visible', false);
    });
    return;
  }
  saveBubble.querySelectorAll('[slider-track], a-sphere, a-text')
  .forEach(el => el.setAttribute('visible', true));

  let disposable = calculateDisposableIncome();

  let saveMoney = disposable * allocations.save;

  document.querySelector("#saveTotalText")
    .setAttribute("value", `Save Budget: £${Math.round(saveMoney)}`);

  const items = [
    "savingsSub",
    "cashISASub",
    "lisaSub",
    "bondsSub"
  ];

  items.forEach(type => {

    let value = subSaveBubbleAllocations[type];

    let percent = Math.round(value * 100);

    let money = Math.round(saveMoney * value);

    let base = type.replace("Sub","");

    document.querySelector(`#${base}Percent`)
      .setAttribute("value", `${percent}%`);

    document.querySelector(`#${base}Money`)
      .setAttribute("value", `£${money}`);
  });
}

if (player.debt.studentLoan <= 0) {
  // hide or disable debt slider
  document.querySelector('[slider="type: debt"]')
    .setAttribute('visible', false);
}

////////////////////////

window.updateAllocation = function(type, value) {

  let newAlloc = { ...allocations };

  newAlloc[type] = value;

  let otherTotal = 0;

  for (let key in newAlloc) {
    if (key !== type) {
      otherTotal += newAlloc[key];
    }
  }

  let maxAllowed = 1 - otherTotal;

  newAlloc[type] = Math.min(value, maxAllowed);

  allocations = newAlloc;

  console.log("UPDATED:", allocations);

  moveKnob("debt");
  moveKnob("save");
  moveKnob("invest");

  updateUI();
};

window.subBubbleAllocations = {
  debtSub: 1,
  investSub: 1
};

window.updateSubBubble = function(type, percent) {

  subBubbleAllocations[type] = percent;

  const knob = document.querySelector(`#${type}Knob`);

  if (knob) {
    let x = -1 + (percent * 2);
    let y = knob.getAttribute('position').y;
    let z = knob.getAttribute('position').z;

    knob.setAttribute('position', `${x} ${y} ${z}`);
  }
};

window.subSaveBubbleAllocations = {
  savingsSub: 1,
  cashISASub: 0,
  lisaSub: 0,
  bondsSub: 0
};

window.updateSubSaveBubble = function(type, value) {

  let newAlloc = { ...subSaveBubbleAllocations };

  newAlloc[type] = value;

  let otherTotal = 0;

  for (let key in newAlloc) {
    if (key !== type) {
      otherTotal += newAlloc[key];
    }
  }

  let maxAllowed = 1 - otherTotal;

  newAlloc[type] = Math.max(0, Math.min(value, maxAllowed));

  subSaveBubbleAllocations = newAlloc;

  moveSubBubbleKnob("savingsSub");
  moveSubBubbleKnob("cashISASub");
  moveSubBubbleKnob("lisaSub");
  moveSubBubbleKnob("bondsSub");

  console.log("SAVE SUB UPDATED:", subSaveBubbleAllocations);
  updateSaveBubbleUI();
};

window.addEventListener('load', () => {

  const nextBtn = document.querySelector('#nextButton');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      console.log("NEXT BUTTON CLICKED");
      nextStep();
    });
  }

window.applyFinanceChoices = function () {

    let disposable = calculateDisposableIncome();

    // -------- Debt repayment --------
    let debtMoney =
      disposable *
      allocations.debt *
      subBubbleAllocations.debtSub;

    // Pay student loan first
    if (player.debt.studentLoan > 0) {

      let pay = Math.min(debtMoney, player.debt.studentLoan);

      player.debt.studentLoan -= pay;
      debtMoney -= pay;
    }

    // Then mortgage
    if (debtMoney > 0 && player.debt.mortgage > 0) {

      let pay = Math.min(debtMoney, player.debt.mortgage);

      player.debt.mortgage -= pay;
      debtMoney -= pay;
    }

    // -------- Savings --------
    let saveMoney = disposable * allocations.save;

    let savingsAmt = saveMoney * subSaveBubbleAllocations.savingsSub;
    let isaAmt = saveMoney * subSaveBubbleAllocations.cashISASub;
    let lisaAmt = saveMoney * subSaveBubbleAllocations.lisaSub;
    let bondAmt = saveMoney * subSaveBubbleAllocations.bondsSub;

    depositToSavings(player, savingsAmt);
    depositToCashISA(player, isaAmt);
    depositToLISA(player, lisaAmt);
    depositToBonds(player, bondAmt);
  };
});