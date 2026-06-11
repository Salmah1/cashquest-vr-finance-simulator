// Global player object
// Stores all financial and life data for the player
// Attached to 'window' so all other files can access it

window.player = {
  salary: 2000,   // monthly salary
  savings: 1000,

  debt: {
    studentLoan: 5000,
    mortgage: 0
  },

  expenses: {
    rent: 500,
    food: 200,
    transport: 100
  },

  investments: {
    stocks: 0,
    savings: 0
  },

  assets: {
    savings: 0,
    cashISA: 0,
    lisa: 0,
    bonds: 0
  },

  finance: {
    yearlyISAContribution: 0,
    yearlyLISAContribution: 0
  }
};