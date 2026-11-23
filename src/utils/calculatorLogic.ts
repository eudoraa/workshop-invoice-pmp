export type CalcOperator = '+' | '-' | '*' | '/';

export type UnaryOp = 'reciprocal' | 'square' | 'sqrt';

export type MemoryOp = 'MC' | 'MR' | 'M+' | 'M-' | 'MS';

export interface CalcHistoryItem {
  id: string;
  expression: string;
  result: string;
  rawValue: number;
}

export interface CalculatorState {
  displayValue: string;
  expression: string;
  accumulator: number | null;
  pendingOperator: CalcOperator | null;
  waitingForNewOperand: boolean;
  lastOperator: CalcOperator | null;
  lastOperand: number | null;
  justEvaluated: boolean;
  error: string | null;
  memory: number | null;
  history: CalcHistoryItem[];
}

export const ERROR_DIVIDE_BY_ZERO = 'Tidak dapat dibagi 0';
export const ERROR_INVALID_INPUT = 'Input tidak valid';
export const ERROR_OVERFLOW = 'Overflow';

const MAX_INPUT_DIGITS = 16;

let historySeq = 1;

function nextHistoryId(): string {
  historySeq += 1;
  return `calc-hist-${Date.now()}-${historySeq}`;
}

export function createInitialCalculatorState(): CalculatorState {
  return {
    displayValue: '0',
    expression: '',
    accumulator: null,
    pendingOperator: null,
    waitingForNewOperand: false,
    lastOperator: null,
    lastOperand: null,
    justEvaluated: false,
    error: null,
    memory: null,
    history: [],
  };
}

/**
 * Normalizes IEEE-754 floating point drift (e.g. 0.1 + 0.2 -> 0.3)
 * while preserving exact integers up to MAX_SAFE_INTEGER.
 */
export function cleanNumber(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Object.is(value, -0) || value === 0) return 0;
  if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
    return value;
  }
  const rounded = Number(value.toPrecision(12));
  return rounded === 0 ? 0 : rounded;
}

export function numberToRawString(value: number): string {
  const cleaned = cleanNumber(value);
  if (!Number.isFinite(cleaned)) return '0';
  if (cleaned !== 0 && (Math.abs(cleaned) >= 1e16 || Math.abs(cleaned) < 1e-10)) {
    return cleaned.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return String(cleaned);
}

export function formatOperatorSymbol(op: CalcOperator): string {
  switch (op) {
    case '+':
      return '+';
    case '-':
      return '−';
    case '*':
      return '×';
    case '/':
      return '÷';
  }
}

/**
 * Formats a raw numeric string with comma thousand separators (e.g. 60000 -> 60,000),
 * preserving trailing decimal point and trailing decimal zeroes during entry.
 */
export function formatDisplayNumber(raw: string): string {
  if (!raw) return '0';
  if (raw.includes('e') || raw.includes('E')) {
    return raw;
  }

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const parts = unsigned.split('.');
  const intPart = parts[0] || '0';
  const fracPart = parts.length > 1 ? parts[1] : null;

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const prefix = isNegative ? '-' : '';

  if (fracPart !== null) {
    return `${prefix}${formattedInt}.${fracPart}`;
  }
  return `${prefix}${formattedInt}`;
}

export function getRawCopyValue(state: CalculatorState): string {
  if (state.error) return '';
  const num = Number(state.displayValue);
  if (!Number.isFinite(num)) return '';
  return numberToRawString(num);
}

function computeBinary(
  left: number,
  op: CalcOperator,
  right: number
): { value: number; error: string | null } {
  let raw = 0;
  switch (op) {
    case '+':
      raw = left + right;
      break;
    case '-':
      raw = left - right;
      break;
    case '*':
      raw = left * right;
      break;
    case '/':
      if (right === 0) {
        return { value: 0, error: ERROR_DIVIDE_BY_ZERO };
      }
      raw = left / right;
      break;
  }

  if (!Number.isFinite(raw)) {
    return { value: 0, error: ERROR_OVERFLOW };
  }
  return { value: cleanNumber(raw), error: null };
}

function resetCalculationKeepingSession(state: CalculatorState): CalculatorState {
  return {
    ...createInitialCalculatorState(),
    memory: state.memory,
    history: state.history,
  };
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (!/^[0-9]$/.test(digit)) return state;

  if (state.error) {
    return {
      ...resetCalculationKeepingSession(state),
      displayValue: digit,
    };
  }

  if (state.justEvaluated) {
    return {
      ...resetCalculationKeepingSession(state),
      displayValue: digit,
    };
  }

  if (state.waitingForNewOperand) {
    return {
      ...state,
      displayValue: digit,
      waitingForNewOperand: false,
    };
  }

  const currentDigits = state.displayValue.replace(/[^0-9]/g, '');
  if (currentDigits.length >= MAX_INPUT_DIGITS) {
    return state;
  }

  if (state.displayValue === '0') {
    return {
      ...state,
      displayValue: digit,
    };
  }

  if (state.displayValue === '-0') {
    return {
      ...state,
      displayValue: `-${digit}`,
    };
  }

  return {
    ...state,
    displayValue: state.displayValue + digit,
  };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error || state.justEvaluated) {
    return {
      ...resetCalculationKeepingSession(state),
      displayValue: '0.',
    };
  }

  if (state.waitingForNewOperand) {
    return {
      ...state,
      displayValue: '0.',
      waitingForNewOperand: false,
    };
  }

  if (state.displayValue.includes('.')) {
    return state;
  }

  return {
    ...state,
    displayValue: `${state.displayValue}.`,
  };
}

