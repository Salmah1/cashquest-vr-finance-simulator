(function () {
  function getDemo() {
    const scene = document.querySelector("a-scene");
    return scene && scene.components ? scene.components["finance-demo"] : null;
  }

  window.financeAccessibility = {
    /* 
    Handles all keyboard shortcuts:
        - G toggles gaze interaction
        - O toggles audio
        - V toggles voice commands
        - M toggles dark mode
        - H toggles contrast 
        - T toggles text size
        - R resets the demo
    */
    onKeyDown: function (event) {
      const key = event.key.toLowerCase();

      if (key === "g") {
        this.setGazeEnabled(!this.gazeEnabled);
      }

      if (key === "t") {
        this.textSize = !this.textSize;
        this.updateTextSize();
        this.updateHelpText();
      }

      if (key === "o") {
        this.audioEnabled = !this.audioEnabled;

        // Stop speech when audio is turned off
        if (!this.audioEnabled) {
          speechSynthesis.cancel();
          this.isSpeaking = false;
          this.updateIndicator();
        } else {
          this.playAudio(this.getCurrentAudioMessage());
        }

        this.updateHelpText();
        this.updateIndicator();
      }

      if (key === "v") {
        this.voiceEnabled = !this.voiceEnabled;

        if (this.voiceEnabled) {
          this.startVoiceRecognition();
        } else {
          this.stopVoiceRecognition();
        }

        this.updateHelpText();
        this.updateIndicator();
      }

      if (key === "m") {
        this.darkMode = !this.darkMode;
        this.applyTheme();
        this.updateHelpText();
      }

      if (key === "h") {
        this.contrastMode = !this.contrastMode;
        this.applyTheme();
        this.updateHelpText();
      }

      if (key === "r") {
        this.resetDemo();
      }
    },

    /* 
    Updates the help text displayed in the HTML HUD. 
    Reflects current accessibility states.
     */
    updateHelpText: function () {
      this.helpEl.textContent =
        `Gaze: ${this.gazeEnabled ? "ON" : "OFF"} | Text: ${this.textSize ? "LARGE" : "SMALL"} | Audio: ${this.audioEnabled ? "ON" : "OFF"}\n` +
        `Voice: ${this.voiceEnabled ? "ON" : "OFF"} | Dark: ${this.darkMode ? "ON" : "OFF"} | Contrast: ${this.contrastMode ? "HIGH" : "NORMAL"} \n` +
        `Reset`;
    },

    /* 
    Enables or disables gaze interaction. 
    Controls cursor visibility and raycasting 
    */
    setGazeEnabled: function (enabled) {
      this.gazeEnabled = enabled;
      this.cursorEl.setAttribute("visible", enabled);
      this.cursorEl.setAttribute("raycaster", "enabled", enabled);
      this.updateHelpText();
    },

    /* 
    Toggles text size across:
        - HTML HUD elements 
        - A-Frame 3D text elements
    Improves readability for accessibility 
    */
    updateTextSize: function () {
      const large = this.textSize;

      // HTML HUD text sizes
      if (this.titleEl) {
        this.titleEl.style.fontSize = large ? "24px" : "18px";
        this.titleEl.style.lineHeight = large ? "1.35" : "1.3";
      }
      if (this.feedbackEl) {
        this.feedbackEl.style.fontSize = large ? "18px" : "14px";
        this.feedbackEl.style.lineHeight = large ? "1.5" : "1.4";
      }

      if (this.incomeEl) this.incomeEl.style.fontSize = large ? "18px" : "14px";
      if (this.debtEl) this.debtEl.style.fontSize = large ? "18px" : "14px";
      if (this.cashEl) this.cashEl.style.fontSize = large ? "18px" : "14px";
      if (this.ageEl) this.ageEl.style.fontSize = large ? "18px" : "14px";

      if (this.helpEl) {
        this.helpEl.style.fontSize = large ? "15px" : "12px";
        this.helpEl.style.lineHeight = large ? "1.5" : "1.4";
      }

      if (this.controlHeaderEl) {
        this.controlHeaderEl.style.fontSize = large ? "16px" : "12px";
      }
      if (this.audioStatusEl) {
        this.audioStatusEl.style.fontSize = large ? "14px" : "11px";
      }
      if (this.audioTranscriptEl) {
        this.audioTranscriptEl.style.fontSize = large ? "14px" : "11px";
      }

      // A-Frame door labels still need 3D scaling
      const labelScale = large ? 1.2 : 1;

      if (this.leftLabelEl && this.leftLabelEl.object3D) {
        this.leftLabelEl.object3D.scale.set(labelScale, labelScale, labelScale);
      }
      if (this.rightLabelEl && this.rightLabelEl.object3D) {
        this.rightLabelEl.object3D.scale.set(
          labelScale,
          labelScale,
          labelScale,
        );
      }
      const financeTextIds = [
        "#uiText",
        "#line1",
        "#line2",
        "#line3",
        "#line4",
        "#line5",
        "#line6",
        "#totalMoneyText",
        "#saveValue",
        "#investValue",
        "#dtotalDebtValue",
        "#studentDebtValue",
        "#mortgageDebtValue",
        "#debtPayText",
        "#saveTotalText",
        "#savingsPercent",
        "#savingsMoney",
        "#cashISAPercent",
        "#cashISAMoney",
        "#lisaPercent",
        "#lisaMoney",
        "#bondsPercent",
        "#bondsMoney",
        "#unlock-button-label",
        "#inbetween-door-label",
      ];

      financeTextIds.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el && el.object3D) {
          const s = large ? 1.15 : 1;
          el.object3D.scale.set(s, s, s);
        }
      });
    },

    /* 
    Plays spoken audio using Web Speech API.
    Stops any currently playing speech before starting new. 
    */
    playAudio: function (text) {
      // Stop if browser speech is unsupported or audio mode is off
      if (!window.speechSynthesis || !this.audioEnabled || !text) return;

      speechSynthesis.cancel();
      this.isSpeaking = false;
      this.updateIndicator();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.updateIndicator();
      };
      utterance.onend = () => {
        this.isSpeaking = false;
        this.updateIndicator();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.updateIndicator();
      };

      speechSynthesis.speak(utterance);
    },

    /* 
    Builds dynamic narration text based on:
        - Current decision
        - Player stats
    Used for audio feedback. 
    */
    buildAudioText(pair) {
      const prefix = this.pendingAudioMessage
        ? this.pendingAudioMessage + ". "
        : "";

      if (!pair) {
        return (
          prefix +
          `Final stats are: income ${this.formatMoney(this.state.income)} pounds, debt ${this.formatMoney(this.state.debt)} pounds,  cash ${this.formatMoney(this.state.cash)}, age ${this.state.age}. Demo complete.`
        );
      }

      return (
        prefix +
        `${pair.title}. ${pair.prompt}. Your current stats are: income ${this.formatMoney(this.state.income)} pounds, debt ${this.formatMoney(this.state.debt)} pounds, cash ${this.formatMoney(this.state.cash)} pounds, age ${this.state.age}. Your choices are: left, ${pair.left.label}; or right, ${pair.right.label}.`
      );
    },

    /* 
    Determines what audio message should play depending on:
        - State state
        - Inbetween room
        - End state
    */
    getCurrentAudioMessage: function () {
      const pair = DECISION_PAIRS[this.state.pairIndex];

      if (!this.hasStarted) {
        return "Welcome to the VR Finance Demo. Each choice affects your income, debt, and cash. Your goal is to build a healthy financial position across six key life decisions. Walk through the green door to begin.";
      }
      if (this.currentRoom === "inbetween") {
        if (this.inbetweenUnlocked) {
          return "The exit door is unlocked. Say exit or walk through the exit door.";
        }
        if (
          this.submitFinanceEl &&
          this.submitFinanceEl.getAttribute("visible") !== "false"
        ) {
          return "Complete the finance activity and submit to unlock the exit door.";
        }
        return "Complete the finance activity to continue.";
      }

      if (this.currentRoom === "end") {
        return `Final stats are: income ${this.formatMoney(this.state.income)} pounds, debt ${this.formatMoney(this.state.debt)} pounds, cash ${this.formatMoney(this.state.cash)} pounds, age ${this.state.age}. Demo complete.`;
      }

      return this.buildAudioText(pair);
    },

    /* 
    Starts continuous voice recognition.
    Listens for commands like:
        - "left" 
        - "right" 
    */
    startVoiceRecognition: function () {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported");
        return;
      }

      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }

      this.lastTranscript = "";
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "en-GB";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateIndicator();
      };

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.trim().toLowerCase();

        this.lastTranscript = transcript;
        this.updateIndicator();

        if (!result.isFinal) return;

        // Start commands
        if (transcript.includes("start") || transcript.includes("begin")) {
          if (!this.hasStarted) {
            this.makeChoice("start", "voice");
          }

          // Door choices commands
        } else if (transcript.includes("left")) {
          if (this.currentRoom === "fork") {
            this.makeChoice("left", "voice");
          }
        } else if (transcript.includes("right")) {
          if (this.currentRoom === "fork") {
            this.makeChoice("right", "voice");
          }
        }
        // Finance room controls commands
        else if (transcript.includes("next")) {
          if (this.currentRoom === "inbetween") {
            const nextBtn = document.querySelector("#nextButton");
            if (nextBtn && nextBtn.getAttribute("visible") !== "false") {
              nextBtn.emit("click");
            } else {
              this.refreshHud(
                "Now click or gaze at submit to unlock the exit door.",
              );
              if (this.audioEnabled) {
                this.playAudio(
                  "Now click or gaze at submit to unlock the exit door.",
                );
              }
            }
          }
        } else if (transcript.includes("submit")) {
          if (this.currentRoom === "inbetween" && !this.inbetweenUnlocked) {
            this.onSubmitFinance();

            this.refreshHud("Door unlocked. Say exit to continue.");
            if (this.audioEnabled) {
              this.playAudio("Door unlocked. Say exit to continue.");
            }
          }
        } else if (
          transcript.includes("exit") ||
          transcript.includes("continue")
        ) {
          if (this.currentRoom === "inbetween") {
            if (this.inbetweenUnlocked) {
              this.makeChoice("inbetween", "voice");
            } else {
              this.refreshHud(
                "Click or gaze at submit to unlock the exit door.",
              );
              if (this.audioEnabled) {
                this.playAudio(
                  "Click or gaze at submit to unlock the exit door.",
                );
              }
            }
          }
        }

        // Accessibility feature commands
        else if (transcript.includes("gaze on")) {
          this.setGazeEnabled(true);
        } else if (transcript.includes("gaze off")) {
          this.setGazeEnabled(false);
        } else if (
          transcript.includes("text on") ||
          transcript.includes("text large")
        ) {
          this.textSize = true;
          this.updateTextSize();
          this.updateHelpText();
        } else if (
          transcript.includes("text off") ||
          transcript.includes("text small")
        ) {
          this.textSize = false;
          this.updateTextSize();
          this.updateHelpText();
        } else if (transcript.includes("audio on")) {
          this.audioEnabled = true;
          this.updateHelpText();
          this.playAudio(this.getCurrentAudioMessage());
        } else if (transcript.includes("audio off")) {
          this.audioEnabled = false;
          speechSynthesis.cancel();
          this.isSpeaking = false;
          this.updateHelpText();
          this.updateIndicator();
        } else if (transcript.includes("dark on")) {
          this.darkMode = true;
          this.applyTheme();
          this.updateHelpText();
        } else if (transcript.includes("dark off")) {
          this.darkMode = false;
          this.applyTheme();
          this.updateHelpText();
        } else if (
          transcript.includes("contrast on") ||
          transcript.includes("contrast high")
        ) {
          this.contrastMode = true;
          this.applyTheme();
          this.updateHelpText();
        } else if (
          transcript.includes("contrast off") ||
          transcript.includes("contrast normal")
        ) {
          this.contrastMode = false;
          this.applyTheme();
          this.updateHelpText();
        } else if (transcript.includes("voice off")) {
          this.voiceEnabled = false;
          this.stopVoiceRecognition();
          this.updateHelpText();
        } else if (transcript.includes("reset")) {
          this.resetDemo();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateIndicator();

        if (this.voiceEnabled) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
        this.updateIndicator();
      };
      this.recognition.start();
    },

    /* 
    Stops voice recognition.
    Clears listeners and resets state.
    */
    stopVoiceRecognition: function () {
      this.isListening = false;
      this.lastTranscript = "";

      if (this.recognition) {
        this.recognition.onend = null;
        this.recognition.stop();
        this.recognition = null;
      }
      this.updateIndicator();
    },

    /* 
    Updates visual indicator showing:
        - Listening - voice active
        - Speaking - audio playing 
    */
    updateIndicator: function () {
      if (
        !this.audioIndicatorEl ||
        !this.audioStatusEl ||
        !this.audioTranscriptEl
      ) {
        return;
      }

      this.audioStatusEl.className = "";
      this.audioTranscriptEl.className = "";

      if (this.isListening) {
        this.audioStatusEl.textContent = this.lastTranscript
          ? `Listening: "${this.lastTranscript}"`
          : "Listening...";
        this.audioStatusEl.classList.add("listening");
      } else {
        this.audioStatusEl.textContent = "";
      }
      if (this.isSpeaking) {
        this.audioTranscriptEl.textContent = "Speaking...";
        this.audioTranscriptEl.classList.add("speaking");
      }

      if (this.isSpeaking) {
        this.audioTranscriptEl.textContent = "Speaking...";
        this.audioTranscriptEl.classList.add("speaking");
      } else {
        this.audioTranscriptEl.textContent = "";
      }

      const showIndicator = this.isListening || this.isSpeaking;
      this.audioIndicatorEl.classList.toggle("active", showIndicator);
    },

    /* 
    Applies visual themes:
        - Default
        - Dark mode
        - Contrast mode
        - Dark + contrast mode

    Affects:
        - A-Frame environment
        - Sky
        - Lighting
        - HUD
        - Door styles
  */
    applyTheme: function () {
      const light = document.querySelector("a-light");

      if (!this.hudEl) return;

      // Dark + high contrast
      if (this.darkMode && this.contrastMode) {
        this.envGroundEl.setAttribute(
          "environment",
          "preset: forest; fog: 0; skyType: none; ground: noise; groundFrequency: 5; groundColor: #000000; groundColor2: #000000; groundTexture: walkernoise; playArea: 14;",
        );

        this.darkSkyEl.setAttribute("visible", true);
        this.contrastSkyEl.setAttribute("visible", false);

        this.hudEl.style.background = "rgba(0, 0, 0, 0.95)";
        this.hudEl.style.color = "#fff";

        this.titleEl.style.color = "#fff";
        this.feedbackEl.style.color = "#fff";
        this.incomeEl.style.color = "#fff";
        this.debtEl.style.color = "#fff";
        this.cashEl.style.color = "#fff";
        this.ageEl.style.color = "#fff";
        this.helpEl.style.color = "#fff";
        this.controlHeaderEl.style.color = "#fff";

        this.leftLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 1; shader: flat",
        );

        this.rightLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 1; shader: flat",
        );

        this.leftLabelEl.setAttribute("color", "#000000");
        this.rightLabelEl.setAttribute("color", "#000000");

        this.leftDoorEl.setAttribute("material", "color", "#0000ff");
        this.rightDoorEl.setAttribute("material", "color", "#ffd700");

        if (light) {
          light.setAttribute("intensity", 1.8);
          light.setAttribute("color", "#fff");
        }

        // Dark mode only
      } else if (this.darkMode) {
        this.envGroundEl.setAttribute(
          "environment",
          "preset: forest; fog: 0; skyType: none; ground: noise; groundFrequency: 5; groundColor: #000000; groundColor2: #000000; groundTexture: walkernoise; playArea: 14;",
        );

        this.darkSkyEl.setAttribute("visible", true);
        this.contrastSkyEl.setAttribute("visible", false);

        this.hudEl.style.background = "rgba(20, 20, 20, 0.9)";
        this.hudEl.style.color = "#fff";

        this.titleEl.style.color = "#fff";
        this.feedbackEl.style.color = "#fff";
        this.incomeEl.style.color = "#fff";
        this.debtEl.style.color = "#fff";
        this.cashEl.style.color = "#fff";
        this.ageEl.style.color = "#fff";
        this.helpEl.style.color = "#fff";
        this.controlHeaderEl.style.color = "#fff";

        this.leftLabelBgEl.setAttribute(
          "material",
          "color: #2e2f31; opacity: 0.88; shader: flat",
        );

        this.rightLabelBgEl.setAttribute(
          "material",
          "color: #2e2f31; opacity: 0.88; shader: flat",
        );

        this.leftLabelEl.setAttribute("color", SLOT_STYLES.left.textColor);
        this.rightLabelEl.setAttribute("color", SLOT_STYLES.right.textColor);

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

        if (light) {
          light.setAttribute("intensity", 1.2);
          light.setAttribute("color", "#d6dde5");
        }

        // Contrast mode only
      } else if (this.contrastMode) {
        this.envGroundEl.setAttribute(
          "environment",
          "preset: forest; fog: 0; skyType: color; skyColor: #fff; ground: noise; groundFrequency: 5; groundColor: #d9d9d9; groundColor2: #a6a6a6; groundTexture: walkernoise; playArea: 14;",
        );

        this.darkSkyEl.setAttribute("visible", false);
        this.contrastSkyEl.setAttribute("visible", true);

        // High contrast hud
        this.hudEl.style.background = "#000000";
        this.hudEl.style.color = "#fff";

        this.titleEl.style.color = "#fff";
        this.feedbackEl.style.color = "#fff";
        this.incomeEl.style.color = "#fff";
        this.debtEl.style.color = "#fff";
        this.cashEl.style.color = "#fff";
        this.ageEl.style.color = "#fff";
        this.helpEl.style.color = "#fff";
        this.controlHeaderEl.style.color = "#fff";

        this.leftLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 1; shader: flat",
        );

        this.rightLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 1; shader: flat",
        );

        this.leftLabelEl.setAttribute("color", "#000000");
        this.rightLabelEl.setAttribute("color", "#000000");

        this.leftDoorEl.setAttribute("material", "color", "#0000ff");
        this.rightDoorEl.setAttribute("material", "color", "#ffd700");

        if (light) {
          light.setAttribute("intensity", 3);
          light.setAttribute("color", "#fff");
        }

        // Default environment
      } else {
        this.envGroundEl.setAttribute(
          "environment",
          "preset: forest; fog: 0.70; skyType: atmosphere; ground: noise; groundFrequency: 5; groundColor: #6f6f6f; groundColor2: #5a5a5a; groundTexture: walkernoise; playArea: 14;",
        );

        this.darkSkyEl.setAttribute("visible", false);
        this.contrastSkyEl.setAttribute("visible", false);

        this.hudEl.style.background = "rgba(255, 255, 255, 0.88)";
        this.hudEl.style.color = "#111";

        this.titleEl.style.color = "#111";
        this.feedbackEl.style.color = "#222";
        this.incomeEl.style.color = "#222";
        this.debtEl.style.color = "#222";
        this.cashEl.style.color = "#222";
        this.ageEl.style.color = "#222";
        this.helpEl.style.color = "#555";
        this.controlHeaderEl.style.color = "#444";

        this.leftLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 0.9; shader: flat",
        );

        this.rightLabelBgEl.setAttribute(
          "material",
          "color: #fff; opacity: 0.9; shader: flat",
        );

        this.leftLabelEl.setAttribute("color", SLOT_STYLES.left.textColor);
        this.rightLabelEl.setAttribute("color", SLOT_STYLES.right.textColor);

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

        if (light) {
          light.setAttribute("intensity", 2.5);
          light.setAttribute("color", "#ffb347");
        }
      }
    },
  };
})();
