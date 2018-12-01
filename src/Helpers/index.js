import React from 'react';

import { SmStarSC, MdStarSC, LgStarSC } from '../Components/StyledComponents';
import { KEYS } from '../Resources';

import a from '../Assets/a.svg';
import b from '../Assets/b.svg';
import c from '../Assets/c.svg';

const enemiesSVGS = [a, b, c];
const maxX = 1000;
const minX = -40;

//////////////////////
// Helper Functions //
//////////////////////

// Runs every 50ms in order to assess and adjust state
export const tick = App => {
  const state = App.state;
  const enemies = App.enemies;

  updateEnemies(enemies, state);
  const decayVelocityState = decayVelocity(state);

  return decayVelocityState;
};

// Lower the inertia of a moving ship
const decayVelocity = state => {
  const newState = { ...state };
  const { rVelocity, lVelocity, shipX } = newState;
  const velocity = lVelocity + rVelocity;

  newState.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  newState.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  if (velocity >= 0) {
    newState.shipX = shipX <= maxX ? shipX + velocity : minX;
  } else if (velocity <= 0) {
    newState.shipX = shipX >= minX ? shipX + velocity : maxX;
  }

  return newState;
};

const updateEnemies = (enemies, state) => {
  const shipX = document.querySelector('.Ship').getBoundingClientRect().x;

  enemies.forEach((enemy, i) => {
    const enemyDim = enemy.getBoundingClientRect();
    const y = Math.floor(enemyDim.y);

    if (y > 660 && y < 820) {
      const x = Math.floor(enemyDim.left);

      if (x >= shipX - 60 && x <= shipX + 60) {
        state.isShipHit = true;
      }
    }
    if (y >= 825) {
      enemy.style.webkitAnimation = 'none';
      enemy.style.animation = 'none';
      setTimeout(function() {
        enemy.style.webkitAnimation = '';
        enemy.style.animation = '';
        enemy.style.animationDuration = `${(randomUpTo(3) + 1) * 2}s`;
        enemy.style.left = `${randomUpTo(10) * 100}px`;
        enemy.style.background = `url(${enemiesSVGS[randomUpTo(3)]})`;
        enemy.style.backgroundSize = 'cover';
      }, 10);
      state.score = state.score + 1;
    }
  });
};

// Randomly re-creates and places an enemy at the top
export const createEnemy = (key = 1) => {
  return {
    y: 0,
    x: randomUpTo(10) * 100,
    index: key,
    color: randomUpTo(3),
    speed: (randomUpTo(3) + 1) * 4,
  };
};

// Move the ship through keyboard input
export const handleKeys = (state, e) => {
  const newState = { ...state };
  const { rVelocity, lVelocity, shipX } = newState;
  const key = e.keyCode;

  if (key === KEYS.RIGHT || key === KEYS.D)
    newState.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

  if (key === KEYS.LEFT || key === KEYS.A)
    newState.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

  newState.shipX = shipX + newState.lVelocity + newState.rVelocity;

  return newState;
};

// Creates 30 star elements with animation
// Returns array of stars
export const createStars = () => {
  const rX = () => randomUpTo(maxX);
  const rDelay = () => 0 - randomUpTo(4800);

  const stars = [];
  for (let i = 0; i < 5; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={12} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={8} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={6} delay={rDelay()} />,
    );
  }

  return stars;
};

// Random number from one up to the parameter
export const randomUpTo = upperLimit => Math.floor(Math.random() * upperLimit);