export function inputOperator(
  state: CalculatorState,
  nextOp: CalcOperator
): CalculatorState {
  if (state.error) {
    return state;
  }

  const currentNum = cleanNumber(Number(state.displayValue) || 0);
  const symbol = formatOperatorSymbol(nextOp);

  // Switching operator before entering second operand
  if (
    state.pendingOperator !== null &&
    state.accumulator !== null &&
    state.waitingForNewOperand
  ) {
    return {
      ...state,
      pendingOperator: nextOp,
      expression: `${formatDisplayNumber(numberToRawString(state.accumulator))} ${symbol}`,
      justEvaluated: false,
    };
  }

  // Chained calculation: evaluate previous pending operator first
  if (state.pendingOperator !== null && state.accumulator !== null) {
    const { value, error } = computeBinary(
      state.accumulator,
      state.pendingOperator,
      currentNum
    );
    if (error) {
      return {
        ...state,
        error,
        displayValue: '0',
        accumulator: null,
        pendingOperator: null,
        waitingForNewOperand: true,
        justEvaluated: false,
      };
    }

    const rawResult = numberToRawString(value);
    const formattedResult = formatDisplayNumber(rawResult);
    return {
      ...state,
      displayValue: rawResult,
      accumulator: value,
      pendingOperator: nextOp,
      waitingForNewOperand: true,
      justEvaluated: false,
      expression: `${formattedResult} ${symbol}`,
    };
  }

  const rawCurrent = numberToRawString(currentNum);
  return {
    ...state,
    displayValue: rawCurrent,
    accumulator: currentNum,
    pendingOperator: nextOp,
    waitingForNewOperand: true,
    justEvaluated: false,
    expression: `${formatDisplayNumber(rawCurrent)} ${symbol}`,
  };
}

