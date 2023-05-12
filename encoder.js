"use strict";
const { hrtime } = require("node:process");

const Gpio = require("onoff").Gpio; // Gpio class

const clk = new Gpio(17, "in", "rising");
const dt = new Gpio(27, "in", "both", { debounceTimeout: 10 });
const sw = new Gpio(22, "in", "both", { debounceTimeout: 10 });

console.log("Rotate or click on the encoder");

let rotation = 0;
let click = 0;
let longClick = 0;

let hrLastRotation = BigInt(0);
let hrClickStart = BigInt(0);
let speed = 10;

const formatOutput = () => {
  process.stdout.clearLine();
  process.stdout.write(
    `Rotation: ${rotation}, Click: ${click}, Long Click: ${longClick}, Speed: ${speed}\r`
  );
};

clk.watch((err, clkValue) => {
  if (err) {
    throw err;
  }

  const dtValue = dt.readSync();

  if (hrLastRotation === BigInt(0)) {
    hrLastRotation = hrtime.bigint();
  } else {
    const hrCurrentRotation = hrtime.bigint();
    speed = Math.min(
      10,
      Math.round(
        parseInt((hrCurrentRotation - hrLastRotation) / BigInt(30000000))
      )
    );
    hrLastRotation = hrtime.bigint();
  }

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
    hrClickStart = hrtime.bigint();
  } else {
    const hrEnd = hrtime.bigint();
    if (hrEnd - hrClickStart > BigInt(1000000000)) {
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
