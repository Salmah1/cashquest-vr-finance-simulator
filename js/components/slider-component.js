// Custom A-Frame component for slider interaction
// Allows user to drag a knob to set a percentage


AFRAME.registerComponent('slider-track', {
  schema: { type: 'string' },

  init: function () {
  this.el.addEventListener('click', () => {
    console.log("TRACK CLICKED:", this.data);
  });

  this.el.classList.add('clickable');

  this.el.addEventListener('click', (evt) => {

    let intersection = evt.detail.intersection;
    if (!intersection) return;

    // ✅ Convert world → local space of slider
    let localPoint = this.el.object3D.worldToLocal(
      intersection.point.clone()
    );

    let x = localPoint.x;

    // Clamp
    let min = -1.5;
    let max = 1.5;
    let width = 3;

    // 👉 Detect sub sliders
if (this.data.includes("Sub")){      
      min = -1;
      max = 1;
      width = 2;
    }

    // Clamp
    x = Math.max(min, Math.min(max, x));

    // Convert to percent
    let percent = (x - min) / width;

    console.log("PERCENT:", percent);
    console.log("SLIDER TYPE:", this.data);

    if (
      this.data === "savingsSub" ||
      this.data === "cashISASub" ||
      this.data === "lisaSub" ||
      this.data === "bondsSub"
    ) {
      updateSubSaveBubble(this.data, percent);
    }
    else if (this.data.includes("Sub")) {
      updateSubBubble(this.data, percent);

        // If debt slider moved, refresh debt bubble text
      if (this.data === "debtSub") {
        updateDebtBubbleUI();
      }
    }
    else {
      updateAllocation(this.data, percent);

      if (this.data === "debt") {
        updateDebtBubbleUI();
      }
    }
  });
  }
});