/*
Financial Decisions VR Demo
Features:
  - reusable forked road decision system
  - gaze and walk-through interaction
  - fixed HTML overlay HUD (not affected by VR space)
  - simple state tracking for income, debt, and cash
  - inbetween room shown after every fork decision:
      fork choice -> inbetween room (door locked) -> gaze button to unlock
      -> walk/gaze through door -> back to fork for next decision
*/

/* Defines the visual style for each door.
   Left is red, right is orange. */
const SLOT_STYLES = {
  left: {
    doorColor: "#D64541",
    textColor: "#D64541",
  },
  right: {
    doorColor: "#F39C12",
    textColor: "#F39C12",
  },
};

const DECISION_PAIRS = window.FINANCE_DECISION_PAIRS || [
  {
    id: "study_or_work",
    title: "Decision 1: Choose your first path",
    prompt: "Walk through a door to choose your first major life decision.",
    left: {
      id: "university",
      label: "Go to University",
      feedback:
        "You chose University. Debt goes up now, but later earnings can improve.",
      effects: { income: 0, debt: 27000, cash: -500 },
    },
    right: {
      id: "job",
      label: "Get a Job",
      feedback:
        "You chose Work. Income starts earlier, but without student debt support.",
      effects: { income: 1800, debt: 0, cash: 750 },
    },
  },
  {
    id: "housing",
    title: "Decision 2: Pick your housing approach",
    prompt: "Your first decision has been saved. Choose your next one.",
    left: {
      id: "rent",
      label: "Rent a Flat",
      feedback:
        "You chose Renting. Lower commitment now, but cash flow is tighter each month.",
      effects: { income: 0, debt: 0, cash: -600 },
      baseCost: 600,
    },
    right: {
      id: "buy",
      label: "Buy a House",
      feedback:
        "You chose Buying. Upfront cost and debt increase, but you build ownership.",
      effects: { income: 0, debt: 15000, cash: -4000 },
      baseCost: 4000,
    },
  },
  {
    id: "accom_decision",
    title: "Decision 3: Choose accommodation preferences",
    prompt: "Choose to share accommodation, or live alone.",
    left: {
      id: "share_accom",
      label: "Share",
      feedback: "Sharing accommodation. Costs are reduced.",
      effects: { income: 0, debt: 0, cash: 0 },
    },
    right: {
      id: "live_alone",
      label: "Live Alone",
      feedback: "You chose to live alone. Costs remain the same.",
      effects: { income: 0, debt: 0, cash: 0 },
    },
  },
  {
    id: "transport",
    title: "Decision 4: Choose your method of transport",
    prompt: "Choose to buy a car, or use public transport.",
    left: {
      id: "buy_car",
      label: "Buy Car",
      feedback:
        "You bought a car. More expensive initially, but may open up future opportunities.",
      effects: { income: 0, debt: 0, cash: -5000 },
    },
    right: {
      id: "public_transport",
      label: "Use Public Transport",
      feedback:
        "You chose to use public transport. Smaller, but frequent purchases.",
      effects: { income: 0, debt: 0, cash: -50 },
    },
  },
  {
    id: "spare_money",
    title: "Decision 5: Use your spare money wisely",
    prompt: "Choose how to handle your remaining money.",
    left: {
      id: "pay_debt",
      label: "Pay Off Debt",
      feedback: "You focused on reducing debt. Safer and steadier.",
      effects: { income: 0, debt: -3000, cash: -1000 },
    },
    right: {
      id: "invest",
      label: "Start Investing",
      feedback:
        "You chose investing. Cash drops now in exchange for growth potential later.",
      effects: { income: 150, debt: 0, cash: -1200 },
    },
  },
  {
    id: "career_advancement",
    title: "Decision 6: Career Advancement",
    prompt: "You have an opportunity to advance your career.",
    left: {
      id: "new_job",
      label: "Apply for New Job",
      feedback: "You pursued a new career opportunity.",
      effects: { income: 0, debt: 0, cash: 0 }, // Effects handled by synergy system
    },
    right: {
      id: "stay_job",
      label: "Stay",
      feedback: "You decided to stay in your current position for stability.",
      effects: { income: 0, debt: 0, cash: 0 },
    },
  },
];

const EDUCATIONAL_TEXTS = {
  university:
    "This is essential for specific careers (medicine, law). Statistically, grads earn 20% more over a lifetime. However, degrees no longer guarantee competitive advantages.",
  job: "Starting work early avoids debt but can lead to a career ceiling without specialised qualifications.",
  invest:
    "Investing is putting money into assets (such as stocks, property) that you expect to grow or pay you back",
  rent: "Renting offers flexibility and zero maintenance costs. However, you gain no equity; roughly 30% of average household income is spent on rent.",
  buy: "Buying property builds equity and long-term stability. Homeowners’ net worth is often 40 times higher than renters due to forced savings and appreciation.",
  share_accom:
    "Living with roommates significantly cuts overheads. Sharing a home can save individuals over £500/month on utilities and rent compared to living solo.",
  live_alone:
    'Solo living offers total autonomy but higher costs. On average, "single-person households" spend 90% of their disposable income on living expenses.',
  buy_car:
    "Cars provide freedom but are depreciating assets. A new car typically loses 20% of its value in the first year and 60% after five years.",
  public_transport:
    "Using transit is eco-friendly and cheaper. Switching from driving to public transport can save an individual nearly £8,000 a year.",
  pay_debt:
    "Clearing debt is a guaranteed return on your money. Paying off a 15% interest credit card is mathematically the same as earning 15% on an investment.",
  new_job:
    "Switching roles is often the fastest way to increase pay. Job hoppers see average salary increases of 10% compared to 3% for those who stay put.",
  stay_job:
    "Loyalty can lead to internal promotion and pension stability. Long-term employees often benefit from better job security and benefits packages.",
};

