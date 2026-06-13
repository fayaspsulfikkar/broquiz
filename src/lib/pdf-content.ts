// ============================================
// BroQuiz — PDF Content (Pre-extracted)
// Knowledge source for AI question generation
// ============================================

// The content below is extracted from the 4 source PDFs.
// This avoids runtime PDF parsing and keeps the content as constants.

export const PDF_CONTENT = {
  variables_and_basics: `
## Variables as Memory Containers
A variable is a named container that stores data in memory. Think of it as a labeled box where you can put a value and retrieve it later.

Declaration: int age = 25; — creates a box labeled "age" containing the value 25.
Data Types: int (whole numbers), float/double (decimals), char (single character), bool (true/false).
Naming Rules: Must start with a letter or underscore, cannot use reserved keywords, case-sensitive.

## The IPO Model (Input-Process-Output)
Every program follows the IPO model:
- Input: Data received from the user (scanf, cin)
- Process: Computation, logic, and transformation
- Output: Result displayed to the user (printf, cout)

## Variable Swapping with Temp Variable
To swap two variables without losing data:
int temp = a;  // Save a's value
a = b;         // Overwrite a with b
b = temp;      // Put original a into b
Without temp, doing a=b; b=a; loses the original value of a.
`,

  arithmetic: `
## Arithmetic Operations
The five basic operators:
- Addition: a + b
- Subtraction: a - b
- Multiplication: a * b
- Division: a / b (integer division truncates: 10/3 = 3)
- Modulo: a % b (remainder: 17%5 = 2)

Important: Integer division in C truncates the decimal part. 10/3 gives 3, not 3.33.
The modulo operator gives the remainder after division.

## Increment/Decrement
- a = a + 1 is the same as a++ or ++a
- a = a - 1 is the same as a-- or --a
- Compound assignment: a += 5 means a = a + 5
`,

  control_flow: `
## If/Else Statements
Conditional execution based on boolean conditions:
if (condition) { /* true block */ }
else if (another_condition) { /* alternative */ }
else { /* default block */ }

The else block is optional. Conditions can be nested.

## Switch/Case
Alternative to multiple if-else chains for discrete values:
switch(variable) {
  case value1: /* code */ break;
  case value2: /* code */ break;
  default: /* fallback code */
}

IMPORTANT: The break keyword is essential! Without it, execution "falls through" to the next case, which is usually a bug.

The default case handles all values not matched by any case — like the "else" of a switch.
`,

  loops: `
## For Loop
for(initialization; condition; update) { body }
Example: for(int i = 0; i < 5; i++) { printf("%d ", i); }
Prints: 0 1 2 3 4 (5 iterations, 0-indexed)

## While Loop
Checks condition BEFORE each iteration:
while(condition) { body }
May execute zero times if condition is initially false.

## Do-While Loop
Checks condition AFTER each iteration:
do { body } while(condition);
Always executes at least once — this is the key difference from while.

## Break and Continue
- break: Immediately exits the loop entirely
- continue: Skips the rest of the current iteration, jumps to next iteration
Example with continue:
for(i=1; i<=5; i++) { if(i==3) continue; printf("%d ", i); }
Output: 1 2 4 5 (3 is skipped)

## Nested Loops and Patterns
Nested loops are loops inside loops. The inner loop completes fully for each outer iteration.
Total iterations = outer_count × inner_count

Pattern generation example (right triangle):
for(i=1; i<=3; i++) {
  for(j=1; j<=i; j++) { printf("* "); }
  printf("\\n");
}
Output:
*
* *
* * *
`,

  arrays: `
## Array Declaration and Zero-Indexing
An array is a collection of elements of the same type stored in contiguous memory.
Declaration: int arr[5] = {10, 20, 30, 40, 50};

CRITICAL: Arrays use zero-based indexing.
- arr[0] = 10 (first element)
- arr[1] = 20 (second element)
- arr[4] = 50 (fifth/last element)
- arr[5] = OUT OF BOUNDS! Undefined behavior.

## Array Traversal
Use a for loop to visit each element:
for(int i = 0; i < size; i++) {
  printf("%d ", arr[i]);
}

## Summation Algorithm
int sum = 0;  // MUST initialize to 0
for(int i = 0; i < size; i++) {
  sum += arr[i];
}

## Linear Search
Find an element by checking each position:
for(int i = 0; i < size; i++) {
  if(arr[i] == target) { printf("Found at index %d", i); break; }
}
Worst case: element is last or not present (checks all N elements).

## Out-of-Bounds Errors
Accessing indices outside [0, size-1] causes undefined behavior.
C does NOT perform automatic bounds checking — this is a common source of bugs.
`,

  atm_project: `
## The ATM Machine Project
An integrative project combining ALL fundamental concepts:
- Variables: balance, choice, amount
- Loop: while loop to keep the menu running
- Switch/Case: to handle menu options (1=Check Balance, 2=Deposit, 3=Withdraw, 4=Exit)
- Conditional Logic: if(amount > balance) to prevent overdraft
- IPO: Input (user choice), Process (update balance), Output (display result)

This project demonstrates that real programs combine multiple concepts together.
The DRY principle is applied here — the menu loop avoids repeating the menu display code.
`,

  dry_principle: `
## The DRY Principle
DRY = Don't Repeat Yourself

Instead of writing the same code multiple times, use:
- Loops (to repeat actions)
- Functions (to encapsulate reusable logic)
- Variables (to store repeated values once)

Benefits: Less code, fewer bugs, easier maintenance.
Violation example: Writing printf 5 times instead of using a for loop.
`,
};

// Combine all content for full AI prompt
export const FULL_PDF_CONTENT = Object.values(PDF_CONTENT).join('\n\n---\n\n');

// Topic-specific content for targeted question generation
export const TOPIC_CONTENT: Record<string, string> = {
  variables: PDF_CONTENT.variables_and_basics,
  arithmetic: PDF_CONTENT.arithmetic,
  control_flow: PDF_CONTENT.control_flow,
  loops: PDF_CONTENT.loops,
  arrays: PDF_CONTENT.arrays,
  atm_project: PDF_CONTENT.atm_project,
  algorithms: PDF_CONTENT.arrays + '\n\n' + PDF_CONTENT.dry_principle,
};
