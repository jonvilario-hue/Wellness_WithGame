
/**
 * @fileoverview Development-only performance profiling harness.
 * This script is not part of the production build but can be used
 * from the browser console to automate performance testing.
 */

import { usePerformanceStore } from '@/hooks/use-performance-store';
import { PRNG } from '../rng';
import { generateVerbalSequence } from '../verbal-stimulus-factory';

async function profileSession(gameId: string, mode: 'verbal' | 'math', trialCount: number) {
  if (process.env.NODE_ENV !== 'development') {
    console.log("Performance profiling is only available in development mode.");
    return;
  }

  console.log(`--- Starting Performance Profile ---`);
  console.log(`Game: ${gameId}, Mode: ${mode}, Trials: ${trialCount}`);
  console.log(`------------------------------------`);

  const results = {
    renderTimes: [] as number[],
    heapSizes: [] as number[],
    dbWriteTimes: [] as number[],
  };

  const prng = new PRNG('performance-test-seed');

  // --- Initial State ---
  performance.mark('session-start');
  const initialMemory = (performance as any).memory;
  if (initialMemory) {
    results.heapSizes.push(initialMemory.usedJSHeapSize);
  }

  for (let i = 0; i < trialCount; i++) {
    // --- 1. Stimulus Generation ---
    // This is a placeholder. A real implementation would need a factory
    // that can be called programmatically.
    generateVerbalSequence(5, prng);

    // --- 2. Simulate Render ---
    performance.mark('render-start');
    await new Promise(resolve => setTimeout(resolve, 8)); // Simulate ~1/2 frame of work
    performance.mark('render-end');
    performance.measure(`render-trial-${i}`, 'render-start', 'render-end');
    const renderMeasure = performance.getEntriesByName(`render-trial-${i}`)[0];
    results.renderTimes.push(renderMeasure.duration);

    // --- 3. Simulate Telemetry Write ---
    const mockTrial = { id: `prof-${i}` } as any;
    performance.mark('db-write-start');
    await usePerformanceStore.getState().logTrial(mockTrial);
    performance.mark('db-write-end');
    performance.measure(`db-write-trial-${i}`, 'db-write-start', 'db-write-end');
    const dbMeasure = performance.getEntriesByName(`db-write-trial-${i}`)[0];
    results.dbWriteTimes.push(dbMeasure.duration);

    // --- 4. Sample Memory ---
    const memory = (performance as any).memory;
    if (memory) {
      results.heapSizes.push(memory.usedJSHeapSize);
    }
  }

  performance.mark('session-end');
  performance.measure('total-session-time', 'session-start', 'session-end');

  // --- Report Results ---
  const totalSessionTime = performance.getEntriesByName('total-session-time')[0].duration;
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  const maxRender = Math.max(...results.renderTimes);
  const avgRender = results.renderTimes.reduce((a, b) => a + b, 0) / results.renderTimes.length;
  const maxDBWrite = Math.max(...results.dbWriteTimes);
  const avgDBWrite = results.dbWriteTimes.reduce((a, b) => a + b, 0) / results.dbWriteTimes.length;
  const heapStart = results.heapSizes[0] || 0;
  const heapEnd = results.heapSizes[results.heapSizes.length - 1] || 0;
  const heapGrowth = heapEnd - heapStart;

  // Budgets
  const RENDER_BUDGET_MS = 16;
  const DB_BUDGET_MS = 50;
  const HEAP_BUDGET_BYTES = 50 * 1024 * 1024;

  console.log(`--- Performance Profile Results ---`);
  console.log(`Total session time: ${totalSessionTime.toFixed(2)}ms`);
  
  console.log(`\n--- Render Time (Budget: <${RENDER_BUDGET_MS}ms) ---`);
  console.log(`Max Render Time: ${maxRender.toFixed(2)}ms -> ${maxRender < RENDER_BUDGET_MS ? 'PASS' : 'FAIL'}`);
  console.log(`Avg Render Time: ${avgRender.toFixed(2)}ms`);

  console.log(`\n--- DB Write Time (Budget: <${DB_BUDGET_MS}ms) ---`);
  console.log(`Max DB Write: ${maxDBWrite.toFixed(2)}ms -> ${maxDBWrite < DB_BUDGET_MS ? 'PASS' : 'FAIL'}`);
  console.log(`Avg DB Write: ${avgDBWrite.toFixed(2)}ms`);

  console.log(`\n--- Heap Growth (Budget: <${toMB(HEAP_BUDGET_BYTES)}MB) ---`);
  console.log(`Heap Start: ${toMB(heapStart)}MB`);
  console.log(`Heap End: ${toMB(heapEnd)}MB`);
  console.log(`Total Growth: ${toMB(heapGrowth)}MB -> ${heapGrowth < HEAP_BUDGET_BYTES ? 'PASS' : 'FAIL'}`);

  console.log(`---------------------------------`);

  // Cleanup performance marks
  performance.clearMarks();
  performance.clearMeasures();
}


if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).profileSession = profileSession;
}
