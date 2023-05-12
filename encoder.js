"use strict";
const { hrtime } = require("node:process");

const Gpio = require("onoff").Gpio; // Gpio class

const clk = new Gpio(17, "in", "rising");
const dt = new Gpio(27, "in", "both", { debounceTimeout: 10 });
const sw = new Gpio(22, "in", "both", { debounceTimeout: 10 });

const virtualATRUrl = "http://192.168.0.47:3000/";
const encoderId = 1;

console.log("Rotate or click on the encoder");

let rotation = 0;
let click = 0;
let longClick = 0;

let hrLastRotation = BigInt(0);
let hrClickStart = BigInt(0);
let speed = 1;

const formatOutput = () => {
  process.stdout.clearLine();
  process.stdout.write(
    `Rotation: ${rotation}, Click: ${click}, Long Click: ${longClick}, Speed: ${speed}\r`
  );
};

clk.watch(async (err, clkValue) => {
  if (err) {
    throw err;
  }

  const dtValue = dt.readSync();

  if (hrLastRotation === BigInt(0)) {
    hrLastRotation = hrtime.bigint();
  } else {
    const hrCurrentRotation = hrtime.bigint();
    const speedFactor = Math.min(
      10,
      Math.round(
        parseInt((hrCurrentRotation - hrLastRotation) / BigInt(12000000))
      )
    );
    hrLastRotation = hrtime.bigint();

    speed = 1 + (10 - speedFactor);
  }

  let value = 0;
  if (dtValue !== clkValue) {
    value = 1;
    rotation += speed;
  } else {
    value = -1;
    rotation -= speed;
  }
  await fetch(`${virtualATRUrl}api/encoder-forwarder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, index: encoderId }),
  });

  formatOutput();
});

sw.watch(async (err, value) => {
  if (err) {
    throw err;
  }

  if (value === 0) {
    await fetch(`${virtualATRUrl}api/encoder-forwarder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "press", index: encoderId }),
    });
    hrClickStart = hrtime.bigint();
  } else {
    const hrEnd = hrtime.bigint();
    if (hrEnd - hrClickStart > BigInt(1000000000)) {
      await fetch(`${virtualATRUrl}api/encoder-forwarder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "longRelease", index: encoderId }),
      });
      longClick += 1;
    } else {
      await fetch(`${virtualATRUrl}api/encoder-forwarder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "release", index: encoderId }),
      });
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