/* choice-door component:
     Handles selecting a choice by gazing at or clicking a door.
     Works for every door in the scene: the two fork doors (slot left/right),
     the start-room exit (slot start), and the inbetween-room exit (slot inbetween). */
AFRAME.registerComponent("choice-door", {
  schema: {
    slot: { default: "left" },
  },

  init: function () {
    this.onClick = () => {
      const demo = this.el.sceneEl.components["finance-demo"];
      if (demo) {
        demo.makeChoice(this.data.slot, "gaze");
      }
    };

    this.el.addEventListener("click", this.onClick);
  },

  remove: function () {
    this.el.removeEventListener("click", this.onClick);
  },
});

/* decision-trigger component:
     Handles selecting a choice by walking into invisible trigger box around door */
AFRAME.registerComponent("decision-trigger", {
  schema: {
    slot: { default: "left" },
    radius: { type: "number", default: 1.35 },
    enabled: { default: true },
  },

  init: function () {
    this.cameraEl = document.querySelector("#player-camera");
    this.triggerWorldPos = new THREE.Vector3();
    this.playerWorldPos = new THREE.Vector3();
    this.wasInside = false;
  },

  tick: function () {
    if (!this.data.enabled || !this.cameraEl) return;

    const demo = this.el.sceneEl.components["finance-demo"];
    if (!demo || !demo.isInteractive()) return;

    this.el.object3D.getWorldPosition(this.triggerWorldPos);
    this.cameraEl.object3D.getWorldPosition(this.playerWorldPos);

    const inside =
      this.triggerWorldPos.distanceTo(this.playerWorldPos) <= this.data.radius;

    if (inside && !this.wasInside) {
      demo.makeChoice(this.data.slot, "walk");
    }

    this.wasInside = inside;
  },
});

/* unlock-button component:
     Wall-mounted gaze button that unlocks a named room's exit door.
     Currently only the inbetween room uses this. */
AFRAME.registerComponent("unlock-button", {
  schema: { room: { default: "inbetween" } },
  init: function () {
    this.onClick = () => {
      const demo = this.el.sceneEl.components["finance-demo"];
      if (demo) {
        demo.unlockRoomDoor(this.data.room);
      }
    };
    this.el.addEventListener("click", this.onClick);
  },
  remove: function () {
    this.el.removeEventListener("click", this.onClick);
  },
});

/*
  Finance-demo main component
  
  Responsible for:
    - tracking game state
    - loading the current pair of decisions into the two door slots
    - updating the HTML HUD overlay
    - applying stat changes
    - handling reset / gaze toggle
    - teleporting the player between the start room, fork, and inbetween room
    - unlocking and resetting the inbetween room between decisions
  */
