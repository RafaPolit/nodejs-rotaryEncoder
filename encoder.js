"use strict";

const Gpio = require("onoff").Gpio; // Gpio class

const clk = new Gpio(17, "in", "rising", { debounceTimeout: 10 });
const dt = new Gpio(27, "in", "both", { debounceTimeout: 10 });
const sw = new Gpio(22, "in", "rising", { debounceTimeout: 10 });

console.log("Rotate or click on the encoder");

clk.watch((err, clkValue) => {
  if (err) {
    throw err;
  }

  const dtVale = dt.readSync();
  console.log("CLK:", clkValue, " DT:", dtVale);
  if (dtVale === clkValue) {
    console.log("CW");
  } else {
    console.log("CCW");
  }
});

sw.watch((err, value) => {
  if (err) {
    throw err;
  }

  console.log("Button pressed!, its value was " + value);
});

process.on("SIGINT", (_) => {
  clk.unexport();
  dt.unexport();
  sw.unexport();
});
