#!/usr/bin/env node

const fs = require('fs/promises');
const cp = require('child_process');

const dependenciesKeys = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const installArg = {
  devDependencies: '--save-dev',
  peerDependencies: '--save-peer',
  optionalDependencies: '--save-optional',
};

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

  // to keep keys order
  const keys = Object.keys(config).filter((k) => dependenciesKeys.includes(k));

  let remove = keys.map((key) => Object.keys(config[key])).flat();
  await exec(['remove'].concat(remove));

  for (const key of keys) {
    const packages = Object.keys(config[key]);
    if (packages.length === 0) {
      continue;
    }
    let command = ['install'];
    if (installArg[key]) {
      command.push(installArg[key]);
    }
    command = command.concat(packages);
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
