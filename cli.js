#!/usr/bin/env node

const fs = require('fs/promises');
const cp = require('child_process');

const exec = async (args) => {
  const p = cp.spawn('npm', args, {
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  await new Promise((resolve, reject) => {
    p.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm exited with code ${code}`));
      }
    });
  });
};

const filename = process.argv[2] || 'package.json';

(async () => {
  const data = await fs.readFile(filename);
  const config = JSON.parse(data.toString());

  const prod = Object.keys(config.dependencies || {});
  const dev = Object.keys(config.devDependencies || {});
  const peer = Object.keys(config.peerDependencies || {});
  const optional = Object.keys(config.optionalDependencies || {});

  const all = [].concat(prod, dev, peer, optional);

  const commands = [];

  if (all.length > 0) {
    commands.push(['remove'].concat(all));
  }
  if (prod.length > 0) {
    commands.push(['install'].concat(prod));
  }
  if (dev.length > 0) {
    commands.push(['install', '--save-dev'].concat(dev));
  }
  if (peer.length > 0) {
    commands.push(['install', '--save-peer'].concat(peer));
  }
  if (optional.length > 0) {
    commands.push(['install', '--save-optional'].concat(optional));
  }

  for (const command of commands) {
    await exec(command);
  }
})()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  });
