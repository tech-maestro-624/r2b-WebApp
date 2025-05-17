#!/usr/bin/env node

/**
 * Script to find unused variables in the codebase
 * Run with: node find-unused.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function main() {
  try {
    console.log(chalk.blue('Scanning for unused variables and imports...'));
    
    // Run ESLint with the no-unused-vars rule
    const { stdout, stderr } = await execAsync('npx eslint --no-eslintrc --rule "no-unused-vars: error" --rule "react/jsx-uses-vars: error" --ext .jsx,.js src/');
    
    if (stderr) {
      console.error(chalk.red('Error running ESLint:'), stderr);
      return;
    }
    
    if (!stdout) {
      console.log(chalk.green('No unused variables found!'));
      return;
    }
    
    // Process the output
    const lines = stdout.split('\n');
    const unusedVarsMap = new Map();
    
    let currentFile = null;
    
    for (const line of lines) {
      if (line.includes('.jsx') || line.includes('.js')) {
        currentFile = line.trim();
        unusedVarsMap.set(currentFile, []);
      } else if (line.includes('no-unused-vars') && currentFile) {
        const unusedVar = line.match(/'([^']+)'/);
        if (unusedVar && unusedVar[1]) {
          unusedVarsMap.get(currentFile).push(unusedVar[1]);
        }
      }
    }
    
    // Display results
    console.log(chalk.yellow('\nUnused variables found:'));
    
    for (const [file, vars] of unusedVarsMap.entries()) {
      if (vars.length > 0) {
        console.log(chalk.cyan('\nFile:'), file);
        console.log(chalk.red('  Unused variables:'), vars.join(', '));
      }
    }
    
    console.log(chalk.yellow('\nTips to clean up:'));
    console.log('1. Remove unused imports');
    console.log('2. Clean up unused state variables');
    console.log('3. Check for references to deleted components');
    console.log('4. Run `npm run lint` to see all linting issues');
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

main(); 