AFRAME.registerComponent("finance-demo", {
  init: function () {
    this.rigEl = document.querySelector("#rig");
    this.cameraEl = document.querySelector("#player-camera");
    this.cursorEl = document.querySelector("#gaze-cursor");

    // HUD references - HTML overlay elements
    this.titleEl = document.querySelector("#decision-title-html");
    this.feedbackEl = document.querySelector("#choice-feedback-html");
    this.incomeEl = document.querySelector("#hud-income-html");
    this.debtEl = document.querySelector("#hud-debt-html");
    this.cashEl = document.querySelector("#hud-cash-html");
    this.ageEl = document.querySelector("#hud-age-html");
    this.helpEl = document.querySelector("#controls-help-html");
    this.controlHeaderEl = document.querySelector("#controls-header");

    // Audio indicator shown when spoken feedback is active
    this.audioIndicatorEl = document.querySelector("#audio-indicator");
    this.audioStatusEl = document.querySelector("#audio-status");
    this.audioTranscriptEl = document.querySelector("#audio-transcript");
    this.lastTranscript = "";

    // Fork door references
    this.leftDoorEl = document.querySelector("#left-door");
    this.rightDoorEl = document.querySelector("#right-door");
    this.leftLabelEl = document.querySelector("#left-door-label");
    this.rightLabelEl = document.querySelector("#right-door-label");
    this.leftLabelBgEl = document.querySelector("#left-label-bg");
    this.rightLabelBgEl = document.querySelector("#right-label-bg");
    this.leftTriggerEl = document.querySelector("#left-trigger");
    this.rightTriggerEl = document.querySelector("#right-trigger");

    // Theme references for dark mode/contrast mode styling
    this.envGroundEl = document.querySelector("#env-ground");
    this.darkSkyEl = document.querySelector("#dark-sky");
    this.contrastSkyEl = document.querySelector("#contrast-sky");

    // Start room references
    this.startDoorEl = document.querySelector("#start-door");
    this.startTriggerEl = document.querySelector("#start-trigger");

    // Inbetween room references
    this.inbetweenDoorEl = document.querySelector("#inbetween-door");
    this.inbetweenDoorLabelEl = document.querySelector("#inbetween-door-label");
    this.inbetweenTriggerEl = document.querySelector("#inbetween-trigger");
    this.unlockButtonEl = document.querySelector("#unlock-button");
    this.unlockButtonLabelEl = document.querySelector("#unlock-button-label");

    this.submitFinanceEl = document.querySelector("#submitFinance");

    if (this.submitFinanceEl) {
      this.submitFinanceEl.addEventListener("click", () => {
        this.onSubmitFinance();
      });
    }
    if (this.unlockButtonEl) {
      this.unlockButtonEl.classList.add("clickable");
      this.unlockButtonEl.setAttribute("material", "color", "#3498DB");
      this.unlockButtonEl.setAttribute("material", "emissive", "#2980B9");
      this.unlockButtonLabelEl.setAttribute("value", "Unlock Door");
    }

    // Position presets
    // Start room (off to the side so it can't be seen from the fork)
    this.startRoomPosition = { x: 1000, y: 0, z: 5 };
    // Forked road (used after exiting either rooms and at demo completion)
    this.forkPosition = { x: 0, y: 0, z: 10 };
    // Inbetween room (entered after every fork decision)
    this.inbetweenRoomPosition = { x: 2000, y: 0, z: 5 };
    this.startCameraPosition = { x: 0, y: 1.4, z: 0 };

    // end room
    this.endRoomPosition = document
      .querySelector("#endroom")
      .getAttribute("position");

    // Runtime flags
    this.gazeEnabled = false;
    this.locked = false;
    this.inbetweenUnlocked = false;
    this.hasStarted = false;
    this.audioEnabled = false;
    this.voiceEnabled = false;
    this.recognition = null;
    this.darkMode = false;
    this.contrastMode = false;
    this.textSize = false;
    this.pendingAudioMessage = "";
    this.lastTranscript = "";
    this.currentRoom = "start";
    this.isSpeaking = false;
    this.isListening = false;
    // Holds the feedback message to display after the player exits the
    // inbetween room. Set in makeChoice, consumed on inbetween exit.
    this.pendingFeedbackMessage = null;
    this.state = this.createInitialState();

    if (window.financeAccessibility) {
      Object.assign(this, window.financeAccessibility);
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.onKeyDown);

    // Keep the HTML HUD visible in fullscreen mode.
    // In fullscreen, only the fullscreen element and its descendants render.
    // A-Frame makes its canvas the fullscreen element, so our HUD (a sibling
    // of <a-scene>) gets hidden. We reparent the HUD into the fullscreen
    // element on entry and back to <body> on exit.
    this.hudEl = document.querySelector("#hud-overlay");
    this.hudOriginalParent = this.hudEl ? this.hudEl.parentNode : null;
    this.onFullscreenChange = this.onFullscreenChange.bind(this);
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange,
    );

    // Initial setup
    this.setGazeEnabled(false);
    this.audioEnabled = false;
    this.applyTheme();
    this.updateTextSize();
    this.updateHelpText();
    this.loadCurrentPair();
    this.refreshHud("Walk through the green door to begin.");

    //this.setupChart();
  },

  remove: function () {
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      this.onFullscreenChange,
    );
    this.stopVoiceRecognition();
  },

  onFullscreenChange: function () {
    if (!this.hudEl) return;

    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

    if (fsEl) {
      // Enter fullscreen: move HUD inside the fullscreen element
      fsEl.appendChild(this.hudEl);
    } else if (this.hudOriginalParent) {
      // Exit fullscreen: put HUD back where it was
      this.hudOriginalParent.appendChild(this.hudEl);
    }
  },

  createInitialState: function () {
    return {
      pairIndex: 0,
      income: 0,
      debt: 0,
      cash: 2000,
      history: [],
      sharingDiscount: 0.5,
      isSharing: false,
      baseHousingCost: 0,
      age: 18,
    };
  },

  isInteractive: function () {
    return !this.locked && this.state.pairIndex < DECISION_PAIRS.length;
  },

  /*
    Loads the currently active decision pair into the two physical door slots.
    If no more pairs left, demo is complete.
    */
  loadCurrentPair: function () {
    const pair = DECISION_PAIRS[this.state.pairIndex];

    if (!pair) {
      this.titleEl.textContent = "Demo complete";
      this.feedbackEl.textContent =
        "All demo decisions saved. Press R to reset.";

      this.setDoorsEnabled(false);

      this.leftDoorEl.setAttribute(
        "material",
        "color",
        SLOT_STYLES.left.doorColor,
      );
      this.rightDoorEl.setAttribute(
        "material",
        "color",
        SLOT_STYLES.right.doorColor,
      );

      this.leftLabelEl.setAttribute("value", "Complete");
      this.rightLabelEl.setAttribute("value", "Complete");

      this.leftLabelEl.setAttribute("color", SLOT_STYLES.left.textColor);
      this.rightLabelEl.setAttribute("color", SLOT_STYLES.right.textColor);

      this.updateLabelLayout("left", "Complete");
      this.updateLabelLayout("right", "Complete");

      this.teleportToEnd();
      console.log("teleported to end");
      return;
    }

    // Only apply recurring cost if not coming directly from housing decision
    const previousPair = DECISION_PAIRS[this.state.pairIndex - 1];
    const justCompletedHousing = previousPair && previousPair.id === "housing";

    if (!justCompletedHousing) {
      this.applyRecurringHousingCost();
    }

    this.setDoorsEnabled(true);
    this.titleEl.textContent = pair.title;
    this.setSlotContent("left", pair.left);
    this.setSlotContent("right", pair.right);
    this.applyTheme();
  },

  // Update left or right slot with current choice data (makes doors reusable)
  setSlotContent: function (slot, choice) {
    const isLeft = slot === "left";
    const doorEl = isLeft ? this.leftDoorEl : this.rightDoorEl;
    const labelEl = isLeft ? this.leftLabelEl : this.rightLabelEl;
    const style = SLOT_STYLES[slot];

    let doorColor = style.doorColor;
    let textColor = style.textColor;

    if (this.contrastMode) {
      doorColor = isLeft ? "#0000ff" : "#ffd700";
      textColor = "#000000";
    }

    doorEl.setAttribute("material", "color", doorColor);
    doorEl.setAttribute("material", "opacity", 1);

    labelEl.setAttribute("value", choice.label);
    labelEl.setAttribute("color", textColor);

    this.updateLabelLayout(slot, choice.label);
  },

  // Resizes white label background to fit text within it
  updateLabelLayout: function (slot, labelText) {
    const bgEl = slot === "left" ? this.leftLabelBgEl : this.rightLabelBgEl;
    const labelEl = slot === "left" ? this.leftLabelEl : this.rightLabelEl;

    if (!bgEl || !labelEl) return;

    const text = (labelText || "").trim();
    const charsPerLine = 16;
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    const longestLineChars = Math.min(text.length || 1, charsPerLine);

    const minBgWidth = 2.4;
    const maxBgWidth = 4.8;
    const horizontalPadding = 0.7;

    const bgWidth = Math.min(
      maxBgWidth,
      Math.max(minBgWidth, longestLineChars * 0.16 + horizontalPadding),
    );

    const baseHeight = 0.7;
    const extraLineHeight = 0.28;
    const bgHeight = baseHeight + (lines - 1) * extraLineHeight;

    bgEl.setAttribute("width", bgWidth);
    bgEl.setAttribute("height", bgHeight);

    labelEl.setAttribute("wrap-count", charsPerLine);
    labelEl.setAttribute("width", bgWidth * 0.9);
  },

  /*
    Enables or disables both doors and both walk triggers
    */
  setDoorsEnabled: function (enabled) {
    if (enabled) {
      this.leftDoorEl.classList.add("clickable");
      this.rightDoorEl.classList.add("clickable");
    } else {
      this.leftDoorEl.classList.remove("clickable");
      this.rightDoorEl.classList.remove("clickable");
    }

    this.leftTriggerEl.setAttribute("decision-trigger", "enabled", enabled);
    this.rightTriggerEl.setAttribute("decision-trigger", "enabled", enabled);

    this.leftDoorEl.setAttribute("material", "opacity", enabled ? 1 : 0.55);
    this.rightDoorEl.setAttribute("material", "opacity", enabled ? 1 : 0.55);
  },

  /*
    Main decision handler
  
    This runs when the player either:
      - clicks/gazes at a door
      - walks into a door trigger
  
    Flow:
      1. start door (first time)      -> straight to the fork
      2. inbetween door (after fork)  -> back to the fork for the next decision
      3. fork door (left / right)     -> apply effects, then into the inbetween room
    */
  makeChoice: function (slot, source) {
    console.log("interactive", this.isInteractive());
    console.log("THE SLOT IS", slot);
    console.log(this.state.pairIndex, DECISION_PAIRS.length);
    // Always allow inbetween exit door
    if (slot === "inbetween") {
      this.exitInbetweenRoom();
      return;
    }

    // Start door always allowed
    if (slot === "start") {
      if (this.hasStarted) return;
      this.hasStarted = true;
      this.setStartDoorEnabled(false);
      this.teleportToFork();
      this.loadCurrentPair();

      const pair = DECISION_PAIRS[this.state.pairIndex];
      if (pair) {
        this.refreshHud(pair.prompt);

        if (this.audioEnabled) {
          this.playAudio(this.buildAudioText(pair));
        }
      }
      return;
    }

    if (!this.isInteractive()) return;

    // Normal fork decision (left / right)
    const pair = DECISION_PAIRS[this.state.pairIndex];
    const choice = pair[slot];
    if (!choice) return;

    this.locked = true;

    // Disable fork doors immediately so the teleport to the inbetween room
    // doesn't accidentally re-trigger the walk-through on the way out.
    this.setDoorsEnabled(false);

    this.applyEffects(choice.effects);

    this.state.age += 7;
    window.simulateYears(7);

    if (this.state.age > 60) {
      this.state.age = 60;
    }

    // Store housing cost when rent/buy is chosen (read from decision data)
    if (choice.baseCost !== undefined) {
      this.state.baseHousingCost = choice.baseCost;
      console.log(`Housing cost stored: £${this.state.baseHousingCost}`);
    }

    // Track sharing preference
    if (choice.id === "share_accom") {
      this.state.isSharing = true;
    }

    // Synergy checks - capture their messages so we can show them to the user
    let synergyMessage = null;

    if (choice.id === "buy_car") {
      synergyMessage = this.applyCarSynergy();
    }

    if (choice.id === "new_job") {
      synergyMessage = this.applyCareerAdvancement();
    }

    this.state.history.push({
      pairId: pair.id,
      choiceId: choice.id,
      slot: slot,
      source: source,
      label: choice.label,
    });

    if (
      window.financeHooks &&
      typeof window.financeHooks.resolveChoice === "function"
    ) {
      const hookResult = window.financeHooks.resolveChoice(
        this.getStateSnapshot(),
        pair,
        choice,
      );

      if (hookResult && hookResult.effects) {
        this.applyEffects(hookResult.effects);
      }
    }

    // Advance the pair index now so stats (e.g. housing cost on the next
    // loadCurrentPair) are correct. The next pair's UI gets populated when
    // the player exits the inbetween room.
    this.state.pairIndex += 1;

    const nextPair = DECISION_PAIRS[this.state.pairIndex];
    const baseMessage = nextPair
      ? `${choice.feedback} ${nextPair.prompt}`
      : `${choice.feedback} Demo complete. Press R to reset.`;

    const finalMessage = synergyMessage
      ? `${baseMessage}\n\n${synergyMessage}`
      : baseMessage;

    // Stash the message so it's shown once the player exits the inbetween room.
    this.pendingFeedbackMessage = finalMessage;

    // Send them to the inbetween room, and update the HUD while they're there.
    this.resetInbetweenRoom();
    this.teleportToInbetweenRoom();
    let totalAssets =
      player.assets.savings +
      player.assets.cashISA +
      player.assets.lisa +
      player.assets.bonds;

    let totalDebt = player.debt.studentLoan + player.debt.mortgage;

    this.refreshHud(
      `7 years passed.

      Salary now £${Math.round(player.salary)}/month

      Debt £${Math.round(totalDebt)}

      Cash £${Math.round(player.savings)}

      Assets £${Math.round(totalAssets)}

      Complete the finance activity and submit to unlock the exit door.`,
    );

    this.pendingAudioMessage = synergyMessage
      ? `${choice.feedback} ${synergyMessage}`
      : choice.feedback;

    if (this.audioEnabled) {
      this.playAudio(this.getCurrentAudioMessage());
    }

    window.setTimeout(() => {
      this.locked = false;
    }, 200);
  },

  /*
    Called when the player walks through / gazes through the inbetween door.
    Re-enables the fork, teleports them back, loads the next pair's doors,
    and finally shows the feedback from the decision that brought them in.
    */
  exitInbetweenRoom: function () {
    this.locked = true;

    this.teleportToFork();
    this.loadCurrentPair();

    const message = this.pendingFeedbackMessage || "Choose your next decision.";
    this.pendingFeedbackMessage = null;
    this.pendingAudioMessage = "";

    // If the housing cost was applied during loadCurrentPair, prepend it.
    let displayMessage = message;
    if (this.lastHousingMessage) {
      displayMessage = `${this.lastHousingMessage}\n\n${message}`;
      this.lastHousingMessage = null;
    }

    this.refreshHud(displayMessage);

    const nextPair = DECISION_PAIRS[this.state.pairIndex];

    if (this.audioEnabled) {
      this.playAudio(this.buildAudioText(nextPair));
    }

    window.setTimeout(() => {
      this.locked = false;
    }, 200);
  },

  applyEffects: function (effects) {
    if (!effects) return;

    this.state.income += Number(effects.income || 0);
    this.state.debt += Number(effects.debt || 0);
    this.state.cash += Number(effects.cash || 0);

    //UPDATING CHART DATA
    if (this.myChart) {
      this.xValues.push(this.state.cash);
      this.yValues.push(Math.floor(Math.random() * 10) + 5);

      if (this.xValues.length > 15) {
        this.xValues.shift();
        this.yValues.shift();
      }
      this.myChart.update();
    }
  },

  applyRecurringHousingCost: function () {
    // Only apply if we have a housing cost
    if (this.state.baseHousingCost === 0) return;

    // Don't apply cost on the housing decision itself
    const currentPair = DECISION_PAIRS[this.state.pairIndex];
    if (!currentPair || currentPair.id === "housing") return;

    // Calculate the actual cost
    let actualCost = this.state.baseHousingCost;
    if (this.state.isSharing) {
      actualCost = actualCost * this.state.sharingDiscount;
    }

    this.state.cash -= actualCost;

    this.lastHousingMessage = `Housing cost: -£${Math.round(actualCost)}`;

    console.log(
      `Applied housing cost: £${actualCost}, Cash now: £${this.state.cash}`,
    );
  },

  applyCarSynergy: function () {
    // Check if player has the job
    const hasJob = this.state.history.some((entry) => entry.choiceId === "job");

    if (hasJob) {
      // Car lets the player commute to a better-paying role: +£500/month on top of the base job income.
      const incomeIncrease = 500;
      this.state.income += incomeIncrease;

      return `Your car allows you to commute to a better job. Income increased by £${incomeIncrease}/month.`;
    }

    return null;
  },

  applyCareerAdvancement: function () {
    // Check player's history
    const hasUniversity = this.state.history.some(
      (entry) => entry.choiceId === "university",
    );
    const hasCar = this.state.history.some(
      (entry) => entry.choiceId === "buy_car",
    );

    let incomeIncrease = 0;
    let message = "";

    // Calculate income increase based on synergies
    if (hasUniversity && hasCar) {
      // Both: Major boost
      incomeIncrease = 1200;
      message =
        "Your degree and car allow you to land a high-paying role. Income increased by £1200/month.";
    } else if (hasUniversity || hasCar) {
      // Either: Moderate boost
      incomeIncrease = 600;
      const factor = hasUniversity ? "degree" : "car";
      message = `Your ${factor} helped you get a better position. Income increased by £600/month.`;
    } else {
      // Neither: No boost
      incomeIncrease = 0;
      message =
        "Without a degree or reliable transport, your job prospects remain static. No income increase.";
    }

    if (incomeIncrease > 0) {
      this.state.income += incomeIncrease;
    }

    console.log(
      `Career advancement: Uni=${hasUniversity}, Car=${hasCar}, Increase=£${incomeIncrease}`,
    );

    return message;
  },

  refreshHud: function (message) {
    this.updateSigns();
    this.feedbackEl.textContent = message;
    this.incomeEl.textContent = `Income: £${this.formatMoney(this.state.income)}`;
    this.debtEl.textContent = `Debt: £${this.formatMoney(this.state.debt)}`;
    this.cashEl.textContent = `Cash: £${this.formatMoney(this.state.cash)}`;
    this.ageEl.textContent = `Age: ${this.state.age}`;

    console.log(`HUD Updated - Cash: £${this.state.cash}`);
  },

  updateSigns: function () {
    const pair = DECISION_PAIRS[this.state.pairIndex];
    if (!pair) {
      return;
    }
    const pairid1 = pair.left.id;
    const pairid2 = pair.right.id;

    const leftText = document.querySelector("#fact-left");
    const rightText = document.querySelector("#fact-right");

    const getDescription = (choice) => {
      return (
        `${choice.label}\n\n` +
        `Impact: Cash: £${choice.effects.cash} | Debt: £${choice.effects.debt}\n`
      );
    };

    const eduText_left = EDUCATIONAL_TEXTS[pairid1];
    const eduText_right = EDUCATIONAL_TEXTS[pairid2];
    leftText.setAttribute("value", getDescription(pair.left) + eduText_left);
    rightText.setAttribute("value", getDescription(pair.right) + eduText_right);
  },

  // Teleports the player to the forked-road start (used between decisions).
  teleportToFork: function () {
    this.currentRoom = "fork";

    this.rigEl.setAttribute(
      "position",
      `${this.forkPosition.x} ${this.forkPosition.y} ${this.forkPosition.z}`,
    );

    this.cameraEl.setAttribute(
      "position",
      `${this.startCameraPosition.x} ${this.startCameraPosition.y} ${this.startCameraPosition.z}`,
    );
  },

  // Teleports the player to the start room (used on reset).
  teleportToStartRoom: function () {
    this.currentRoom = "start";

    this.rigEl.setAttribute(
      "position",
      `${this.startRoomPosition.x} ${this.startRoomPosition.y} ${this.startRoomPosition.z}`,
    );

    this.cameraEl.setAttribute(
      "position",
      `${this.startCameraPosition.x} ${this.startCameraPosition.y} ${this.startCameraPosition.z}`,
    );
  },

  // Teleports the player to the inbetween room (used after every fork decision).
  teleportToInbetweenRoom: function () {
    this.currentRoom = "inbetween";

    this.rigEl.setAttribute(
      "position",
      `${this.inbetweenRoomPosition.x} ${this.inbetweenRoomPosition.y} ${this.inbetweenRoomPosition.z}`,
    );

    this.cameraEl.setAttribute(
      "position",
      `${this.startCameraPosition.x} ${this.startCameraPosition.y} ${this.startCameraPosition.z}`,
    );

    if (window.openDecision) {
      window.openDecision();
    }
  },

  teleportToEnd: function () {
    this.currentRoom = "end";

    this.rigEl.setAttribute(
      "position",
      `${this.endRoomPosition.x} ${this.endRoomPosition.y} ${this.endRoomPosition.z}`,
    );

    this.cameraEl.setAttribute(
      "position",
      `${this.startCameraPosition.x} ${this.startCameraPosition.y} ${this.startCameraPosition.z}`,
    );
    var endroom = document.querySelector("#endroom");
    endroom.setAttribute("visible", "true");
    var display = document.querySelector("#final-summary");
    var s = document.querySelector("#more-summary");
    let assets =
      player.assets.savings +
      player.assets.cashISA +
      player.assets.lisa +
      player.assets.bonds;

    let wealth = player.savings + assets - this.state.debt;

    let totalDebt = player.debt.studentLoan + player.debt.mortgage;

    let totalAssets =
      player.assets.savings +
      player.assets.cashISA +
      player.assets.lisa +
      player.assets.bonds;

    let netWealth = player.savings + totalAssets - totalDebt;

    let ending = "";

    if (netWealth < 0) {
      ending = "Debt Trapped";
    } else if (netWealth < 30000) {
      ending = "Financial Survivor";
    } else if (netWealth < 100000) {
      ending = "Comfortable Retirement";
    } else {
      ending = "Wealth Builder";
    }

    display.setAttribute(
      "value",

      `Age: ${this.state.age}

    Salary: £${Math.round(player.salary)}/month

    Debt: £${Math.round(totalDebt)}

    Cash: £${Math.round(player.savings)}

    Assets: £${Math.round(totalAssets)}

    Net Wealth: £${Math.round(netWealth)}

    Outcome: ${ending}`,
    );
    var labels = this.state.history.map((item) => item.label).join(", ");
    s.setAttribute("value", `Your choices were: ${labels}`);
  },

  // Enables or disables the start-room exit door.
  setStartDoorEnabled: function (enabled) {
    this.startTriggerEl.setAttribute("decision-trigger", "enabled", enabled);

    if (enabled) {
      this.startDoorEl.classList.add("clickable");
      this.startDoorEl.setAttribute("material", "opacity", 1);
    } else {
      this.startDoorEl.classList.remove("clickable");
      this.startDoorEl.setAttribute("material", "opacity", 0.4);
    }
  },

  /*
    Unlocks the inbetween-room exit door.
    Called by the wall-mounted unlock-button when the player gazes at it.
    */
  unlockRoomDoor: function (room) {
    if (room !== "inbetween" || this.inbetweenUnlocked) return;
    this.inbetweenUnlocked = true;

    // Door: grey/locked -> green/exit
    this.inbetweenDoorEl.classList.add("clickable");
    this.inbetweenTriggerEl.setAttribute("decision-trigger", "enabled", true);
    this.inbetweenDoorEl.setAttribute("material", "color", "#27AE60");
    this.inbetweenDoorEl.setAttribute("material", "opacity", 1);
    this.inbetweenDoorLabelEl.setAttribute("value", "Exit");
    this.inbetweenDoorLabelEl.setAttribute("color", "#27AE60");

    // Button: used / non-interactive
    this.unlockButtonEl.classList.remove("clickable");
    this.unlockButtonEl.setAttribute("material", "color", "#27AE60");
    this.unlockButtonEl.setAttribute("material", "emissive", "#1E8449");
    this.unlockButtonLabelEl.setAttribute("value", "Unlocked");

    console.log("Inbetween room door unlocked.");
    this.refreshHud("Door unlocked. Walk through the door to continue.");

    if (this.audioEnabled) {
      this.playAudio("Door unlocked. Walk through the door to continue.");
    }
  },

  /*
    Re-locks the inbetween-room door and resets the button.
    Called when the player is teleported INTO the inbetween room so each
    visit starts with the door locked.
    */
  resetInbetweenRoom: function () {
    this.inbetweenUnlocked = false;

    // Lock exit door
    this.inbetweenDoorEl.classList.remove("clickable");
    this.inbetweenTriggerEl.setAttribute("decision-trigger", "enabled", false);
    this.inbetweenDoorEl.setAttribute("material", "color", "#888888");
    this.inbetweenDoorEl.setAttribute("material", "opacity", 0.4);
    this.inbetweenDoorLabelEl.setAttribute("value", "Locked");
    this.inbetweenDoorLabelEl.setAttribute("color", "#888888");

    // Reset submit button
    this.submitFinanceEl = document.querySelector("#submitFinance");

    if (this.submitFinanceEl) {
      this.submitFinanceEl.classList.add("clickable");
      this.submitFinanceEl.setAttribute("material", "color", "#27AE60");
      this.submitFinanceEl.setAttribute("visible", true);
    }
  },

  //Submit finance
  onSubmitFinance: function () {
    applyFinanceChoices();
    this.unlockRoomDoor("inbetween");

    const uiElements = [
      "#speechBubble",
      "#sliderSection",
      "#saveBubble",
      "#investBubble",
      "#debtBubble",
    ];

    uiElements.forEach((id) => {
      const el = document.querySelector(id);
      if (el) el.setAttribute("visible", false);
    });

    if (this.submitFinanceEl) {
      this.submitFinanceEl.classList.remove("clickable");
      this.submitFinanceEl.setAttribute("material", "color", "#888888");
    }
  },

  // Full demo reset function
  resetDemo: function () {
    this.locked = false;
    this.pendingFeedbackMessage = null;
    this.pendingAudioMessage = "";
    this.currentRoom = "start";

    this.darkMode = false;
    this.contrastMode = false;
    this.audioEnabled = false;
    this.voiceEnabled = false;
    this.hasStarted = false;
    this.textSize = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.lastTranscript = "";

    this.stopVoiceRecognition();
    speechSynthesis.cancel();

    this.state = this.createInitialState();
    this.setStartDoorEnabled(true);
    this.resetInbetweenRoom();
    this.teleportToStartRoom();
    this.setGazeEnabled(false);
    this.applyTheme();
    this.updateTextSize();
    this.updateHelpText();
    this.loadCurrentPair();
    this.refreshHud("Walk through the green door to begin.");
    this.updateIndicator();
  },

  formatMoney: function (value) {
    return Math.round(value).toLocaleString("en-GB");
  },

  getStateSnapshot: function () {
    return JSON.parse(JSON.stringify(this.state));
  },
});

