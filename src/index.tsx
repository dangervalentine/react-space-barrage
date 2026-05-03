import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('=== REACT APP LOADING ===');

const root = createRoot(document.getElementById('root')!);
console.log('Root created, rendering App');
root.render(<App />);
console.log('App rendered');