export function evaluateEquals(state: CalculatorState): CalculatorState {
  if (state.error) {
    return resetCalculationKeepingSession(state);
  }

  const currentNum = cleanNumber(Number(state.displayValue) || 0);

  // Case 1: Active pending binary operation
  if (state.pendingOperator !== null && state.accumulator !== null) {
    const left = state.accumulator;
    const right = currentNum;
    const op = state.pendingOperator;
    const symbol = formatOperatorSymbol(op);
    const exprText = `${formatDisplayNumber(numberToRawString(left))} ${symbol} ${formatDisplayNumber(numberToRawString(right))} =`;

    const { value, error } = computeBinary(left, op, right);
    if (error) {
      return {
        ...state,
        error,
        expression: exprText,
        displayValue: '0',
        accumulator: null,
        pendingOperator: null,
        waitingForNewOperand: true,
        justEvaluated: true,
      };
    }

    const rawResult = numberToRawString(value);
    const formattedResult = formatDisplayNumber(rawResult);
    const historyItem: CalcHistoryItem = {
      id: nextHistoryId(),
      expression: exprText,
      result: formattedResult,
      rawValue: value,
    };

    return {
      ...state,
      displayValue: rawResult,
      expression: exprText,
      accumulator: null,
      pendingOperator: null,
      lastOperator: op,
      lastOperand: right,
      waitingForNewOperand: true,
      justEvaluated: true,
      error: null,
      history: [historyItem, ...state.history].slice(0, 50),
    };
  }

  // Case 2: Repeated '=' press (re-applies lastOperator & lastOperand)
  if (state.justEvaluated && state.lastOperator !== null && state.lastOperand !== null) {
    const left = currentNum;
    const right = state.lastOperand;
    const op = state.lastOperator;
    const symbol = formatOperatorSymbol(op);
    const exprText = `${formatDisplayNumber(numberToRawString(left))} ${symbol} ${formatDisplayNumber(numberToRawString(right))} =`;

    const { value, error } = computeBinary(left, op, right);
    if (error) {
      return {
        ...state,
        error,
        expression: exprText,
        displayValue: '0',
        accumulator: null,
        pendingOperator: null,
        waitingForNewOperand: true,
        justEvaluated: true,
      };
    }

    const rawResult = numberToRawString(value);
    const formattedResult = formatDisplayNumber(rawResult);
    const historyItem: CalcHistoryItem = {
      id: nextHistoryId(),
      expression: exprText,
      result: formattedResult,
      rawValue: value,
    };

    return {
      ...state,
      displayValue: rawResult,
      expression: exprText,
      waitingForNewOperand: true,
      justEvaluated: true,
      error: null,
      history: [historyItem, ...state.history].slice(0, 50),
    };
  }

  // Case 3: Single value '='
  const rawCurrent = numberToRawString(currentNum);
  const formattedCurrent = formatDisplayNumber(rawCurrent);
  const exprText = `${formattedCurrent} =`;

  return {
    ...state,
    displayValue: rawCurrent,
    expression: exprText,
    waitingForNewOperand: true,
    justEvaluated: true,
  };
}

export function clearAll(state: CalculatorState): CalculatorState {
  return resetCalculationKeepingSession(state);
}

export function clearEntry(state: CalculatorState): CalculatorState {
  if (state.error || state.justEvaluated) {
    return resetCalculationKeepingSession(state);
  }
  return {
    ...state,
    displayValue: '0',
    waitingForNewOperand: false,
  };
}

export function backspace(state: CalculatorState): CalculatorState {
  if (state.error) {
    return resetCalculationKeepingSession(state);
  }

  if (state.justEvaluated) {
    return {
      ...state,
      expression: '',
    };
  }

  if (state.waitingForNewOperand) {
    return state;
  }

  if (
    state.displayValue.length <= 1 ||
    (state.displayValue.length === 2 && state.displayValue.startsWith('-'))
  ) {
    return {
      ...state,
      displayValue: '0',
    };
  }

  return {
    ...state,
    displayValue: state.displayValue.slice(0, -1),
  };
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.error) return state;

  if (state.displayValue === '0' || state.displayValue === '0.') {
    return state;
  }

  const nextDisplay = state.displayValue.startsWith('-')
    ? state.displayValue.slice(1)
    : `-${state.displayValue}`;

  return {
    ...state,
    displayValue: nextDisplay,
    waitingForNewOperand: false,
    justEvaluated: false,
  };
}

export function applyPercent(state: CalculatorState): CalculatorState {
  if (state.error) return state;

  const currentNum = Number(state.displayValue) || 0;

  if (state.accumulator === null || state.pendingOperator === null) {
    return {
      ...state,
      displayValue: '0',
      expression: '0',
      waitingForNewOperand: true,
    };
  }

  const percentValue =
    state.pendingOperator === '+' || state.pendingOperator === '-'
      ? cleanNumber((state.accumulator * currentNum) / 100)
      : cleanNumber(currentNum / 100);

  const rawPercent = numberToRawString(percentValue);
  const symbol = formatOperatorSymbol(state.pendingOperator);

  return {
    ...state,
    displayValue: rawPercent,
    expression: `${formatDisplayNumber(numberToRawString(state.accumulator))} ${symbol} ${formatDisplayNumber(rawPercent)}`,
    waitingForNewOperand: true,
  };
}

