/**
 * Expression Evaluator and Scientific Calculator
 */

// ==================== SCIENTIFIC CALCULATOR ====================

export const scientific = {
  factorial: (n: number): number => {
    if (n < 0) throw new Error('Factorial of negative number');
    if (!Number.isInteger(n)) throw new Error('Factorial requires integer');
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  },
  
  power: (base: number, exp: number): number => Math.pow(base, exp),
  
  sqrt: (n: number): number => {
    if (n < 0) throw new Error('Cannot compute square root of negative number');
    return Math.sqrt(n);
  },
  
  cbrt: (n: number): number => Math.cbrt(n),
  
  log10: (n: number): number => {
    if (n <= 0) throw new Error('Logarithm undefined for non-positive numbers');
    return Math.log10(n);
  },
  
  ln: (n: number): number => {
    if (n <= 0) throw new Error('Natural log undefined for non-positive numbers');
    return Math.log(n);
  },
  
  log2: (n: number): number => {
    if (n <= 0) throw new Error('Log base 2 undefined for non-positive numbers');
    return Math.log2(n);
  },
  
  exp: (n: number): number => Math.exp(n),
  
  sin: (deg: number): number => Math.sin(deg * Math.PI / 180),
  
  cos: (deg: number): number => Math.cos(deg * Math.PI / 180),
  
  tan: (deg: number): number => Math.tan(deg * Math.PI / 180),
  
  asin: (n: number): number => {
    if (n < -1 || n > 1) throw new Error('asin domain error');
    return Math.asin(n) * 180 / Math.PI;
  },
  
  acos: (n: number): number => {
    if (n < -1 || n > 1) throw new Error('acos domain error');
    return Math.acos(n) * 180 / Math.PI;
  },
  
  atan: (n: number): number => Math.atan(n) * 180 / Math.PI,
  
  atan2: (y: number, x: number): number => Math.atan2(y, x) * 180 / Math.PI,
  
  sinh: (n: number): number => Math.sinh(n),
  
  cosh: (n: number): number => Math.cosh(n),
  
  tanh: (n: number): number => Math.tanh(n),
  
  asinh: (n: number): number => Math.asinh(n),
  
  acosh: (n: number): number => {
    if (n < 1) throw new Error('acosh domain error');
    return Math.acosh(n);
  },
  
  atanh: (n: number): number => {
    if (n <= -1 || n >= 1) throw new Error('atanh domain error');
    return Math.atanh(n);
  },
  
  abs: (n: number): number => Math.abs(n),
  
  ceil: (n: number): number => Math.ceil(n),
  
  floor: (n: number): number => Math.floor(n),
  
  round: (n: number): number => Math.round(n),
  
  sign: (n: number): number => Math.sign(n),
  
  PI: Math.PI,
  
  E: Math.E,
};

// ==================== EXPRESSION EVALUATOR ====================

type TokenType = 'number' | 'operator' | 'function' | 'lparen' | 'rparen' | 'comma';

interface Token {
  type: TokenType;
  value: string | number;
}

const OPERATORS: Record<string, { precedence: number; associativity: 'left' | 'right' }> = {
  '+': { precedence: 1, associativity: 'left' },
  '-': { precedence: 1, associativity: 'left' },
  '*': { precedence: 2, associativity: 'left' },
  '/': { precedence: 2, associativity: 'left' },
  '%': { precedence: 2, associativity: 'left' },
  '^': { precedence: 3, associativity: 'right' },
};

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  sin: ([x]) => scientific.sin(x),
  cos: ([x]) => scientific.cos(x),
  tan: ([x]) => scientific.tan(x),
  asin: ([x]) => scientific.asin(x),
  acos: ([x]) => scientific.acos(x),
  atan: ([x]) => scientific.atan(x),
  sqrt: ([x]) => scientific.sqrt(x),
  cbrt: ([x]) => scientific.cbrt(x),
  log: ([x]) => scientific.ln(x),
  log10: ([x]) => scientific.log10(x),
  log2: ([x]) => scientific.log2(x),
  exp: ([x]) => scientific.exp(x),
  abs: ([x]) => scientific.abs(x),
  ceil: ([x]) => scientific.ceil(x),
  floor: ([x]) => scientific.floor(x),
  round: ([x]) => scientific.round(x),
  pow: ([x, y]) => scientific.power(x, y),
  min: (args) => Math.min(...args),
  max: (args) => Math.max(...args),
  factorial: ([x]) => scientific.factorial(x),
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2, // Golden ratio
};

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < expression.length) {
    const char = expression[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Number
    if (/\d/.test(char) || (char === '.' && /\d/.test(expression[i + 1]))) {
      let numStr = '';
      while (i < expression.length && (/\d/.test(expression[i]) || expression[i] === '.')) {
        numStr += expression[i++];
      }
      tokens.push({ type: 'number', value: parseFloat(numStr) });
      continue;
    }
    
    // Operator
    if (OPERATORS[char]) {
      // Handle unary minus
      if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'lparen' || tokens[tokens.length - 1].type === 'operator')) {
        tokens.push({ type: 'number', value: 0 });
      }
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      i++;
      continue;
    }
    
    // Comma
    if (char === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }
    
    // Function or constant
    if (/[a-zA-Z]/.test(char)) {
      let name = '';
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        name += expression[i++];
      }
      
      const lowerName = name.toLowerCase();
      
      // Check if it's a constant
      if (CONSTANTS[lowerName] !== undefined) {
        tokens.push({ type: 'number', value: CONSTANTS[lowerName] });
      } else if (FUNCTIONS[lowerName]) {
        tokens.push({ type: 'function', value: lowerName });
      } else {
        throw new Error(`Unknown identifier: ${name}`);
      }
      continue;
    }
    
    throw new Error(`Unexpected character: ${char}`);
  }
  
  return tokens;
}