/* Fullscreen-safe HUD
     -------------------
     A-Frame's fullscreen button calls requestFullscreen() on its <canvas>
     element. The browser's fullscreen rules then hide everything except
     the canvas - and <canvas> can't have visible DOM children, so our HUD
     disappears.
  
     Fix: intercept requestFullscreen on the canvas. When A-Frame calls it,
     we transparently redirect the call to #scene-container (which wraps
     both the canvas and the HUD). A-Frame doesn't know the difference,
     and both elements stay visible in fullscreen. */
(function () {
  function install() {
    const container = document.querySelector("#scene-container");
    const scene = document.querySelector("a-scene");
    const canvas = scene && scene.canvas;

    if (!container || !canvas) {
      // Scene / canvas not ready yet - try again shortly.
      return false;
    }

    // Redirect each fullscreen method variant on the canvas to the container.
    const methods = [
      "requestFullscreen",
      "webkitRequestFullscreen",
      "mozRequestFullScreen",
      "msRequestFullscreen",
    ];

    methods.forEach(function (name) {
      if (typeof canvas[name] === "function") {
        canvas[name] = function () {
          const target =
            container[name] ||
            container.requestFullscreen ||
            container.webkitRequestFullscreen ||
            container.mozRequestFullScreen ||
            container.msRequestFullscreen;
          return target ? target.apply(container, arguments) : undefined;
        };
      }
    });

    return true;
  }

  // A-Frame sets up its canvas after the scene loads, so we wait for it.
  const scene = document.querySelector("a-scene");
  if (scene) {
    if (scene.hasLoaded) {
      install();
    } else {
      scene.addEventListener("loaded", install, { once: true });
    }
  }
})();