export function applyUnary(state: CalculatorState, op: UnaryOp): CalculatorState {
  if (state.error) return state;

  const currentNum = cleanNumber(Number(state.displayValue) || 0);
  const formattedArg = formatDisplayNumber(numberToRawString(currentNum));

  let result = 0;
  let unaryLabel = '';

  if (op === 'reciprocal') {
    unaryLabel = `1/(${formattedArg})`;
    if (currentNum === 0) {
      return {
        ...state,
        error: ERROR_DIVIDE_BY_ZERO,
        expression: unaryLabel,
        displayValue: '0',
        accumulator: null,
        pendingOperator: null,
        waitingForNewOperand: true,
        justEvaluated: true,
      };
    }
    result = cleanNumber(1 / currentNum);
  } else if (op === 'square') {
    unaryLabel = `sqr(${formattedArg})`;
    result = cleanNumber(currentNum * currentNum);
  } else {
    unaryLabel = `√(${formattedArg})`;
    if (currentNum < 0) {
      return {
        ...state,
        error: ERROR_INVALID_INPUT,
        expression: unaryLabel,
        displayValue: '0',
        accumulator: null,
        pendingOperator: null,
        waitingForNewOperand: true,
        justEvaluated: true,
      };
    }
    result = cleanNumber(Math.sqrt(currentNum));
  }

  if (!Number.isFinite(result)) {
    return {
      ...state,
      error: ERROR_OVERFLOW,
      expression: unaryLabel,
      displayValue: '0',
      waitingForNewOperand: true,
    };
  }

  const rawResult = numberToRawString(result);

  if (state.pendingOperator !== null && state.accumulator !== null) {
    const symbol = formatOperatorSymbol(state.pendingOperator);
    return {
      ...state,
      displayValue: rawResult,
      expression: `${formatDisplayNumber(numberToRawString(state.accumulator))} ${symbol} ${unaryLabel}`,
      waitingForNewOperand: true,
    };
  }

  const historyItem: CalcHistoryItem = {
    id: nextHistoryId(),
    expression: `${unaryLabel} =`,
    result: formatDisplayNumber(rawResult),
    rawValue: result,
  };

  return {
    ...state,
    displayValue: rawResult,
    expression: unaryLabel,
    waitingForNewOperand: true,
    justEvaluated: true,
    history: [historyItem, ...state.history].slice(0, 50),
  };
}

export function applyMemory(state: CalculatorState, op: MemoryOp): CalculatorState {
  if (state.error && op !== 'MC') return state;

  const currentNum = cleanNumber(Number(state.displayValue) || 0);

  switch (op) {
    case 'MC':
      return {
        ...state,
        memory: null,
      };
    case 'MR': {
      if (state.memory === null) return state;
      return {
        ...state,
        displayValue: numberToRawString(state.memory),
        waitingForNewOperand: true,
        justEvaluated: false,
      };
    }
    case 'MS':
      return {
        ...state,
        memory: currentNum,
        waitingForNewOperand: true,
      };
    case 'M+':
      return {
        ...state,
        memory: cleanNumber((state.memory ?? 0) + currentNum),
        waitingForNewOperand: true,
      };
    case 'M-':
      return {
        ...state,
        memory: cleanNumber((state.memory ?? 0) - currentNum),
        waitingForNewOperand: true,
      };
  }
}

export function loadHistoryItem(
  state: CalculatorState,
  item: CalcHistoryItem
): CalculatorState {
  return {
    ...state,
    displayValue: numberToRawString(item.rawValue),
    expression: item.expression,
    accumulator: null,
    pendingOperator: null,
    waitingForNewOperand: true,
    justEvaluated: true,
    error: null,
  };
}

export function clearHistory(state: CalculatorState): CalculatorState {
  return {
    ...state,
    history: [],
  };
}