function shuntingYard(tokens: Token[]): (Token)[] {
  const output: Token[] = [];
  const operatorStack: Token[] = [];
  
  for (const token of tokens) {
    switch (token.type) {
      case 'number':
        output.push(token);
        break;
        
      case 'function':
        operatorStack.push(token);
        break;
        
      case 'comma':
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'lparen') {
          output.push(operatorStack.pop()!);
        }
        break;
        
      case 'operator':
        const op1 = OPERATORS[token.value as string];
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type !== 'operator') break;
          
          const op2 = OPERATORS[top.value as string];
          if ((op1.associativity === 'left' && op1.precedence <= op2.precedence) ||
              (op1.associativity === 'right' && op1.precedence < op2.precedence)) {
            output.push(operatorStack.pop()!);
          } else {
            break;
          }
        }
        operatorStack.push(token);
        break;
        
      case 'lparen':
        operatorStack.push(token);
        break;
        
      case 'rparen':
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'lparen') {
          output.push(operatorStack.pop()!);
        }
        if (operatorStack.length === 0) {
          throw new Error('Mismatched parentheses');
        }
        operatorStack.pop(); // Remove lparen
        
        // Check for function
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'function') {
          output.push(operatorStack.pop()!);
        }
        break;
    }
  }
  
  while (operatorStack.length > 0) {
    const top = operatorStack.pop()!;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Mismatched parentheses');
    }
    output.push(top);
  }
  
  return output;
}

function evaluateRPN(rpn: Token[]): number {
  const stack: number[] = [];
  
  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value as number);
    } else if (token.type === 'operator') {
      if (stack.length < 2) {
        throw new Error('Invalid expression');
      }
      const b = stack.pop()!;
      const a = stack.pop()!;
      
      switch (token.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/':
          if (b === 0) throw new Error('Division by zero');
          stack.push(a / b);
          break;
        case '%': stack.push(a % b); break;
        case '^': stack.push(Math.pow(a, b)); break;
      }
    } else if (token.type === 'function') {
      const funcName = token.value as string;
      const func = FUNCTIONS[funcName];
      
      if (!func) {
        throw new Error(`Unknown function: ${funcName}`);
      }
      
      // Determine argument count (simplified: most functions take 1-2 args)
      const argCount = funcName === 'pow' || funcName === 'min' || funcName === 'max' ? 2 : 1;
      
      if (stack.length < argCount) {
        throw new Error(`Not enough arguments for ${funcName}`);
      }
      
      const args: number[] = [];
      for (let i = 0; i < argCount; i++) {
        args.unshift(stack.pop()!);
      }
      
      stack.push(func(args));
    }
  }
  
  if (stack.length !== 1) {
    throw new Error('Invalid expression');
  }
  
  return stack[0];
}

/**
 * Evaluate a mathematical expression string
 * Supports: +, -, *, /, %, ^ (power), parentheses
 * Functions: sin, cos, tan, sqrt, log, log10, exp, abs, ceil, floor, round, pow, min, max
 * Constants: pi, e, phi
 */
export function evaluateExpression(expression: string): number {
  if (!expression.trim()) {
    throw new Error('Empty expression');
  }
  
  try {
    const tokens = tokenize(expression);
    const rpn = shuntingYard(tokens);
    const result = evaluateRPN(rpn);
    
    if (!isFinite(result)) {
      throw new Error('Result is not a finite number');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple expression evaluator (basic math only, no functions)
 * Delegates to the safe tokenizer/parser instead of using Function constructor.
 */
export function evaluateSimpleExpression(expr: string): number {
  // Remove whitespace and validate basic math only
  const cleaned = expr.replace(/\s/g, '');

  if (!/^[\d+\-*/().]+$/.test(cleaned)) {
    throw new Error('Invalid expression - only basic math operators allowed');
  }

  return evaluateExpression(cleaned);
}
