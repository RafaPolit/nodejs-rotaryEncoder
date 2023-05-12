"use strict";

const Gpio = require("onoff").Gpio; // Gpio class

// Export GPIO4 as an interrupt generating input with a debounceTimeout of 10
// milliseconds
const button = new Gpio(22, "in", "rising", { debounceTimeout: 10 });

console.log("Please press the button on GPIO22...");

// The callback passed to watch will be invoked when the button connected to
// GPIO22 is pressed
button.watch((err, value) => {
  if (err) {
    throw err;
  }

  console.log("Button pressed!, its value was " + value);
});

process.on("SIGINT", (_) => {
  button.unexport();
});