AFRAME.registerComponent("visibility-toggle", {
  schema: {
    target: { type: "selector" },
    maxDistance: { type: "number", default: 0.5 },
  },

  init: function () {
    const el = this.el;
    const camera = document.querySelector("#player-camera");
    //var target = document.querySelector(`#${this.data.target}`) this will work too

    el.addEventListener("mouseenter", () => {
      const dist = el.object3D.position.distanceTo(camera.object3D.position);

      if (dist < this.data.maxDistance) {
        const isVisible = this.data.target.getAttribute("visible");
        this.data.target.setAttribute("visible", !isVisible);
      }
    });
  },
});

AFRAME.registerComponent("chart-texture", {
  init: function () {
    this.el.setAttribute("material", {
      src: "#myChart",
      transparent: true,
      shader: "flat",
    });
  },
});

AFRAME.registerComponent("close-on-move", {
  schema: {
    threshold: { type: "number", default: 0.1 },
    delay: { type: "number", default: 500 },
  },
  init: function () {
    this.startPos = new THREE.Vector3();
    this.currentPos = new THREE.Vector3();
    this.canClose = false;
    this.isVisible = false;
  },
  tick: function (time, timeDelta) {
    const isVisibleNow = this.el.getAttribute("visible");

    if (isVisibleNow && !this.isVisible) {
      this.isVisible = true;
      this.canClose = false;

      const cameraEl = this.el.sceneEl.camera.el;
      cameraEl.object3D.getWorldPosition(this.startPos);

      setTimeout(() => {
        this.canClose = true;
      }, this.data.delay);
    }

    if (!isVisibleNow) {
      this.isVisible = false;
      return;
    }

    if (this.canClose) {
      const cameraEl = this.el.sceneEl.camera.el;
      cameraEl.object3D.getWorldPosition(this.currentPos);

      if (this.currentPos.distanceTo(this.startPos) > this.data.threshold) {
        this.el.setAttribute("visible", "false");
      }
    }
  },
});
