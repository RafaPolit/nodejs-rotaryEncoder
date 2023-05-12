"use strict";
const { hrtime } = require("node:process");

const Gpio = require("onoff").Gpio; // Gpio class

const clk = new Gpio(17, "in", "rising");
const dt = new Gpio(27, "in", "both");
const sw = new Gpio(22, "in", "both", { debounceTimeout: 10 });

console.log("Rotate or click on the encoder");

let rotation = 0;
let click = 0;
let longClick = 0;
let hrStart = BigInt(0);

const formatOutput = () => {
  process.stdout.clearLine();
  process.stdout.write(
    `Rotation: ${rotation}, Click: ${click}, Long Click: ${longClick}\r`
  );
};

clk.watch((err, clkValue) => {
  if (err) {
    throw err;
  }

  const dtValue = dt.readSync();
  if (dtValue !== clkValue) {
    rotation += 1;
  } else {
    rotation -= 1;
  }

  formatOutput();
});

sw.watch((err, value) => {
  if (err) {
    throw err;
  }

  if (value === 0) {
    hrStart = hrtime.bigint();
  } else {
    const hrEnd = hrtime.bigint();
    if (hrEnd - hrStart > BigInt(1000000000)) {
      longClick += 1;
    } else {
      click += 1;
    }
    formatOutput();
  }
});

process.on("SIGINT", (_) => {
  clk.unexport();
  dt.unexport();
  sw.unexport();
});
