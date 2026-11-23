import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMemory,
  applyPercent,
  applyUnary,
  backspace,
  clearAll,
  clearEntry,
  createInitialCalculatorState,
  ERROR_DIVIDE_BY_ZERO,
  ERROR_INVALID_INPUT,
  evaluateEquals,
  formatDisplayNumber,
  getRawCopyValue,
  inputDecimal,
  inputDigit,
  inputOperator,
  loadHistoryItem,
  toggleSign,
  CalculatorState,
} from './calculatorLogic';

function typeNumber(state: CalculatorState, numStr: string): CalculatorState {
  let next = state;
  for (const ch of numStr) {
    if (ch === '.') {
      next = inputDecimal(next);
    } else if (ch === '-') {
      next = toggleSign(next);
    } else {
      next = inputDigit(next, ch);
    }
  }
  return next;
}

test('basic multiplication matches Windows expression and comma formatting', () => {
  let s = createInitialCalculatorState();
  s = typeNumber(s, '60000');
  s = inputOperator(s, '*');
  assert.equal(s.expression, '60,000 ×');
  s = typeNumber(s, '4');
  s = evaluateEquals(s);

  assert.equal(s.expression, '60,000 × 4 =');
  assert.equal(s.displayValue, '240000');
  assert.equal(formatDisplayNumber(s.displayValue), '240,000');
  assert.equal(getRawCopyValue(s), '240000');
  assert.equal(s.history.length, 1);
  assert.equal(s.history[0].result, '240,000');
});

test('floating point precision avoids 0.30000000000000004 drift', () => {
  let s = createInitialCalculatorState();
  s = typeNumber(s, '0.1');
  s = inputOperator(s, '+');
  s = typeNumber(s, '0.2');
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '0.3');

  s = clearAll(s);
  s = typeNumber(s, '1.15');
  s = inputOperator(s, '*');
  s = typeNumber(s, '100');
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '115');
});

test('chained calculations and repeated equals work accurately', () => {
  let s = createInitialCalculatorState();
  s = typeNumber(s, '100000');
  s = inputOperator(s, '+');
  s = typeNumber(s, '270000');
  s = inputOperator(s, '+');
  assert.equal(s.displayValue, '370000');
  assert.equal(s.expression, '370,000 +');

  s = typeNumber(s, '30000');
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '400000');
  assert.equal(s.expression, '370,000 + 30,000 =');

  // Repeated '=' adds 30000 again
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '430000');
});

test('percentage follows Windows Standard Calculator rules for add and multiply', () => {
  // 200000 + 11% = 222000 (PPN)
  let s = createInitialCalculatorState();
  s = typeNumber(s, '200000');
  s = inputOperator(s, '+');
  s = typeNumber(s, '11');
  s = applyPercent(s);
  assert.equal(s.displayValue, '22000');
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '222000');

  // 200000 * 11% = 22000
  s = clearAll(s);
  s = typeNumber(s, '200000');
  s = inputOperator(s, '*');
  s = typeNumber(s, '11');
  s = applyPercent(s);
  assert.equal(s.displayValue, '0.11');
  s = evaluateEquals(s);
  assert.equal(s.displayValue, '22000');
});

test('unary operations (1/x, x^2, sqrt, +/-) and division by zero error handling', () => {
  let s = createInitialCalculatorState();
  s = typeNumber(s, '4');
  s = applyUnary(s, 'reciprocal');
  assert.equal(s.displayValue, '0.25');

  s = clearAll(s);
  s = typeNumber(s, '12');
  s = applyUnary(s, 'square');
  assert.equal(s.displayValue, '144');

  s = applyUnary(s, 'sqrt');
  assert.equal(s.displayValue, '12');

  s = toggleSign(s);
  assert.equal(s.displayValue, '-12');

  // sqrt of negative number
  s = applyUnary(s, 'sqrt');
  assert.equal(s.error, ERROR_INVALID_INPUT);

  // Recover by typing digit and divide by zero
  s = inputDigit(s, '5');
  assert.equal(s.error, null);
  s = inputOperator(s, '/');
  s = inputDigit(s, '0');
  s = evaluateEquals(s);
  assert.equal(s.error, ERROR_DIVIDE_BY_ZERO);
  assert.equal(getRawCopyValue(s), '');
});

test('CE, C, Backspace, Memory (MS, M+, M-, MR, MC), and History restore', () => {
  let s = createInitialCalculatorState();
  s = typeNumber(s, '1234');
  s = backspace(s);
  assert.equal(s.displayValue, '123');

  s = clearEntry(s);
  assert.equal(s.displayValue, '0');

  // Memory operations
  assert.equal(s.memory, null);
  s = typeNumber(s, '500');
  s = applyMemory(s, 'MS');
  assert.equal(s.memory, 500);

  s = typeNumber(s, '250');
  s = applyMemory(s, 'M+');
  assert.equal(s.memory, 750);

  s = typeNumber(s, '100');
  s = applyMemory(s, 'M-');
  assert.equal(s.memory, 650);

  s = clearAll(s); // C preserves memory
  assert.equal(s.memory, 650);
  s = applyMemory(s, 'MR');
  assert.equal(s.displayValue, '650');

  s = applyMemory(s, 'MC');
  assert.equal(s.memory, null);

  // History restore
  s = clearAll(s);
  s = typeNumber(s, '50');
  s = inputOperator(s, '*');
  s = typeNumber(s, '3');
  s = evaluateEquals(s);
  assert.equal(s.history.length, 1);

  const savedItem = s.history[0];
  s = clearAll(s);
  assert.equal(s.displayValue, '0');
  s = loadHistoryItem(s, savedItem);
  assert.equal(s.displayValue, '150');
  assert.equal(s.expression, '50 × 3 =');
});
