/* MATLAB Learn curriculum: 16 units from zero, following the order of MATLAB Onramp, then beyond it.
   Unit: {n,ref,title,sections:[{h,p,code?}],takeaways,quick:[...],problems:[...]}
   Lesson text supports `inline code`, ```code blocks``` and "- " lists. A section's code gets a "Try it" button.
   Quick question: {q,code?,opts:[...],a:index} | {q,code,a:"what it displays"} | {q,code,v:"x",a:"value of x"}, plus why.
   Problem: {id,title,brief,starter,pre?,tests,hints,solution}
   Test: {pre?,inputs?,out?,match?,eq?:[[expr, expected, label?]],check?,plot?,src?,nosrc?,err?,label?}
     pre: MATLAB code that sets up the workspace before the learner's code runs.
     eq: expr is evaluated after the learner's code; expected is evaluated in a fresh workspace with only pre
         (or is code that sets a variable called want).
     check: MATLAB code run after the learner's code; assert(cond, msg) failures are shown.
     plot: {type, lines, title, xlabel, ylabel, legend, grid, x, y, ys, yfn, color, ls, marker}
     src / nosrc: [[regex, message]] that the code (comments removed) must / must not match. */
"use strict";
const m=String.raw;
const ONRAMP_URL="https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted";
const DOCS_URL="https://www.mathworks.com/help/matlab/";
const UNITS=[
/* ======================================================================= 1 */
{n:1,ref:"Commands",title:"MATLAB as a calculator",
 sections:[
  {h:"What MATLAB is",p:"MATLAB is a programming language built for working with numbers, especially lists and tables of numbers. The name comes from MATrix LABoratory. Engineers, scientists and quant analysts use it to crunch data, run models and draw charts.\n\nYou write commands, MATLAB runs them and shows the results. On this site, the editor works like a MATLAB script: Run goes through your lines from top to bottom."},
  {h:"Do some maths",p:"Type a calculation and MATLAB shows the answer. `+` and `-` add and subtract, `*` multiplies, `/` divides and `^` raises to a power.\n\nWhen you don't give the result a name, MATLAB stores it in a variable called `ans` (short for answer).",code:m`3 + 4
10 / 4
2 ^ 5`},
  {h:"Order of operations",p:"MATLAB follows the usual maths rules. Powers (`^`) happen first, then `*` and `/`, then `+` and `-`. Use round brackets to change the order.\n\n`2 + 3 * 4` is 14, but `(2 + 3) * 4` is 20.",code:m`2 + 3 * 4
(2 + 3) * 4`},
  {h:"Variables",p:"`x = 5` stores the number 5 under the name `x`. Read the `=` as \"store\" or \"becomes\", not \"equals\". Once a variable exists you can use it in later lines.\n\nIf you store something new in `x`, the old value is replaced. A variable computed from `x` earlier doesn't change: it was worked out when that line ran.",code:m`x = 5
y = x * 2
x = 100
y`},
  {h:"Semicolons hide output",p:"End a line with `;` and MATLAB still runs it, but doesn't show the result. Without the semicolon, it shows the variable's name and value. Most real code puts a semicolon on nearly every line and only shows what matters.",code:m`price = 12.50;
quantity = 4;
total = price * quantity`},
  {h:"Naming rules",p:"Names start with a letter, then letters, digits or underscores. No spaces, no dashes. `price_2` is fine, `2price` and `my price` aren't.\n\nCapitals matter: `Total` and `total` are two different variables. Pick names that say what the value is, like `price` rather than `p`, and avoid names of built-in functions like `sum` or `max`, which would hide them."},
  {h:"Comments",p:"Anything after a `%` on a line is a comment. MATLAB ignores it. Comments are notes for people reading the code, including future you.",code:m`% This line is ignored
speed = 30;   % metres per second`},
  {h:"Errors are clues",p:"Everyone hits errors all the time. MATLAB stops at the line with the problem and tells you what's wrong. Read the message and the line number first.\n\n- `Unrecognized function or variable 'x'` means MATLAB doesn't know that name. Usually a typo, a missing capital, or a variable used before it was created.\n- `Invalid expression` means MATLAB couldn't read the line. Look for a missing operator or bracket."},
  {h:"How this site works",p:"Run runs your code and shows three things: what it displays, any plots, and the workspace, which is every variable that exists afterwards (MATLAB shows the same in its Workspace panel). Check runs tests on your code.\n\nMost checks look at your variables, so the names have to match the problem exactly. This unit lines up with the Commands chapter of MATLAB Onramp, MathWorks' free intro course."}],
 takeaways:["MATLAB runs lines top to bottom.","= stores a value in a variable. Names are case-sensitive.","A semicolon at the end hides the result.","Powers first, then * and /, then + and -. Brackets change the order.","% starts a comment."],
 quick:[
  {q:"What is the value of x?",code:m`x = 3 + 4 * 2`,v:"x",a:"11",why:"Multiplication happens before addition: 4 * 2 is 8, then 3 + 8."},
  {q:"What is the value of x?",code:m`x = (3 + 4) * 2`,v:"x",a:"14",why:"The brackets go first: 3 + 4 is 7, then times 2."},
  {q:"What is the value of a?",code:m`a = 2 ^ 3`,v:"a",a:"8",why:"^ is a power: 2 × 2 × 2."},
  {q:"Which line stores 10 in a variable called total without displaying anything?",opts:["total = 10;","total = 10","10 = total;","Total = 10;"],a:0,why:"The name goes on the left, and the semicolon hides the output. Total with a capital T is a different variable."},
  {q:"What is x after these lines?",code:m`x = 5;
x = x + 1;`,v:"x",a:"6",why:"The right side is worked out first using the old x (5), then the result is stored back in x."},
  {q:"Which of these is a valid variable name?",opts:["2nd_price","my price","price_2","price-2"],a:2,why:"Names must start with a letter and can only contain letters, digits and underscores."},
  {q:"What is the value of b at the end?",code:m`a = 10;
b = a * 2;
a = 1;`,v:"b",a:"20",why:"b was worked out when its line ran, using a = 10. Changing a afterwards doesn't touch b."},
  {q:"What does this line do?",code:m`y = 7 % seven days`,opts:["Stores 7 in y and displays it","Stores 7 in y without displaying it","Causes an error because of the text","Stores the text seven days in y"],a:0,why:"Everything after % is a comment and is ignored. There's no semicolon, so the result is shown."},
  {q:"What is the value of x?",code:m`x = 9 / 3 - 1`,v:"x",a:"2",why:"Division first: 9 / 3 is 3, then minus 1."}],
 problems:[
  {id:"first-var",title:"Your first variable",brief:"Create a variable called `a` that holds the number 5.\n\nPress Run to see what MATLAB displays and how `a` appears in the workspace, then press Check.",starter:"% Write your code below this line\n",
   tests:[{eq:[["a","5"]]}],hints:["Variables are made with =. The name goes on the left, the value on the right.","a = 5"],solution:m`a = 5`},
  {id:"rect-area",title:"Area of a rectangle",brief:"Create `width` with the value 4 and `height` with the value 7. Then create `area`, worked out from those two variables (don't type 28).\n\nUsing variables means that if the width changes, you only change one line.",starter:"",
   tests:[{eq:[["width","4"],["height","7"],["area","28"]],src:[["area\\s*=.*\\b(width|height)\\b","Work out area from the variables, like area = width * height."]]}],
   hints:["Make each variable on its own line: width = 4;","area = width * height;"],solution:m`width = 4;
height = 7;
area = width * height;`},
  {id:"semicolons",title:"Hide the noise",brief:"This code shows every variable as it runs. Add semicolons so that only `total` is displayed.\n\nRun it before and after to see the difference.",
   starter:m`price = 12.50
quantity = 4
total = price * quantity
`,tests:[{out:"total =\n50",eq:[["total","50"]],label:"Only total is displayed"}],hints:["A semicolon at the end of a line hides that line's result.","Put ; after the first two lines only."],solution:m`price = 12.50;
quantity = 4;
total = price * quantity`},
  {id:"fix-names",title:"Fix the names",brief:"This code doesn't run. Press Run and read the error. Fix it so it creates `x2` with the value 10, `my_rate` with the value 0.5, and `result`, which is `x2` times `my_rate`.",
   starter:m`2x = 10;
my rate = 0.5;
result = 2x * my rate;
`,tests:[{eq:[["x2","10"],["my_rate","0.5"],["result","5"]]}],hints:["A name can't start with a digit, so 2x becomes x2.","A name can't contain a space. Use an underscore: my_rate. Then fix the last line to use the new names."],solution:m`x2 = 10;
my_rate = 0.5;
result = x2 * my_rate;`},
  {id:"avg-fix",title:"Fix the average",brief:"This is meant to work out the average of 70, 85 and 91, but the answer comes out far too big. Fix it so `avg` is right.",
   starter:m`avg = 70 + 85 + 91 / 3
`,tests:[{eq:[["avg","82"]]}],hints:["Division happens before addition, so only 91 is being divided by 3.","Put brackets around the three numbers being added."],solution:m`avg = (70 + 85 + 91) / 3`}]},

/* ======================================================================= 2 */
{n:2,ref:"Commands, Calling Functions",title:"Built-in functions",
 sections:[
  {h:"Functions do jobs for you",p:"MATLAB comes with thousands of functions. You call one by writing its name and putting its inputs in round brackets. `sqrt(16)` gives the square root of 16. The result can go straight into a variable: `r = sqrt(16)`.",code:m`r = sqrt(16)
a = abs(-7)`},
  {h:"Rounding",p:"- `round(x)` rounds to the nearest whole number (halves go away from zero, so `round(2.5)` is 3).\n- `floor(x)` rounds down, `ceil(x)` rounds up.\n- `round(x, 2)` rounds to 2 decimal places, handy for money.",code:m`round(2.567)
floor(2.567)
ceil(2.1)
round(2.567, 2)`},
  {h:"Remainders with mod",p:"`mod(a, b)` is what's left over after dividing a by b. `mod(17, 5)` is 2, because 17 is 3 fives plus 2. It's useful for checking even numbers (`mod(n, 2)` is 0 for even n) and for splitting minutes into hours and minutes.",code:m`mod(17, 5)
mod(10, 2)`},
  {h:"Constants and maths functions",p:"`pi` is built in. `exp(x)` is e to the power x, and `log(x)` is the natural log (base e). For base 10 use `log10`. Trig functions like `sin` and `cos` work in radians; `sind` and `cosd` take degrees.",code:m`pi
exp(1)
log(100)
log10(100)
sin(pi/2)
sind(90)`},
  {h:"Nesting",p:"A function call can go inside another. MATLAB works from the inside out: `sqrt(abs(-16))` first makes 16, then takes the square root."},
  {h:"What you see vs what's stored",p:"MATLAB normally shows 4 decimal places, but it stores about 16 significant digits. `format long` shows more of them, and `format short` switches back. `0.1 + 0.2` shows as 0.3000 but is really 0.30000000000000004, because computers store decimals in binary. That's normal, and why checks on this site allow tiny differences.",code:m`x = 0.1 + 0.2
format long
x
format short`},
  {h:"Getting help",p:"In MATLAB, `help round` prints a short description and `doc round` opens the full page with examples. On this site, `help round` works for common functions. Search engines are fine too: \"MATLAB round to 2 decimals\" finds the answer fast."}],
 takeaways:["Call a function with name(inputs). Several inputs are separated by commas.","round, floor, ceil and round(x, 2) for rounding.","mod(a, b) is the remainder.","log is the natural log. sin and cos use radians.","help name and doc name explain a function."],
 quick:[
  {q:"What is the value of x?",code:m`x = sqrt(81)`,v:"x",a:"9",why:"9 × 9 is 81."},
  {q:"What is the value of x?",code:m`x = round(2.5)`,v:"x",a:"3",why:"MATLAB rounds halves away from zero."},
  {q:"What is the value of x?",code:m`x = floor(7.9)`,v:"x",a:"7",why:"floor always rounds down."},
  {q:"What is the value of x?",code:m`x = mod(17, 5)`,v:"x",a:"2",why:"17 is three 5s (15) with 2 left over."},
  {q:"What is the value of x?",code:m`x = abs(-4) + 1`,v:"x",a:"5",why:"abs(-4) is 4, then add 1."},
  {q:"What does log(100) give?",opts:["2","About 4.6052, because log is the natural log","10","An error"],a:1,why:"log is base e. log10(100) would give 2."},
  {q:"What is the value of x?",code:m`x = round(3.14159, 2)`,v:"x",a:"3.14",why:"The second input is the number of decimal places."},
  {q:"Why does sin(90) give 0.8940 rather than 1?",opts:["sin works in radians, so 90 means 90 radians","It's a rounding error","sin only works on small numbers","MATLAB's sin is approximate"],a:0,why:"Use sin(pi/2) or sind(90) to get 1."},
  {q:"What is the value of x?",code:m`x = ceil(-2.5)`,v:"x",a:"-2",why:"ceil rounds up, towards positive infinity, and -2 is above -2.5."}],
 problems:[
  {id:"circle",title:"Area of a circle",brief:"A variable `r` (a radius) is already in your workspace. Create `area`, the area of a circle with that radius: π × r².\n\nUse `pi` for π and `^` for the power. The checks also try other radiuses, so use `r` rather than typing its value.",
   pre:"r = 3;",starter:"% r is already in your workspace. Press Run to see it.\n",
   tests:[{eq:[["area","pi*r^2"]]},{pre:"r = 2.5;",eq:[["area","pi*r^2"]]}],hints:["pi is built in, and r^2 squares r.","area = pi * r^2;"],solution:m`area = pi * r^2;`},
  {id:"interest",title:"Compound interest",brief:"You invest `P` at an interest rate of `rate` per year (0.05 means 5%) for `years` years. Interest is added once a year, so the money grows to\n\n```\nP × (1 + rate)^years\n```\n\nCreate `fv` (future value) with that amount rounded to 2 decimal places. All three variables are already in your workspace.",
   pre:"P = 1000;\nrate = 0.05;\nyears = 10;",starter:"% P, rate and years are already in your workspace.\n",
   tests:[{eq:[["fv","round(P*(1+rate)^years, 2)"]]},{pre:"P = 250;\nrate = 0.07;\nyears = 3;",eq:[["fv","round(P*(1+rate)^years, 2)"]]}],
   hints:["Work out P * (1 + rate)^years first. The brackets matter.","Wrap it in round(..., 2) to get 2 decimal places."],solution:m`fv = round(P * (1 + rate)^years, 2);`},
  {id:"hypot",title:"Hypotenuse",brief:"`a` and `b` are the two short sides of a right-angled triangle. Create `c`, the long side, using Pythagoras: c = √(a² + b²).",
   pre:"a = 3;\nb = 4;",starter:"% a and b are already in your workspace.\n",
   tests:[{eq:[["c","5"]]},{pre:"a = 5;\nb = 12;",eq:[["c","13"]]},{pre:"a = 1;\nb = 1;",eq:[["c","sqrt(2)"]]}],hints:["sqrt(...) takes a square root.","c = sqrt(a^2 + b^2);"],solution:m`c = sqrt(a^2 + b^2);`},
  {id:"minutes",title:"Minutes to hours",brief:"`mins` is a number of minutes. Split it into whole `hours` and the minutes `left` over. 135 minutes is 2 hours and 15 minutes.\n\nYou'll need `floor` and `mod`.",
   pre:"mins = 135;",starter:"",
   tests:[{eq:[["hours","2"],["left","15"]]},{pre:"mins = 59;",eq:[["hours","0"],["left","59"]]},{pre:"mins = 600;",eq:[["hours","10"],["left","0"]]}],
   hints:["mins / 60 gives hours with a decimal part. floor drops the decimals.","mod(mins, 60) is what's left after taking out whole hours."],solution:m`hours = floor(mins / 60);
left = mod(mins, 60);`},
  {id:"nearest5",title:"Round to the nearest 5",brief:"Prices are often rounded to the nearest 5. Create `r`, which is `x` rounded to the nearest multiple of 5. 17 becomes 15 and 18 becomes 20.\n\nThere's no special function for this, but `round` plus a bit of maths does it.",
   pre:"x = 17;",starter:"",
   tests:[{eq:[["r","15"]]},{pre:"x = 18;",eq:[["r","20"]]},{pre:"x = 22.5;",eq:[["r","25"]]},{pre:"x = 3;",eq:[["r","5"]]}],
   hints:["Dividing by 5 turns the problem into rounding to the nearest whole number.","Divide by 5, round, then multiply by 5 again."],solution:m`r = round(x / 5) * 5;`}]},

/* ======================================================================= 3 */
{n:3,ref:"Vectors and Matrices",title:"Vectors: lists of numbers",
 sections:[
  {h:"Arrays are MATLAB's superpower",p:"So far every variable held one number. In MATLAB a variable can hold a whole list of numbers, called an array. A one-row or one-column array is a vector. Most of MATLAB is built around doing the same thing to every number in an array at once."},
  {h:"Row vectors",p:"Put numbers in square brackets, separated by spaces or commas. `[4 8 15]` and `[4, 8, 15]` are the same 1-by-3 row vector.",code:m`v = [4 8 15 16 23 42]`},
  {h:"Column vectors",p:"Semicolons inside the brackets start a new row, so `[1; 2; 3]` is a 3-by-1 column. The apostrophe `'` transposes, turning a row into a column and back.",code:m`c = [1; 2; 3]
r = c'`},
  {h:"Ranges with the colon",p:"`start:stop` counts up in steps of 1. `start:step:stop` uses your own step, which can be negative or a decimal. The range stops at or before `stop`, so `0:5:12` is `[0 5 10]`.",code:m`a = 1:5
b = 0:2:10
c = 10:-3:1
d = 0:0.25:1`},
  {h:"linspace when you know how many",p:"`linspace(a, b, n)` gives exactly n evenly spaced numbers from a to b, including both ends. Use it when you care about how many points there are, like 100 points for a smooth plot.",code:m`t = linspace(0, 1, 5)`},
  {h:"How big is it?",p:"`numel(v)` counts the elements. `size(v)` gives [rows cols]: a row of 6 numbers is `[1 6]`, a column of 3 is `[3 1]`. `length(v)` gives the longer of the two. `[]` is an empty array with nothing in it.",code:m`v = [4 8 15 16];
numel(v)
size(v)
size(v')`}],
 takeaways:["[1 2 3] is a row, [1; 2; 3] is a column.","' transposes (row ↔ column).","a:b counts by 1, a:step:b uses your own step.","linspace(a, b, n) gives n points from a to b.","numel counts elements; size gives [rows cols]."],
 quick:[
  {q:"What is the value of x?",code:m`x = 2:2:8`,v:"x",a:"[2 4 6 8]",why:"Start at 2, go up in steps of 2, stop at 8."},
  {q:"What is the value of n?",code:m`n = numel(1:10)`,v:"n",a:"10",why:"1:10 has ten numbers."},
  {q:"Which of these makes a column vector?",opts:["[1 2 3]","[1; 2; 3]","[1, 2, 3]","1:3"],a:1,why:"Semicolons start new rows. The others are all rows."},
  {q:"What is the value of x?",code:m`x = 5:-1:1`,v:"x",a:"[5 4 3 2 1]",why:"A negative step counts down."},
  {q:"What is the value of x?",code:m`x = linspace(0, 10, 3)`,v:"x",a:"[0 5 10]",why:"Three evenly spaced points from 0 to 10, ends included."},
  {q:"What is the value of s?",code:m`x = [1 2 3]';
s = size(x);`,v:"s",a:"[3 1]",why:"The ' turns the row into a column: 3 rows, 1 column."},
  {q:"How many elements does 1:0.5:3 have?",opts:["4","5","6","3"],a:1,why:"1, 1.5, 2, 2.5, 3."},
  {q:"What is the value of x?",code:m`x = 10:5:24`,v:"x",a:"[10 15 20]",why:"The next step would be 25, which is past 24, so it stops at 20."},
  {q:"What is the value of n?",code:m`n = numel([])`,v:"n",a:"0",why:"[] is empty."}],
 problems:[
  {id:"first-vector",title:"Your first vector",brief:"Create a row vector `v` containing 4, 8, 15, 16, 23 and 42, in that order.",starter:"",
   tests:[{eq:[["v","[4 8 15 16 23 42]"]]}],hints:["Square brackets, with spaces or commas between numbers.","v = [4 8 15 16 23 42];"],solution:m`v = [4 8 15 16 23 42];`},
  {id:"evens",title:"Even numbers",brief:"Create `evens`, the even numbers from 2 to 20: `[2 4 6 ... 20]`. Use the colon operator rather than typing them all.",starter:"",
   tests:[{eq:[["evens","2:2:20"]],src:[[":","Use the colon operator, like start:step:stop."]]}],hints:["The form is start:step:stop.","evens = 2:2:20;"],solution:m`evens = 2:2:20;`},
  {id:"countdown",title:"Countdown",brief:"Create `countdown`, the whole numbers from 10 down to 0: `[10 9 8 ... 0]`.",starter:"",
   tests:[{eq:[["countdown","10:-1:0"]]}],hints:["A negative step counts down.","countdown = 10:-1:0;"],solution:m`countdown = 10:-1:0;`},
  {id:"price-column",title:"A column of prices",brief:"Create a column vector `prices` holding 9.99, 4.50 and 12.00, top to bottom. Then create `n`, the number of prices, using a function rather than typing 3.",starter:"",
   tests:[{eq:[["prices","[9.99; 4.5; 12]"],["n","3"]],src:[["n\\s*=\\s*(numel|length)\\s*\\(","Use numel(prices) or length(prices) to count them."]]}],
   hints:["Semicolons between the numbers make a column.","numel(prices) counts the elements."],solution:m`prices = [9.99; 4.50; 12.00];
n = numel(prices);`},
  {id:"spaced",title:"Evenly spaced",brief:"Create `t`, 11 evenly spaced numbers from 0 to 1 (0, 0.1, 0.2, ... 1). Then create `tcol`, the same numbers as a column vector.",starter:"",
   tests:[{eq:[["t","linspace(0,1,11)"],["tcol","linspace(0,1,11)'"]]}],hints:["linspace(start, stop, howMany).","The apostrophe ' transposes a row into a column."],solution:m`t = linspace(0, 1, 11);
tcol = t';`}]},

/* ======================================================================= 4 */
{n:4,ref:"Indexing into and Modifying Arrays",title:"Getting at elements",
 sections:[
  {h:"Counting starts at 1",p:"`x(3)` is the third element of `x`. MATLAB counts from 1, so the first element is `x(1)`. There's no `x(0)`: asking for it gives an error.",code:m`x = [10 20 30 40 50];
x(1)
x(3)`},
  {h:"end means the last one",p:"Inside the brackets, `end` stands for the last position. `x(end)` is the last element and `x(end-1)` the one before it. Using `end` means your code works whatever the length."},
  {h:"Several at once",p:"Put a vector inside the brackets to get several elements. `x([1 3])` gets the first and third. A range works too: `x(2:4)` gets elements 2, 3 and 4. `x(end:-1:1)` gets them all backwards, and `x(1:2:end)` gets every other one.",code:m`x = [10 20 30 40 50];
x([1 3])
x(2:4)
x(end:-1:1)
x(1:2:end)`},
  {h:"Changing elements",p:"Put an index on the left of `=` to change that element: `x(2) = 99`. Give a range and a single value to change several at once: `x(1:3) = 0`.",code:m`x = [10 20 30 40 50];
x(2) = 99`},
  {h:"Growing and shrinking",p:"Assigning past the end makes the vector longer, filling any gap with zeros. `x(end+1) = 7` adds one element on the end. Assigning empty brackets deletes: `x(2) = []` removes the second element and closes the gap.",code:m`x = [1 2 3];
x(end+1) = 7
x(6) = 9
x(2) = []`},
  {h:"Index errors",p:"`Index exceeds the number of array elements` means you asked for a position past the end. `Array indices must be positive integers or logical values` usually means an index of 0, a negative number, or a decimal."}],
 takeaways:["x(1) is the first element; there is no x(0).","x(end) is the last; x(end-1) the second to last.","x([1 3]) and x(2:4) get several elements.","x(i) = value changes an element; x(i) = [] deletes it.","x(end+1) = value adds to the end."],
 quick:[
  {q:"What is the value of y?",code:m`x = [10 20 30 40];
y = x(2);`,v:"y",a:"20",why:"Position 2 holds 20."},
  {q:"What is the value of y?",code:m`x = [10 20 30 40];
y = x(end);`,v:"y",a:"40",why:"end is the last position."},
  {q:"What is the value of y?",code:m`x = [10 20 30 40];
y = x(2:3);`,v:"y",a:"[20 30]",why:"Positions 2 and 3."},
  {q:"What is x after this?",code:m`x = [5 6 7];
x(2) = 0;`,v:"x",a:"[5 0 7]",why:"Only position 2 changes."},
  {q:"What is x after this?",code:m`x = [5 6 7];
x(5) = 1;`,v:"x",a:"[5 6 7 0 1]",why:"Assigning past the end grows the vector, filling the gap with 0."},
  {q:"What is x after this?",code:m`x = [5 6 7 8];
x(1) = [];`,v:"x",a:"[6 7 8]",why:"Assigning [] deletes that element."},
  {q:"What happens here?",code:m`x = [1 2 3];
y = x(0);`,opts:["An error: indices must be positive integers","y is 1","y is 0","y is empty"],a:0,why:"MATLAB counts from 1. x(1) is the first element."},
  {q:"What is the value of y?",code:m`x = 1:10;
y = x(end-2:end);`,v:"y",a:"[8 9 10]",why:"end is 10, so end-2:end is 8:10."},
  {q:"What is the value of y?",code:m`x = [4 8 15];
y = x([3 1]);`,v:"y",a:"[15 4]",why:"Position 3, then position 1."}],
 problems:[
  {id:"first-last",title:"First and last",brief:"A vector `data` is in your workspace. Create `first`, its first element, and `last`, its last element.\n\nThe checks use vectors of different lengths, so use `end` rather than a fixed position.",
   pre:"data = [7 3 9 4 1];",starter:"% data is already in your workspace.\n",
   tests:[{eq:[["first","data(1)"],["last","data(end)"]]},{pre:"data = [5 8];",eq:[["first","5"],["last","8"]]},{pre:"data = [12 4 6 9 3 2 11];",eq:[["first","12"],["last","11"]]}],
   hints:["The first element is data(1).","The last is data(end)."],solution:m`first = data(1);
last = data(end);`},
  {id:"reverse",title:"Backwards",brief:"Create `rev`, the elements of `data` in reverse order. `[1 2 3]` becomes `[3 2 1]`.",pre:"data = [3 1 4 1 5 9];",starter:"",
   tests:[{eq:[["rev","data(end:-1:1)"]]},{pre:"data = [10 20];",eq:[["rev","[20 10]"]]}],hints:["A range can count down: end:-1:1.","rev = data(end:-1:1);"],solution:m`rev = data(end:-1:1);`},
  {id:"swap-ends",title:"Swap the ends",brief:"Change `data` itself so its first and last elements swap places. Everything in between stays put.\n\n`[1 2 3 4]` becomes `[4 2 3 1]`.",pre:"data = [1 2 3 4];",starter:"",
   tests:[{eq:[["data","[4 2 3 1]"]]},{pre:"data = [9 5];",eq:[["data","[5 9]"]]},{pre:"data = [7 8 6 3 0];",eq:[["data","[0 8 6 3 7]"]]}],
   hints:["If you write data(1) = data(end) first, the old first value is lost. Save it in another variable first.","tmp = data(1); data(1) = data(end); data(end) = tmp;"],solution:m`tmp = data(1);
data(1) = data(end);
data(end) = tmp;`},
  {id:"remove-third",title:"Remove a bad reading",brief:"A sensor glitched, and the third value in `readings` is junk. Delete it, so `readings` keeps everything else in order.",pre:"readings = [20.1 19.8 -999 20.4 20.0];",starter:"",
   tests:[{eq:[["readings","[20.1 19.8 20.4 20.0]"]]},{pre:"readings = [1 2 3];",eq:[["readings","[1 2]"]]}],hints:["Assigning [] to an element deletes it.","readings(3) = [];"],solution:m`readings(3) = [];`},
  {id:"every-other",title:"Every other one",brief:"Create `odds`, the elements of `data` at positions 1, 3, 5 and so on.",pre:"data = [10 11 12 13 14 15 16];",starter:"",
   tests:[{eq:[["odds","data(1:2:end)"]]},{pre:"data = [4 5];",eq:[["odds","4"]]}],hints:["The positions you want are 1:2:end.","odds = data(1:2:end);"],solution:m`odds = data(1:2:end);`},
  {id:"append",title:"Add to the end",brief:"Add the value 99 to the end of `data`, then create `n`, the new number of elements.",pre:"data = [3 6 9];",starter:"",
   tests:[{eq:[["data","[3 6 9 99]"],["n","4"]]},{pre:"data = [1];",eq:[["data","[1 99]"],["n","2"]]}],hints:["data(end+1) = ... puts a value one past the end.","numel(data) counts the elements."],solution:m`data(end+1) = 99;
n = numel(data);`}]},

/* ======================================================================= 5 */
{n:5,ref:"Vectors and Matrices, Indexing",title:"Matrices: tables of numbers",
 sections:[
  {h:"Rows and columns",p:"A matrix is a grid of numbers. Spaces (or commas) separate columns and semicolons separate rows, so `[1 2 3; 4 5 6]` has 2 rows and 3 columns. Every row must have the same number of elements.",code:m`A = [1 2 3; 4 5 6]
size(A)`},
  {h:"Ready-made matrices",p:"`zeros(r, c)` and `ones(r, c)` make r-by-c matrices of zeros or ones. `zeros(3)` is 3-by-3. `eye(3)` is the identity matrix. `rand(r, c)` fills one with random numbers between 0 and 1, and `randi(10, r, c)` with random whole numbers from 1 to 10.",code:m`Z = zeros(2, 3)
I = eye(3)
R = randi(6, 2, 4)`},
  {h:"One element: A(row, col)",p:"`A(2, 3)` is the element in row 2, column 3. Row first, then column. `end` works in both places: `A(end, end)` is the bottom-right corner.",code:m`A = [1 2 3; 4 5 6];
A(2, 3)
A(end, 1)`},
  {h:"Whole rows and columns",p:"A colon on its own means \"all of them\". `A(2, :)` is the whole of row 2. `A(:, 3)` is the whole of column 3. Ranges pick out blocks: `A(1:2, 2:3)`.",code:m`A = magic(4)
A(2, :)
A(:, 3)
A(1:2, 2:3)`},
  {h:"Changing a matrix",p:"Assign to an element, row or column. `A(1, :) = 0` zeroes the first row. `A(:, 2) = []` deletes the second column.",code:m`A = magic(3);
A(1, :) = 0
A(:, 2) = []`},
  {h:"Joining matrices",p:"Square brackets join arrays. `[A B]` puts them side by side (they need the same number of rows). `[A; B]` stacks them (same number of columns). If the sizes don't fit you get \"Dimensions of arrays being concatenated are not consistent.\""},
  {h:"magic and A(:)",p:"`magic(n)` makes a square whose rows, columns and diagonals all add up to the same number. It's handy for practice data. `A(:)` lists every element as one column, going down the first column, then the second, and so on."}],
 takeaways:["[1 2; 3 4]: spaces between columns, semicolons between rows.","zeros, ones, eye, rand and randi build matrices.","A(r, c) is one element: row first.","A(2, :) is a whole row, A(:, 3) a whole column.","[A B] side by side, [A; B] stacked."],
 quick:[
  {q:"What is the value of s?",code:m`A = [1 2 3; 4 5 6];
s = size(A);`,v:"s",a:"[2 3]",why:"2 rows, 3 columns."},
  {q:"What is the value of x?",code:m`A = [1 2 3; 4 5 6];
x = A(2, 3);`,v:"x",a:"6",why:"Row 2, column 3."},
  {q:"What is the value of r?",code:m`A = [1 2 3; 4 5 6];
r = A(1, :);`,v:"r",a:"[1 2 3]",why:"All of row 1."},
  {q:"What is the value of c?",code:m`A = [1 2 3; 4 5 6];
c = A(:, 2);`,v:"c",a:"[2; 5]",why:"All of column 2, as a column."},
  {q:"What is the value of n?",code:m`A = zeros(2, 3);
n = numel(A);`,v:"n",a:"6",why:"2 × 3 = 6 elements."},
  {q:"What happens here?",code:m`A = [1 2; 3 4 5];`,opts:["An error: the rows have different lengths","The short row is padded with a zero","A becomes a 1-by-5 vector","The 5 is dropped"],a:0,why:"Every row of a matrix must have the same number of elements."},
  {q:"What is the value of B?",code:m`A = [1 2; 3 4];
B = A';`,v:"B",a:"[1 3; 2 4]",why:"Transposing turns rows into columns."},
  {q:"What is A after this?",code:m`A = [1 2; 3 4];
A(:, 1) = [];`,v:"A",a:"[2; 4]",why:"The first column is deleted, leaving the second column."},
  {q:"What is the value of x?",code:m`A = [1 2 3; 4 5 6; 7 8 9];
x = A(end, 2);`,v:"x",a:"8",why:"The last row, second column."}],
 problems:[
  {id:"build-matrix",title:"Build a matrix",brief:"Create `M`:\n\n```\n1 2 3\n4 5 6\n7 8 9\n```\n\nThen create `mid`, the element in the middle, by indexing into `M`.",starter:"",
   tests:[{eq:[["M","[1 2 3; 4 5 6; 7 8 9]"],["mid","5"]],src:[["mid\\s*=\\s*M\\s*\\(","Get mid by indexing M, like M(2, 2)."]]}],hints:["Semicolons separate the rows: M = [1 2 3; 4 5 6; 7 8 9];","The middle is row 2, column 2."],solution:m`M = [1 2 3; 4 5 6; 7 8 9];
mid = M(2, 2);`},
  {id:"row-col",title:"Rows and columns",brief:"`scores` has one row per student and one column per test. Create `student2`, all of the second student's scores, and `test3`, every student's score on the third test.",
   pre:"scores = [70 82 91; 65 74 88; 90 85 79; 55 60 72];",starter:"",
   tests:[{eq:[["student2","scores(2,:)"],["test3","scores(:,3)"]]},{pre:"scores = [1 2 3; 4 5 6];",eq:[["student2","[4 5 6]"],["test3","[3; 6]"]]}],
   hints:["A colon on its own means all rows or all columns.","student2 = scores(2, :); test3 = scores(:, 3);"],solution:m`student2 = scores(2, :);
test3 = scores(:, 3);`},
  {id:"corners",title:"The four corners",brief:"Create `corners`, a row vector of the four corners of `A` in this order: top-left, top-right, bottom-left, bottom-right.\n\nThe checks use matrices of different sizes, so use `end`.",
   pre:"A = magic(4);",starter:"",
   tests:[{eq:[["corners","[16 13 4 1]"]]},{pre:"A = [1 2 3; 4 5 6];",eq:[["corners","[1 3 4 6]"]]}],
   hints:["The top-right corner is A(1, end).","Put the four corners in square brackets: [A(1,1) A(1,end) A(end,1) A(end,end)]."],solution:m`corners = [A(1,1) A(1,end) A(end,1) A(end,end)];`},
  {id:"zero-column",title:"Zero a column",brief:"Set every value in the second column of `A` to 0. Everything else stays the same.",pre:"A = magic(3);",starter:"",
   tests:[{eq:[["A","[8 0 6; 3 0 7; 4 0 2]"]]},{pre:"A = ones(2, 4) * 5;",eq:[["A","[5 0 5 5; 5 0 5 5]"]]}],hints:["A(:, 2) is the whole second column.","Assigning one number to it sets every element: A(:, 2) = 0;"],solution:m`A(:, 2) = 0;`},
  {id:"board",title:"Game board",brief:"Create `board`, a 3-by-4 matrix of zeros, then put a 1 in row 2, column 3.",starter:"",
   tests:[{eq:[["board","[0 0 0 0; 0 0 1 0; 0 0 0 0]"]]}],hints:["zeros(rows, cols) makes the empty board.","board(2, 3) = 1;"],solution:m`board = zeros(3, 4);
board(2, 3) = 1;`},
  {id:"stack",title:"Stack and join",brief:"`a` and `b` are row vectors of the same length. Create `both`, with `a` on top of `b`, and `side`, with `b` joined on after `a` in one long row.",
   pre:"a = [1 2 3];\nb = [4 5 6];",starter:"",
   tests:[{eq:[["both","[1 2 3; 4 5 6]"],["side","[1 2 3 4 5 6]"]]},{pre:"a = [9 8];\nb = [7 6];",eq:[["both","[9 8; 7 6]"],["side","[9 8 7 6]"]]}],
   hints:["A semicolon inside square brackets stacks.","both = [a; b]; side = [a b];"],solution:m`both = [a; b];
side = [a b];`}]},

/* ======================================================================= 6 */
{n:6,ref:"Array Calculations",title:"Maths on whole arrays",
 sections:[
  {h:"One number with an array",p:"Combine an array with a single number and MATLAB applies it to every element. `prices * 1.2` adds 20% to every price at once, with no loop needed.",code:m`prices = [10 20 35];
prices * 1.2
prices - 5`},
  {h:"Two arrays, element by element",p:"`+` and `-` between two arrays of the same size work element by element: first with first, second with second.\n\nFor multiplying, dividing and powers element by element, put a dot in front: `.*`, `./` and `.^`. `[1 2 3] .* [4 5 6]` is `[4 10 18]`.",code:m`a = [1 2 3];
b = [4 5 6];
a + b
a .* b
a .^ 2`},
  {h:"Why the dot?",p:"Without the dot, `*`, `/` and `^` mean matrix maths from linear algebra. `[1 2 3] * [4 5 6]` gives an error about \"incorrect dimensions for matrix multiplication\". If you meant element by element, the fix is almost always to add the dot.\n\nMatrix multiplication is useful too. You'll use it later to value a portfolio."},
  {h:"Functions work element by element too",p:"`sqrt(x)`, `round(x)`, `abs(x)` and most maths functions work on each element of an array and give back an array the same size.",code:m`x = [4 9 16];
sqrt(x)`},
  {h:"Summarising an array",p:"These turn an array into a single number (for a vector):\n\n- `sum(x)` total, `prod(x)` product\n- `mean(x)` average, `median(x)` middle value\n- `max(x)`, `min(x)` largest and smallest\n\n`cumsum(x)` gives the running total and `diff(x)` the change between neighbours, `[x(2)-x(1), x(3)-x(2), ...]`.",code:m`x = [3 7 2 8];
sum(x)
mean(x)
max(x)
cumsum(x)
diff(x)`}],
 takeaways:["Array with a single number: applies to every element.","Use .* ./ .^ for element-by-element maths between arrays.","* / ^ without the dot are matrix operations.","sum, mean, max, min, cumsum, diff summarise arrays."],
 quick:[
  {q:"What is the value of x?",code:m`x = [1 2 3] * 2;`,v:"x",a:"[2 4 6]",why:"A single number multiplies every element."},
  {q:"What is the value of x?",code:m`x = [1 2 3] .* [4 5 6];`,v:"x",a:"[4 10 18]",why:"First times first, second times second, third times third."},
  {q:"What is the value of x?",code:m`x = [1 2 3] .^ 2;`,v:"x",a:"[1 4 9]",why:".^ squares each element."},
  {q:"What happens here?",code:m`x = [1 2 3] * [4 5 6];`,opts:["An error about incorrect dimensions for matrix multiplication","x is [4 10 18]","x is 32","x is [5 7 9]"],a:0,why:"* without a dot is matrix multiplication. Use .* for element by element."},
  {q:"What is the value of s?",code:m`s = sum([4 5 6]);`,v:"s",a:"15",why:"4 + 5 + 6."},
  {q:"What is the value of m?",code:m`m = mean([2 4 9]);`,v:"m",a:"5",why:"(2 + 4 + 9) / 3."},
  {q:"What is the value of c?",code:m`c = cumsum([1 2 3]);`,v:"c",a:"[1 3 6]",why:"Running total: 1, then 1+2, then 1+2+3."},
  {q:"What is the value of x?",code:m`x = [10 20] ./ [2 5];`,v:"x",a:"[5 4]",why:"10/2 and 20/5."},
  {q:"What is the value of d?",code:m`d = diff([2 5 11]);`,v:"d",a:"[3 6]",why:"5-2 and 11-5. One fewer element than the input."}],
 problems:[
  {id:"add-tax",title:"Add 20% tax",brief:"Create `with_tax`: every price in `prices` with 20% added, rounded to 2 decimal places. Do it for all the prices at once, without a loop.",pre:"prices = [10 4.99 25.50];",starter:"",
   tests:[{eq:[["with_tax","round(prices*1.2, 2)"]]},{pre:"prices = [100 0.5];",eq:[["with_tax","[120 0.6]"]]}],hints:["Adding 20% is the same as multiplying by 1.2.","with_tax = round(prices * 1.2, 2);"],solution:m`with_tax = round(prices * 1.2, 2);`},
  {id:"total-cost",title:"Shopping bill",brief:"`prices` holds the price of each item and `qty` how many of each you're buying. Create `cost`, the cost of each line (price × quantity), and `total`, the whole bill.",
   pre:"prices = [2.50 0.99 4.00];\nqty = [3 10 2];",starter:"",
   tests:[{eq:[["cost","prices .* qty"],["total","sum(prices .* qty)"]]},{pre:"prices = [1 2];\nqty = [5 5];",eq:[["cost","[5 10]"],["total","15"]]}],
   hints:["Multiplying element by element needs .*","total is the sum of cost."],solution:m`cost = prices .* qty;
total = sum(cost);`},
  {id:"score-stats",title:"Score summary",brief:"Create `avg`, `best` and `worst`: the average, highest and lowest of `scores`.",pre:"scores = [72 88 95 61 79];",starter:"",
   tests:[{eq:[["avg","79"],["best","95"],["worst","61"]]},{pre:"scores = [50 50 80];",eq:[["avg","60"],["best","80"],["worst","50"]]}],hints:["mean, max and min each take the whole vector."],solution:m`avg = mean(scores);
best = max(scores);
worst = min(scores);`},
  {id:"returns",title:"Daily returns",brief:"`p` is a share price at the end of each day. A daily return is the day's change as a fraction of the day before:\n\n```\n(today - yesterday) / yesterday\n```\n\nCreate `ret`, the returns for every day after the first (so one fewer than the prices), and `avg_ret`, their average.\n\n`diff(p)` gives all the changes at once, and `p(1:end-1)` is every \"yesterday\" price.",
   pre:"p = [100 102 99 105 104];",starter:"",
   tests:[{eq:[["ret","diff(p) ./ p(1:end-1)"],["avg_ret","mean(diff(p) ./ p(1:end-1))"]]},{pre:"p = [50 55 44];",eq:[["ret","[0.1 -0.2]"],["avg_ret","-0.05"]]}],
   hints:["Divide element by element with ./","ret = diff(p) ./ p(1:end-1);"],solution:m`ret = diff(p) ./ p(1:end-1);
avg_ret = mean(ret);`},
  {id:"distance",title:"Distance from the origin",brief:"`x` and `y` hold the coordinates of some points: the first point is (x(1), y(1)) and so on. Create `d`, each point's distance from (0, 0), which is √(x² + y²), for all points at once.",
   pre:"x = [3 0 -6];\ny = [4 5 8];",starter:"",
   tests:[{eq:[["d","[5 5 10]"]]},{pre:"x = [1 2];\ny = [1 0];",eq:[["d","[sqrt(2) 2]"]]}],hints:["Square each element with .^2","d = sqrt(x.^2 + y.^2);"],solution:m`d = sqrt(x.^2 + y.^2);`},
  {id:"balance",title:"Running balance",brief:"An account starts with `start`. `moves` lists deposits (positive) and withdrawals (negative) in order. Create `balance`, the balance after each move, as a vector the same length as `moves`.",
   pre:"start = 100;\nmoves = [20 -15 50 -30];",starter:"",
   tests:[{eq:[["balance","[120 105 155 125]"]]},{pre:"start = 0;\nmoves = [5 5 5];",eq:[["balance","[5 10 15]"]]}],hints:["cumsum gives the running total of the moves.","Add start to every element: balance = start + cumsum(moves);"],solution:m`balance = start + cumsum(moves);`}]},

/* ======================================================================= 7 */
{n:7,ref:"Calling Functions, Obtaining Help",title:"Functions with more inputs and outputs",
 sections:[
  {h:"Getting two answers back",p:"Some functions can return more than one result. Put the names in square brackets on the left. `[m, i] = max(x)` gives the largest value `m` and its position `i`.",code:m`x = [4 9 2 9];
[m, i] = max(x)`},
  {h:"size, sort and friends",p:"- `[r, c] = size(A)` stores rows and columns separately.\n- `[s, order] = sort(x)` gives the sorted values and where each one came from. `x(order)` is the same as `s`, and you can use `order` to sort another list the same way.\n- `[m, i] = min(x)` works like max.",code:m`[r, c] = size(zeros(3, 5))
[s, order] = sort([30 10 20])`},
  {h:"Skipping an output with ~",p:"If you only want the second output, put `~` in place of the first: `[~, i] = max(x)` keeps just the position."},
  {h:"Extra inputs change the behaviour",p:"Many functions take optional inputs:\n\n- `sort(x, 'descend')` sorts from largest to smallest.\n- `sum(A, 2)` adds across each row instead of down each column. `sum(A, 'all')` adds everything.\n- `max(A, [], 2)` finds each row's maximum. The `[]` fills the second input's place.\n- `round(x, 2)` rounds to 2 decimals.",code:m`A = [1 5; 7 2];
sum(A)
sum(A, 2)
sum(A, 'all')
max(A, [], 2)`},
  {h:"Reading the documentation",p:"Each MATLAB help page starts with the ways you can call the function, such as `M = max(A)`, `M = max(A, [], dim)` and `[M, I] = max(___)`. The bits in square brackets on the left are the outputs you can ask for. Type `help max` here, or `doc max` in MATLAB, to see them."}],
 takeaways:["[a, b] = f(x) collects several outputs.","[m, i] = max(x) gives the value and its position.","~ skips an output you don't need.","sum(A, 2) works across rows; sum(A, 'all') sums everything.","sort(x, 'descend') sorts largest first."],
 quick:[
  {q:"What is the value of i?",code:m`[m, i] = max([4 9 2]);`,v:"i",a:"2",why:"The largest value, 9, is in position 2."},
  {q:"What is the value of c?",code:m`[r, c] = size(zeros(3, 5));`,v:"c",a:"5",why:"The second output of size is the number of columns."},
  {q:"What is the value of s?",code:m`s = sort([3 1 2], 'descend');`,v:"s",a:"[3 2 1]",why:"Largest first."},
  {q:"What is the value of s?",code:m`A = [1 2; 3 4];
s = sum(A, 2);`,v:"s",a:"[3; 7]",why:"Dimension 2 adds across each row, giving a column."},
  {q:"What is the value of s?",code:m`A = [1 2; 3 4];
s = sum(A);`,v:"s",a:"[4 6]",why:"With no second input, sum adds down each column."},
  {q:"What is the value of idx?",code:m`[~, idx] = sort([30 10 20]);`,v:"idx",a:"[2 3 1]",why:"Sorted order is 10 (from position 2), 20 (position 3), 30 (position 1)."},
  {q:"What does [~, i] = min(x) store?",opts:["Only the position of the smallest value, in i","Only the smallest value, in i","Both, in i","Nothing, it's an error"],a:0,why:"~ throws away the first output (the value) and keeps the second (the position)."},
  {q:"What is the value of x?",code:m`x = max([1 8 3], 5);`,v:"x",a:"[5 8 5]",why:"With two inputs, max compares element by element: the larger of each pair."}],
 problems:[
  {id:"best-day",title:"Best day",brief:"`sales` holds one number per day. Create `top`, the highest sales figure, and `day`, the day it happened (its position). If there's a tie, use the first one, which is what `max` does anyway.",
   pre:"sales = [120 340 210 340 90];",starter:"",
   tests:[{eq:[["top","340"],["day","2"]]},{pre:"sales = [5 1 8];",eq:[["top","8"],["day","3"]]}],hints:["max can give two outputs.","[top, day] = max(sales);"],solution:m`[top, day] = max(sales);`},
  {id:"rank",title:"Leaderboard",brief:"`ids` holds player IDs and `scores` holds each player's score, in the same order. Create `ranked`: the IDs ordered from highest score to lowest. Tied players keep their original order (sort does this for you).",
   pre:"ids = [101 102 103 104];\nscores = [55 92 78 92];",starter:"",
   tests:[{eq:[["ranked","[102 104 103 101]"]]},{pre:"ids = [7 8 9];\nscores = [1 3 2];",eq:[["ranked","[8 9 7]"]]}],
   hints:["The second output of sort says where each sorted value came from.","[~, order] = sort(scores, 'descend'); then use order to index into ids."],solution:m`[~, order] = sort(scores, 'descend');
ranked = ids(order);`},
  {id:"totals",title:"Row and column totals",brief:"`sales` has one row per shop and one column per month. Create:\n\n- `shop_totals`, a column with each shop's total\n- `month_totals`, a row with each month's total\n- `grand`, the total of everything",
   pre:"sales = [10 20 30; 5 15 25];",starter:"",
   tests:[{eq:[["shop_totals","[60; 45]"],["month_totals","[15 35 55]"],["grand","105"]]},{pre:"sales = [1 1; 2 2; 3 3];",eq:[["shop_totals","[2; 4; 6]"],["month_totals","[6 6]"],["grand","12"]]}],
   hints:["sum(sales) adds down columns; sum(sales, 2) adds across rows.","sum(sales, 'all') adds everything."],solution:m`shop_totals = sum(sales, 2);
month_totals = sum(sales);
grand = sum(sales, 'all');`},
  {id:"size-up",title:"Size it up",brief:"Create `rows` and `cols`, the number of rows and columns in `A`, using one call to `size`. Then create `n`, the total number of elements.",pre:"A = zeros(4, 7);",starter:"",
   tests:[{eq:[["rows","4"],["cols","7"],["n","28"]]},{pre:"A = magic(3);",eq:[["rows","3"],["cols","3"],["n","9"]]}],hints:["[rows, cols] = size(A);","numel(A) counts every element."],solution:m`[rows, cols] = size(A);
n = numel(A);`},
  {id:"row-max",title:"Best in each row",brief:"Create `rowmax`, a column with the largest value in each row of `A`, and `colmin`, a row with the smallest value in each column.",pre:"A = [3 9 2; 8 1 7];",starter:"",
   tests:[{eq:[["rowmax","[9; 8]"],["colmin","[3 1 2]"]]},{pre:"A = magic(4);",eq:[["rowmax","max(A, [], 2)"],["colmin","min(A)"]]}],hints:["min(A) works down each column.","For rows: max(A, [], 2)."],solution:m`rowmax = max(A, [], 2);
colmin = min(A);`}]},

/* ======================================================================= 8 */
{n:8,ref:"Plotting Data",title:"Plotting",
 sections:[
  {h:"Your first plot",p:"`plot(x, y)` draws a line through the points (x(1), y(1)), (x(2), y(2)) and so on. x and y need the same number of elements. Use plenty of points (linspace with 100 is typical) for a smooth curve.\n\nOn this site the plot appears under the output when you press Run.",code:m`x = linspace(0, 2*pi, 100);
y = sin(x);
plot(x, y)`},
  {h:"plot(y) on its own",p:"With one input, `plot(y)` uses 1, 2, 3 ... as the x values. That's handy for something measured once a day."},
  {h:"Line styles",p:"A third input sets the look: a colour letter (`r` red, `g` green, `b` blue, `k` black, `m` magenta, `c` cyan), a line style (`-` solid, `--` dashed, `:` dotted) and a marker (`o` circle, `*` star, `s` square, `x` cross). `'r--o'` is a red dashed line with circles. `'ko'` is black circles with no line.",code:m`y = [3 5 4 6 8 7];
plot(y, 'r--o')`},
  {h:"Labels",p:"Always label your plots: `title('...')`, `xlabel('...')` and `ylabel('...')`. `grid on` adds grid lines. You can also set the line width with `plot(x, y, 'LineWidth', 2)`.",code:m`t = 0:6;
temp = [12 14 15 15 17 19 18];
plot(t, temp, 'b-o')
title('Temperature this week')
xlabel('Day')
ylabel('Temperature (°C)')
grid on`},
  {h:"Several lines on one plot",p:"Each new `plot` replaces the old one. Type `hold on` after the first plot to keep it, so the next plot adds to it. `hold off` goes back to replacing. `legend('first', 'second')` labels the lines in the order you drew them.",code:m`x = 0:0.1:2;
plot(x, x.^2)
hold on
plot(x, x.^3)
hold off
legend('x^2', 'x^3')`},
  {h:"Other charts",p:"`bar(y)` draws a bar chart, `scatter(x, y)` draws dots only, and `figure` starts a new, separate plot window. MATLAB has many more chart types (histogram, area, pie). This site draws the common ones."}],
 takeaways:["plot(x, y) needs x and y the same length.","'r--o' = red, dashed, circles.","title, xlabel, ylabel, grid on.","hold on to add lines; legend to name them.","bar for bar charts, figure for a new plot."],
 quick:[
  {q:"Which line draws a red dashed line?",opts:["plot(x, y, 'r--')","plot(x, y, red, dashed)","plot('r--', x, y)","plot(x, y) + 'r--'"],a:0,why:"The style text goes after the data."},
  {q:"Your second plot wiped out the first. What fixes it?",opts:["Put hold on after the first plot","Put grid on before the first plot","Call plot with both at once and nothing else","Use figure between them"],a:0,why:"hold on keeps the current plot so the next one adds to it. (figure would make a second, separate plot.)"},
  {q:"What does the style 'ko' draw?",opts:["Black circles with no line","A black line with circles","A blue line","An error, k isn't a colour"],a:0,why:"k is black, o is circle markers, and with no line style only markers are drawn."},
  {q:"Which labels the vertical axis?",opts:["ylabel('Price')","xlabel('Price')","title('Price')","legend('Price')"],a:0,why:"The y-axis is the vertical one."},
  {q:"y has 5 values. What x values does plot(y) use?",opts:["1 2 3 4 5","0 1 2 3 4","The same as y","None, it's an error"],a:0,why:"With one input, the positions 1 to n are used as x."},
  {q:"What does this give?",code:m`x = 1:5;
y = [2 4 6];
plot(x, y)`,opts:["An error: the vectors must be the same length","A plot of 3 points","A plot of 5 points","A plot padded with zeros"],a:0,why:"Every x needs a matching y."},
  {q:"After drawing two lines with hold on, which call labels them?",opts:["legend('sales', 'costs')","title('sales', 'costs')","label('sales', 'costs')","ylabel('sales', 'costs')"],a:0,why:"legend names each line in the order they were drawn."}],
 problems:[
  {id:"first-plot",title:"Plot a sine wave",brief:"Create `x`, 100 evenly spaced points from 0 to 2π (use `linspace` and `pi`). Create `y = sin(x)`, then plot y against x.",starter:"",
   tests:[{eq:[["x","linspace(0, 2*pi, 100)"],["y","sin(linspace(0, 2*pi, 100))"]],plot:{type:"line",yfn:"sin(x)"}}],
   hints:["x = linspace(0, 2*pi, 100);","y = sin(x); then plot(x, y)"],solution:m`x = linspace(0, 2*pi, 100);
y = sin(x);
plot(x, y)`},
  {id:"label-plot",title:"Label everything",brief:"`t` holds days and `temp` the temperature on each day. Plot `temp` against `t`, and give the plot a title and labels on both axes. The wording is up to you.",
   pre:"t = 0:6;\ntemp = [12 14 15 15 17 19 18];",starter:"",
   tests:[{plot:{type:"line",x:"t",y:"temp",title:true,xlabel:true,ylabel:true}}],hints:["plot(t, temp) first.","Then title('...'), xlabel('...') and ylabel('...')."],solution:m`plot(t, temp)
title('Temperature this week')
xlabel('Day')
ylabel('Temperature')`},
  {id:"two-lines",title:"Two curves, one plot",brief:"Plot `x.^2` and then `x.^3` against `x` on the same plot, and add a legend naming them (any names).",pre:"x = 0:0.1:2;",starter:"",
   tests:[{plot:{lines:2,ys:["x.^2","x.^3"],legend:true}}],hints:["After the first plot, hold on keeps it.","legend('squared', 'cubed') after both plots."],solution:m`plot(x, x.^2)
hold on
plot(x, x.^3)
hold off
legend('x^2', 'x^3')`},
  {id:"styled",title:"Style it",brief:"Plot `data` (just `plot(data, ...)`, no x needed) as a red dashed line with circle markers.",pre:"data = [3 5 4 6 8 7];",starter:"",
   tests:[{plot:{y:"data",color:"r",ls:"--",marker:"o"}}],hints:["Red is r, dashed is --, circles are o.","plot(data, 'r--o')"],solution:m`plot(data, 'r--o')`},
  {id:"bar-chart",title:"Bar chart",brief:"Draw a bar chart of `sales` with the title `Sales` (exactly that).",pre:"sales = [12 18 9 22];",starter:"",
   tests:[{plot:{type:"bar",y:"sales",title:"Sales"}}],hints:["bar(sales) draws the chart.","title('Sales')"],solution:m`bar(sales)
title('Sales')`}]},

/* ======================================================================= 9 */
{n:9,ref:"Logical Arrays",title:"True, false and filtering",
 sections:[
  {h:"Comparisons give true or false",p:"`x > 5` checks every element of x and gives back an array of 1s (true) and 0s (false), the same size as x. This is a logical array. The comparisons are `>`, `<`, `>=`, `<=`, `==` (equal) and `~=` (not equal).\n\nTwo equals signs compare. One equals sign stores. Mixing them up is one of the most common mistakes.",code:m`x = [3 8 1 9 5];
x > 4
x == 9`},
  {h:"Filtering with a logical array",p:"Put a logical array inside the brackets and you get only the elements where it's true. `x(x > 4)` keeps the elements bigger than 4. This is logical indexing, and it's one of the most useful things in MATLAB.",code:m`x = [3 8 1 9 5];
big = x(x > 4)`},
  {h:"Combining conditions",p:"`&` means and, `|` means or, and `~` means not. Brackets help readability: `x(x > 2 & x < 8)` keeps values between 2 and 8.",code:m`x = 1:10;
x(x > 2 & x < 8)
x(x < 3 | x > 8)`},
  {h:"Counting and finding",p:"True counts as 1, so `sum(x > 4)` or `nnz(x > 4)` counts how many elements pass. `find(x > 4)` gives their positions, and `find(x > 4, 1)` just the first one. `any(...)` asks whether at least one is true; `all(...)` whether every one is.",code:m`x = [3 8 1 9 5];
nnz(x > 4)
find(x > 4)
any(x > 8)
all(x > 0)`},
  {h:"Changing only some elements",p:"Logical indexing works on the left of `=` too. `x(x < 0) = 0` replaces every negative value with 0 in one line.",code:m`x = [4 -2 7 -5];
x(x < 0) = 0`},
  {h:"Filtering one array by another",p:"The condition can come from a different array of the same length. If `temps` and `days` line up, `days(temps > 25)` gives the days that were hot.\n\n`isnan(x)` marks missing values (NaN, \"not a number\"), so `x(~isnan(x))` drops them."}],
 takeaways:["Comparisons give a logical array of 1s and 0s.","== compares, = stores.","x(condition) keeps the elements where the condition is true.","& and, | or, ~ not.","nnz or sum counts; find gives positions; any and all summarise."],
 quick:[
  {q:"What is the value of t?",code:m`t = [3 8 1] > 2;`,v:"t",a:"[1 1 0]",why:"3 > 2 and 8 > 2 are true; 1 > 2 is false."},
  {q:"What is the value of y?",code:m`x = [3 8 1 9];
y = x(x > 2);`,v:"y",a:"[3 8 9]",why:"Only the elements where x > 2 is true."},
  {q:"What is the value of n?",code:m`n = nnz([4 0 2 0]);`,v:"n",a:"2",why:"nnz counts the nonzero elements."},
  {q:"What is the value of i?",code:m`x = [5 2 7];
i = find(x > 4);`,v:"i",a:"[1 3]",why:"Positions 1 and 3 hold values above 4."},
  {q:"What is the value of y?",code:m`x = [1 2 3 4];
y = x(x > 1 & x < 4);`,v:"y",a:"[2 3]",why:"Both conditions must be true."},
  {q:"What is x after this?",code:m`x = [-1 5 -3];
x(x < 0) = 0;`,v:"x",a:"[0 5 0]",why:"Only the negative elements are replaced."},
  {q:"What is the value of t?",code:m`x = [2 4 6];
t = all(mod(x, 2) == 0);`,v:"t",a:"1",why:"Every element is even, so all gives true."},
  {q:"Which keeps only the elements of x equal to 3?",opts:["x(x == 3)","x(x = 3)","x == 3","find(x = 3)"],a:0,why:"== compares. x == 3 alone gives 1s and 0s; putting it inside x(...) keeps the matching values."},
  {q:"What is the value of k?",code:m`x = [10 20 30 40];
k = find(x > 15, 1);`,v:"k",a:"2",why:"find(..., 1) gives only the first position where it's true."}],
 problems:[
  {id:"passing",title:"Who passed?",brief:"The pass mark is 50. Create `passed`, the scores that are 50 or more (in their original order), and `npass`, how many there are.",pre:"scores = [45 72 50 38 91 66];",starter:"",
   tests:[{eq:[["passed","[72 50 91 66]"],["npass","4"]]},{pre:"scores = [10 20];",eq:[["passed","zeros(1,0)"],["npass","0"]]}],hints:["scores >= 50 marks the passes.","passed = scores(scores >= 50); then count with numel."],solution:m`passed = scores(scores >= 50);
npass = numel(passed);`},
  {id:"clip",title:"No negatives",brief:"Replace every negative value in `data` with 0, changing `data` itself.",pre:"data = [3 -2 5 -7 0];",starter:"",
   tests:[{eq:[["data","[3 0 5 0 0]"]]},{pre:"data = [-1 -1];",eq:[["data","[0 0]"]]}],hints:["data < 0 marks the negatives.","data(data < 0) = 0;"],solution:m`data(data < 0) = 0;`},
  {id:"up-days",title:"Up days",brief:"`p` is a share price on each day. Create `ups`, the number of days the price went up from the day before, and `first_up`, the first day it went up.\n\n`diff(p) > 0` marks the rises, but careful: diff's first element is the change from day 1 to day 2, so its position k means day k + 1.",
   pre:"p = [100 102 101 105 107 103];",starter:"",
   tests:[{eq:[["ups","3"],["first_up","2"]]},{pre:"p = [50 48 47 49 52];",eq:[["ups","2"],["first_up","4"]]}],
   hints:["nnz(diff(p) > 0) counts the rises.","find(diff(p) > 0, 1) gives the first rise's position in diff. Add 1 to turn it into a day."],solution:m`rises = diff(p) > 0;
ups = nnz(rises);
first_up = find(rises, 1) + 1;`},
  {id:"hot-days",title:"Hot days",brief:"`days` and `temps` line up: `temps(k)` is the temperature on day `days(k)`. Create `hot`, the days when the temperature was above 25.",pre:"days = 1:7;\ntemps = [22 27 31 24 26 19 30];",starter:"",
   tests:[{eq:[["hot","[2 3 5 7]"]]},{pre:"days = [10 20 30];\ntemps = [30 20 26];",eq:[["hot","[10 30]"]]}],hints:["temps > 25 marks the hot positions.","Use that to index days: days(temps > 25)."],solution:m`hot = days(temps > 25);`},
  {id:"in-range",title:"In range",brief:"Create `inrange`, the elements of `x` from 10 to 20 inclusive.",pre:"x = [5 12 20 21 10 15 9];",starter:"",
   tests:[{eq:[["inrange","[12 20 10 15]"]]},{pre:"x = [10 10.5 20.5];",eq:[["inrange","[10 10.5]"]]}],hints:["Inclusive means >= and <=.","x(x >= 10 & x <= 20)"],solution:m`inrange = x(x >= 10 & x <= 20);`},
  {id:"missing",title:"Missing data",brief:"Some readings in `data` are missing and stored as `NaN`. Create `clean`, the data without the NaNs, and `avg`, the average of the clean data.\n\nYou can't find NaN with `== NaN` (NaN isn't equal to anything, even itself), so use `isnan`.",
   pre:"data = [4 NaN 7 2 NaN 5];",starter:"",
   tests:[{eq:[["clean","[4 7 2 5]"],["avg","4.5"]]},{pre:"data = [NaN 1 3];",eq:[["clean","[1 3]"],["avg","2"]]}],hints:["isnan(data) is true where data is missing; ~ flips it.","clean = data(~isnan(data));"],solution:m`clean = data(~isnan(data));
avg = mean(clean);`}]},

/* ======================================================================= 10 */
{n:10,ref:null,title:"Text and printing",
 sections:[
  {h:"Two kinds of text",p:"Text in single quotes, `'hello'`, is a character vector: an array of letters, so `length('hello')` is 5, and if `s = 'hello'` then `s(1)` is `'h'`. Text in double quotes, `\"hello\"`, is a string: one piece of text treated as a single value.\n\nBoth are fine. Older code and most of MATLAB Onramp use single quotes. This site accepts either where the problem doesn't say."},
  {h:"Joining text",p:"Character vectors join with square brackets, like any array: `['Hello, ' name]`. Strings join with `+`: `\"Hello, \" + name`.\n\nTo put a number in text, convert it first with `num2str`: `['Total: ' num2str(42)]`. (With strings, `+` converts numbers for you.)",code:m`name = 'Ada';
greeting = ['Hello, ' name '!']
msg = ['You have ' num2str(3) ' messages']`},
  {h:"disp shows a value",p:"`disp(x)` shows x without its name. It's the simplest way to print text or a result.",code:m`disp('Hello there')
disp(42)`},
  {h:"fprintf for formatted output",p:"`fprintf` prints text with values slotted in:\n\n- `%d` a whole number\n- `%f` a decimal; `%.2f` with 2 decimal places\n- `%s` text\n- `\\n` a new line\n\nfprintf doesn't start a new line by itself, so end with `\\n`. If you give it a vector, it repeats the format for each element.",code:m`fprintf('%d apples cost %.2f\n', 3, 1.5)
name = 'Ada';
fprintf('Hello, %s!\n', name)
fprintf('Value: %d\n', [4 8 15])`},
  {h:"Comparing text",p:"`==` compares character vectors letter by letter, and fails if they're different lengths. To ask \"is this the same text?\", use `strcmp(a, b)`, which gives true or false. `strcmpi` ignores capitals.",code:m`strcmp('cat', 'cat')
strcmp('cat', 'Cat')
strcmpi('cat', 'Cat')`},
  {h:"Useful text functions",p:"- `upper(s)`, `lower(s)` change case\n- `strtrim(s)` removes spaces from both ends\n- `strrep(s, old, new)` replaces text\n- `contains(s, 'abc')` checks whether s contains abc\n- `length(s)` counts the characters of a character vector"}],
 takeaways:["'abc' is a character vector; \"abc\" is a string.","Join char vectors with [ ]; use num2str for numbers.","disp(x) shows a value; fprintf formats it.","%d whole, %.2f two decimals, %s text, \\n new line.","Compare text with strcmp, not ==."],
 quick:[
  {q:"What does this display?",code:m`disp(['Hi ' 'there'])`,a:"Hi there",why:"Square brackets join the two character vectors."},
  {q:"What does this display?",code:m`fprintf('%d apples\n', 3)`,a:"3 apples",why:"%d is replaced by 3."},
  {q:"What does this display?",code:m`fprintf('%.2f\n', 3.14159)`,a:"3.14",why:"%.2f shows 2 decimal places."},
  {q:"What does this display?",code:m`name = 'Ada';
fprintf('Hello, %s!\n', name)`,a:"Hello, Ada!",why:"%s is replaced by the text in name."},
  {q:"What is the value of n?",code:m`n = length('hello');`,v:"n",a:"5",why:"A character vector has one element per letter."},
  {q:"What does this display?",code:m`disp(upper('matlab'))`,a:"MATLAB",why:"upper makes every letter a capital."},
  {q:"What does 'abc' == 'abd' give?",opts:["[1 1 0], comparing letter by letter","false","true","An error"],a:0,why:"For char vectors, == compares each letter. strcmp gives a single true/false."},
  {q:"What does this display?",code:m`x = 7;
disp(['x is ' num2str(x)])`,a:"x is 7",why:"num2str turns 7 into the text '7' so it can be joined."},
  {q:"What does this display?",code:m`fprintf('%d-%d\n', [1 2 3 4])`,a:"1-2\n3-4",why:"The format uses two values, then repeats for the next two."}],
 problems:[
  {id:"hello-name",title:"Hello, name",brief:"`name` holds someone's name. Print `Hello, NAME!` followed by a new line, using fprintf.",pre:"name = 'Ada';",starter:"",
   tests:[{out:"Hello, Ada!"},{pre:"name = 'Grace Hopper';",out:"Hello, Grace Hopper!"}],hints:["%s is where text goes in fprintf.","fprintf('Hello, %s!\\n', name)"],solution:m`fprintf('Hello, %s!\n', name)`},
  {id:"receipt",title:"Price tag",brief:"Print a line like `Coffee costs 3.50`: the item's name, the word costs, then the price with exactly 2 decimal places.",pre:"item = 'Coffee';\nprice = 3.5;",starter:"",
   tests:[{out:"Coffee costs 3.50"},{pre:"item = 'Bagel';\nprice = 2;",out:"Bagel costs 2.00"}],hints:["You need %s for the item and %.2f for the price.","fprintf('%s costs %.2f\\n', item, price)"],solution:m`fprintf('%s costs %.2f\n', item, price)`},
  {id:"initials",title:"Initials",brief:"`first` and `last` hold a first and last name, maybe in lowercase. Create `initials`, the first letter of each, in capitals. `ada` and `lovelace` give `'AL'`.",pre:"first = 'ada';\nlast = 'lovelace';",starter:"",
   tests:[{eq:[["initials","'AL'"]]},{pre:"first = 'Grace';\nlast = 'hopper';",eq:[["initials","'GH'"]]}],hints:["first(1) is the first letter of first.","Join the two letters with [ ], then wrap in upper(...)."],solution:m`initials = upper([first(1) last(1)]);`},
  {id:"list-values",title:"Print a list",brief:"Print each value in `x` on its own line, like `Value: 3`. One fprintf call can do it, because fprintf repeats its format for every element.",pre:"x = [3 8 1];",starter:"",
   tests:[{out:"Value: 3\nValue: 8\nValue: 1"},{pre:"x = [42];",out:"Value: 42"}],hints:["fprintf('Value: %d\\n', x) uses each element in turn."],solution:m`fprintf('Value: %d\n', x)`},
  {id:"password",title:"Password check",brief:"Create `ok`, which is true only if `pw` is exactly `open sesame` (lowercase, one space).\n\nTry it with `==` first and see what happens when the lengths differ, then use `strcmp`.",pre:"pw = 'open sesame';",starter:"",
   tests:[{eq:[["ok","true"]]},{pre:"pw = 'Open Sesame';",eq:[["ok","false"]]},{pre:"pw = 'open';",eq:[["ok","false"]]}],hints:["strcmp(a, b) gives true if the text is identical.","ok = strcmp(pw, 'open sesame');"],solution:m`ok = strcmp(pw, 'open sesame');`},
  {id:"tidy",title:"Tidy text",brief:"`raw` is text someone typed, with extra spaces at the ends and random capitals. Create `clean`: no spaces at either end, all lowercase.",pre:"raw = '   Hello WORLD  ';",starter:"",
   tests:[{eq:[["clean","'hello world'"]]},{pre:"raw = 'MATLAB ';",eq:[["clean","'matlab'"]]}],hints:["strtrim removes spaces at the ends; lower changes case.","clean = lower(strtrim(raw));"],solution:m`clean = lower(strtrim(raw));`},
  {id:"num-text",title:"Numbers into text",brief:"Create `msg`, text like `'Total: 42.5'`, using the number in `total`.",pre:"total = 42.5;",starter:"",
   tests:[{eq:[["msg","'Total: 42.5'"]]},{pre:"total = 7;",eq:[["msg","'Total: 7'"]]}],hints:["num2str(total) turns the number into text.","msg = ['Total: ' num2str(total)];"],solution:m`msg = ['Total: ' num2str(total)];`}]},

/* ======================================================================= 11 */
{n:11,ref:"Programming",title:"Decisions with if",
 sections:[
  {h:"if ... end",p:"`if` runs some lines only when a condition is true. Everything between `if` and `end` belongs to it. Indenting the inside makes it easier to read.",code:m`x = 7;
if x > 5
    disp('x is big')
end`},
  {h:"else and elseif",p:"`else` gives the lines to run when the condition is false. `elseif` adds more conditions, checked in order. MATLAB runs the first branch whose condition is true and skips the rest.",code:m`score = 64;
if score >= 70
    grade = 'A';
elseif score >= 60
    grade = 'B';
else
    grade = 'C';
end
grade`},
  {h:"Combining conditions",p:"For single true/false values, use `&&` (and) and `||` (or): `if age >= 18 && age < 65`. Use `~` for not. (`&` and `|` are for whole arrays.)"},
  {h:"Common mistakes",p:"- `if x = 5` is an error. Comparing needs `==`.\n- Comparing text with `==` fails when the lengths differ. Use `strcmp`.\n- `if` on an array is true only if every element is true. Use `any(...)` or `all(...)` to say what you mean."},
  {h:"switch for fixed choices",p:"When you're comparing one value against several fixed options, `switch` is tidier than a chain of elseifs. Each `case` lists a value, or several in curly braces. `otherwise` catches everything else.",code:m`day = 'Sat';
switch day
    case {'Sat', 'Sun'}
        kind = 'weekend';
    otherwise
        kind = 'weekday';
end
kind`}],
 takeaways:["if condition ... end runs lines only when the condition is true.","elseif and else add more branches; the first true one wins.","&& and || combine single true/false values.","== compares; = stores.","switch / case / otherwise for fixed options."],
 quick:[
  {q:"What does this display?",code:m`x = 5;
if x > 3
    disp('big')
else
    disp('small')
end`,a:"big",why:"5 > 3 is true, so the first branch runs."},
  {q:"What does this display?",code:m`x = 3;
if x > 3
    disp('big')
elseif x == 3
    disp('three')
else
    disp('small')
end`,a:"three",why:"3 > 3 is false, so MATLAB checks the elseif, which is true."},
  {q:"What is the value of g?",code:m`s = 85;
if s >= 50
    g = 1;
elseif s >= 80
    g = 2;
end`,v:"g",a:"1",why:"The first true condition wins. 85 >= 50 is checked first, so the elseif never runs. Put the strictest test first."},
  {q:"What does this display?",code:m`x = 10;
if x > 5 && x < 20
    disp('in range')
end`,a:"in range",why:"Both conditions are true."},
  {q:"What happens with if x = 5?",opts:["An error: use == to compare","It sets x to 5 and runs the branch","It always runs the branch","It never runs the branch"],a:0,why:"A single = stores a value and isn't allowed in a condition."},
  {q:"What does this display?",code:m`day = 'Sun';
switch day
    case {'Sat', 'Sun'}
        disp('Weekend')
    otherwise
        disp('Weekday')
end`,a:"Weekend",why:"'Sun' matches one of the options in the first case."},
  {q:"What does this display?",code:m`x = [1 0 1];
if x
    disp('yes')
else
    disp('no')
end`,a:"no",why:"if on an array is only true when every element is true."}],
 problems:[
  {id:"sign",title:"Positive or negative",brief:"Create `s`: the text `'positive'`, `'negative'` or `'zero'`, depending on `x`.",pre:"x = 5;",starter:"",
   tests:[{eq:[["s","'positive'"]]},{pre:"x = -2.5;",eq:[["s","'negative'"]]},{pre:"x = 0;",eq:[["s","'zero'"]]}],hints:["Three cases: if, elseif, else.","if x > 0 ... elseif x < 0 ... else ... end"],solution:m`if x > 0
    s = 'positive';
elseif x < 0
    s = 'negative';
else
    s = 'zero';
end`},
  {id:"grade",title:"Letter grade",brief:"Create `grade` from `score`:\n\n- 70 or more: `'A'`\n- 60 to 69: `'B'`\n- 50 to 59: `'C'`\n- below 50: `'F'`",pre:"score = 64;",starter:"",
   tests:[{eq:[["grade","'B'"]]},{pre:"score = 70;",eq:[["grade","'A'"]]},{pre:"score = 50;",eq:[["grade","'C'"]]},{pre:"score = 49;",eq:[["grade","'F'"]]},{pre:"score = 95;",eq:[["grade","'A'"]]}],
   hints:["Check the highest band first: if score >= 70.","Then elseif score >= 60, elseif score >= 50, else."],solution:m`if score >= 70
    grade = 'A';
elseif score >= 60
    grade = 'B';
elseif score >= 50
    grade = 'C';
else
    grade = 'F';
end`},
  {id:"leap",title:"Leap year",brief:"Create `leap`, true if `year` is a leap year. The rule: divisible by 4, except years divisible by 100 aren't, except years divisible by 400 are. So 2024 and 2000 are leap years; 1900 and 2023 aren't.\n\n\"Divisible by 4\" means `mod(year, 4) == 0`.",pre:"year = 2024;",starter:"",
   tests:[{eq:[["leap","true"]]},{pre:"year = 1900;",eq:[["leap","false"]]},{pre:"year = 2000;",eq:[["leap","true"]]},{pre:"year = 2023;",eq:[["leap","false"]]}],
   hints:["It can be one condition: divisible by 4 and (not divisible by 100 or divisible by 400).","leap = mod(year,4) == 0 && (mod(year,100) ~= 0 || mod(year,400) == 0);"],solution:m`leap = mod(year, 4) == 0 && (mod(year, 100) ~= 0 || mod(year, 400) == 0);`},
  {id:"shipping",title:"Shipping cost",brief:"Work out `cost` from a parcel's `weight` in kg:\n\n- up to and including 1 kg: 5\n- over 1 kg, up to and including 5 kg: 12\n- over 5 kg: 12, plus 2 for every started kg over 5 (6.2 kg is 2 started kg over, so 16)\n\n`ceil` rounds up, which handles \"started kg\".",pre:"weight = 3;",starter:"",
   tests:[{eq:[["cost","12"]]},{pre:"weight = 0.5;",eq:[["cost","5"]]},{pre:"weight = 1;",eq:[["cost","5"]]},{pre:"weight = 5;",eq:[["cost","12"]]},{pre:"weight = 6.2;",eq:[["cost","16"]]}],
   hints:["if weight <= 1 ... elseif weight <= 5 ... else ... end","In the last branch: cost = 12 + 2 * ceil(weight - 5);"],solution:m`if weight <= 1
    cost = 5;
elseif weight <= 5
    cost = 12;
else
    cost = 12 + 2 * ceil(weight - 5);
end`},
  {id:"day-type",title:"Weekend or weekday",brief:"`day` is a three-letter day name like `'Mon'`. Use a `switch` to create `kind`: `'weekend'` for `'Sat'` and `'Sun'`, otherwise `'weekday'`.",pre:"day = 'Sat';",starter:"",
   tests:[{eq:[["kind","'weekend'"]],src:[["\\bswitch\\b","Use a switch statement for this one."]]},{pre:"day = 'Sun';",eq:[["kind","'weekend'"]]},{pre:"day = 'Wed';",eq:[["kind","'weekday'"]]}],
   hints:["case {'Sat', 'Sun'} matches either.","otherwise covers the rest."],solution:m`switch day
    case {'Sat', 'Sun'}
        kind = 'weekend';
    otherwise
        kind = 'weekday';
end`}]},

/* ======================================================================= 12 */
{n:12,ref:"Programming",title:"Repeating with for loops",
 sections:[
  {h:"Doing something for each value",p:"A `for` loop runs the same lines once for each value in a list. `for k = 1:5` runs its body five times, with k being 1, then 2, up to 5.",code:m`for k = 1:5
    fprintf('Round %d\n', k)
end`},
  {h:"Looping over any vector",p:"The list can be any row vector: `for p = [9.99 4.50 12]` runs once per price.",code:m`for p = [9.99 4.50 12]
    fprintf('%.2f with tax: %.2f\n', p, p * 1.2)
end`},
  {h:"Keeping a running total",p:"Set a variable before the loop, then update it inside. This pattern (start at 0, add each time) is called an accumulator.",code:m`total = 0;
for k = 1:10
    total = total + k;
end
total`},
  {h:"Building a vector",p:"To fill a vector in a loop, make it the right size first with `zeros`, then fill in `result(k)` each time round. Making it first (preallocating) is faster than growing it one element at a time.",code:m`n = 6;
squares = zeros(1, n);
for k = 1:n
    squares(k) = k^2;
end
squares`},
  {h:"Loops inside loops",p:"A loop can contain another loop. The inner loop runs completely for each step of the outer one, which is how you visit every element of a matrix: rows in the outer loop, columns in the inner.",code:m`M = zeros(3, 4);
for i = 1:3
    for j = 1:4
        M(i, j) = 10*i + j;
    end
end
M`},
  {h:"Loop or vectorise?",p:"Many loops can be replaced by one array operation: the loop above that adds 1 to 10 is just `sum(1:10)`. MATLAB code often avoids loops for that reason. But loops are easier to reason about step by step, and some problems need them. Both are good tools."}],
 takeaways:["for k = 1:n repeats its body n times, with k counting up.","Start an accumulator before the loop and update it inside.","Preallocate with zeros, then fill result(k).","Nested loops visit every row and column.","Many loops can also be written as one array operation."],
 quick:[
  {q:"What does this display?",code:m`for k = 1:3
    disp(k)
end`,a:"1\n2\n3",why:"The body runs three times, with k = 1, 2, 3."},
  {q:"What is total after the loop?",code:m`total = 0;
for k = 1:4
    total = total + k;
end`,v:"total",a:"10",why:"0 + 1 + 2 + 3 + 4."},
  {q:"What is p after the loop?",code:m`p = 1;
for k = [2 3 4]
    p = p * k;
end`,v:"p",a:"24",why:"1 × 2 × 3 × 4."},
  {q:"What is x after the loop?",code:m`x = zeros(1, 3);
for k = 1:3
    x(k) = k * 10;
end`,v:"x",a:"[10 20 30]",why:"Each pass fills one position."},
  {q:"What does this display?",code:m`for k = 5:-2:1
    fprintf('%d ', k);
end
fprintf('\n');`,a:"5 3 1",why:"The range counts down in steps of 2."},
  {q:"What is count after these loops?",code:m`count = 0;
for i = 1:3
    for j = 1:2
        count = count + 1;
    end
end`,v:"count",a:"6",why:"The inner loop runs 2 times for each of the 3 outer steps."},
  {q:"What is k after the loop finishes?",code:m`for k = 1:5
end`,v:"k",a:"5",why:"k keeps its last value."}],
 problems:[
  {id:"loop-sum",title:"Add up with a loop",brief:"Create `total`, the sum 1 + 2 + ... + `n`, using a for loop (not `sum`) this time.",pre:"n = 10;",starter:"",
   tests:[{eq:[["total","55"]],src:[["\\bfor\\b","Use a for loop."]],nosrc:[["\\bsum\\s*\\(","Don't use sum here: practise the loop."]]},{pre:"n = 1;",eq:[["total","1"]]},{pre:"n = 100;",eq:[["total","5050"]]}],
   hints:["Start with total = 0; before the loop.","for k = 1:n, total = total + k; end"],solution:m`total = 0;
for k = 1:n
    total = total + k;
end`},
  {id:"factorial-loop",title:"Factorial",brief:"`n!` (n factorial) is 1 × 2 × 3 × ... × n, and 0! is 1. Create `f`, the factorial of `n`, using a loop rather than `factorial` or `prod`.",pre:"n = 5;",starter:"",
   tests:[{eq:[["f","120"]],nosrc:[["\\b(factorial|prod)\\s*\\(","Use a loop rather than factorial or prod."]]},{pre:"n = 0;",eq:[["f","1"]]},{pre:"n = 10;",eq:[["f","3628800"]]}],
   hints:["A product starts at 1, not 0.","f = 1; for k = 1:n, f = f * k; end. When n is 0, the loop doesn't run at all."],solution:m`f = 1;
for k = 1:n
    f = f * k;
end`},
  {id:"times-table",title:"Times table",brief:"Print the first five lines of the `n` times table, like this for n = 3:\n\n```\n3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n```",pre:"n = 3;",starter:"",
   tests:[{out:"3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15"},{pre:"n = 7;",out:"7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35"}],
   hints:["Loop k from 1 to 5.","fprintf('%d x %d = %d\\n', n, k, n*k)"],solution:m`for k = 1:5
    fprintf('%d x %d = %d\n', n, k, n*k)
end`},
  {id:"fibonacci",title:"Fibonacci",brief:"The Fibonacci sequence starts 1, 1, and each number after that is the sum of the two before it: 1, 1, 2, 3, 5, 8, ...\n\nCreate `fib`, a row vector of the first `n` Fibonacci numbers (`n` is at least 2).",pre:"n = 10;",starter:"",
   tests:[{eq:[["fib","[1 1 2 3 5 8 13 21 34 55]"]]},{pre:"n = 2;",eq:[["fib","[1 1]"]]},{pre:"n = 5;",eq:[["fib","[1 1 2 3 5]"]]}],
   hints:["Preallocate: fib = zeros(1, n); then set fib(1) and fib(2) to 1.","for k = 3:n, fib(k) = fib(k-1) + fib(k-2); end"],solution:m`fib = zeros(1, n);
fib(1) = 1;
fib(2) = 1;
for k = 3:n
    fib(k) = fib(k-1) + fib(k-2);
end`},
  {id:"savings",title:"Savings plan",brief:"You pay `d` into savings at the end of each month, for `m` months. Each month, before your payment, the balance earns interest at `r / 12` (r is the yearly rate). Starting from 0, create `balance`: the amount after `m` months, rounded to 2 decimal places.\n\nEach month: balance = balance × (1 + r/12) + d.",pre:"d = 100;\nr = 0.06;\nm = 12;",starter:"",
   tests:[{eq:[["balance","b = 0; for k = 1:m, b = b*(1+r/12) + d; end; want = round(b, 2);"]]},{pre:"d = 50;\nr = 0;\nm = 3;",eq:[["balance","150"]]},{pre:"d = 200;\nr = 0.12;\nm = 24;",eq:[["balance","b = 0; for k = 1:m, b = b*(1+r/12) + d; end; want = round(b, 2);"]]}],
   hints:["balance = 0; then loop m times.","Inside: balance = balance * (1 + r/12) + d; Round once, after the loop."],solution:m`balance = 0;
for k = 1:m
    balance = balance * (1 + r/12) + d;
end
balance = round(balance, 2);`},
  {id:"vowels",title:"Count the vowels",brief:"Create `n`, the number of vowels (a, e, i, o, u) in `word`, which is all lowercase.\n\nA character vector is an array of letters, so you can loop over it: `for ch = word` gives one letter at a time.",pre:"word = 'education';",starter:"",
   tests:[{eq:[["n","5"]]},{pre:"word = 'rhythm';",eq:[["n","0"]]},{pre:"word = 'banana';",eq:[["n","3"]]}],
   hints:["any(ch == 'aeiou') is true if ch is a vowel.","n = 0; for ch = word, if any(ch == 'aeiou'), n = n + 1; end; end"],solution:m`n = 0;
for ch = word
    if any(ch == 'aeiou')
        n = n + 1;
    end
end`},
  {id:"mult-grid",title:"Multiplication grid",brief:"Create `M`, an `n`-by-`n` matrix where `M(i, j)` is `i * j`, using two loops.",pre:"n = 3;",starter:"",
   tests:[{eq:[["M","[1 2 3; 2 4 6; 3 6 9]"]]},{pre:"n = 5;",eq:[["M","(1:5)' * (1:5)"]]}],hints:["Preallocate with zeros(n).","for i = 1:n, for j = 1:n, M(i, j) = i * j; end; end"],solution:m`M = zeros(n);
for i = 1:n
    for j = 1:n
        M(i, j) = i * j;
    end
end`}]},

/* ======================================================================= 13 */
{n:13,ref:null,title:"while loops",
 sections:[
  {h:"Repeat until something happens",p:"A `while` loop keeps going as long as its condition is true. Use it when you don't know in advance how many times to repeat: \"keep doubling until it's over 1000\".",code:m`n = 1;
while n <= 1000
    n = n * 2;
end
n`},
  {h:"Something must change",p:"Inside the loop, something has to move the condition towards false, or the loop never ends. On this site a runaway loop is stopped after a few seconds; in MATLAB you'd press Ctrl+C."},
  {h:"Counting the steps",p:"Often you want to know how many times the loop ran. Keep a counter: start at 0 and add 1 each time round.",code:m`balance = 100;
years = 0;
while balance < 200
    balance = balance * 1.07;
    years = years + 1;
end
years`},
  {h:"break and continue",p:"`break` jumps straight out of the loop (works in for loops too). `continue` skips the rest of this pass and goes to the next one.",code:m`for k = 1:10
    if k^2 > 20
        break
    end
end
k`},
  {h:"Splitting digits",p:"A classic while-loop trick: `mod(n, 10)` is the last digit of n, and `floor(n / 10)` removes it. Repeat until n is 0 to visit every digit."}],
 takeaways:["while condition ... end repeats while the condition is true.","Something inside must change the condition.","Count steps with a counter starting at 0.","break leaves a loop early; continue skips to the next pass."],
 quick:[
  {q:"What is n after the loop?",code:m`n = 1;
while n < 50
    n = n * 2;
end`,v:"n",a:"64",why:"1, 2, 4, 8, 16, 32, 64. At 64 the condition is false."},
  {q:"What is k after the loop?",code:m`k = 0;
while k < 3
    k = k + 1;
end`,v:"k",a:"3",why:"It stops once k reaches 3."},
  {q:"What is steps after the loop?",code:m`x = 100;
steps = 0;
while x > 1
    x = x / 10;
    steps = steps + 1;
end`,v:"steps",a:"2",why:"100 → 10 → 1. Two steps, then 1 > 1 is false."},
  {q:"What's wrong with this loop?",code:m`k = 1;
while k < 10
    disp(k)
end`,opts:["Nothing changes k, so it never ends","It never runs","It runs exactly 10 times","disp can't be used in a loop"],a:0,why:"k stays 1 forever. It needs k = k + 1 inside."},
  {q:"What is k after this loop?",code:m`for k = 1:10
    if k^2 > 20
        break
    end
end`,v:"k",a:"5",why:"5² = 25 is the first square over 20, so the loop breaks there."},
  {q:"What is s after this loop?",code:m`s = 0;
for k = 1:5
    if mod(k, 2) == 0
        continue
    end
    s = s + k;
end`,v:"s",a:"9",why:"Even k skip the addition, so s = 1 + 3 + 5."},
  {q:"What is d after this?",code:m`n = 472;
d = mod(n, 10);`,v:"d",a:"2",why:"mod(n, 10) is the last digit."}],
 problems:[
  {id:"double-money",title:"Double your money",brief:"Money grows by `rate` each year (0.07 means 7%). Starting from 1, how many whole years until it's at least doubled? Create `years`.",pre:"rate = 0.07;",starter:"",
   tests:[{eq:[["years","11"]]},{pre:"rate = 0.1;",eq:[["years","8"]]},{pre:"rate = 1;",eq:[["years","1"]]}],
   hints:["balance = 1; years = 0; while balance < 2 ...","Inside: balance = balance * (1 + rate); years = years + 1;"],solution:m`balance = 1;
years = 0;
while balance < 2
    balance = balance * (1 + rate);
    years = years + 1;
end`},
  {id:"collatz",title:"Collatz steps",brief:"Start with `n`. If it's even, halve it; if it's odd, make it 3n + 1. Repeat until you reach 1. Create `steps`, how many steps that takes. From 6: 6, 3, 10, 5, 16, 8, 4, 2, 1 is 8 steps. From 1 it's 0 steps.",pre:"n = 6;",starter:"",
   tests:[{eq:[["steps","8"]]},{pre:"n = 1;",eq:[["steps","0"]]},{pre:"n = 27;",eq:[["steps","111"]]}],
   hints:["while n ~= 1 ... end, with a counter.","Inside: if mod(n, 2) == 0, n = n / 2; else, n = 3*n + 1; end"],solution:m`steps = 0;
while n ~= 1
    if mod(n, 2) == 0
        n = n / 2;
    else
        n = 3*n + 1;
    end
    steps = steps + 1;
end`},
  {id:"digit-sum",title:"Digit sum",brief:"Create `s`, the sum of the digits of the whole number `n`. 1234 gives 10.\n\nUse `mod` and `floor` in a while loop rather than converting to text.",pre:"n = 1234;",starter:"",
   tests:[{eq:[["s","10"]],nosrc:[["num2str|sprintf|str2|string\\(","Use mod and floor this time, not text."]]},{pre:"n = 9;",eq:[["s","9"]]},{pre:"n = 1000;",eq:[["s","1"]]}],
   hints:["mod(n, 10) is the last digit; floor(n / 10) removes it.","s = 0; while n > 0, s = s + mod(n, 10); n = floor(n / 10); end"],solution:m`s = 0;
while n > 0
    s = s + mod(n, 10);
    n = floor(n / 10);
end`},
  {id:"first-square",title:"First square over the limit",brief:"Create `k`, the smallest whole number (1 or more) whose square is greater than `limit`.",pre:"limit = 50;",starter:"",
   tests:[{eq:[["k","8"]]},{pre:"limit = 64;",eq:[["k","9"]]},{pre:"limit = 0;",eq:[["k","1"]]}],
   hints:["Start at k = 1 and go up while k^2 is not yet over the limit.","k = 1; while k^2 <= limit, k = k + 1; end"],solution:m`k = 1;
while k^2 <= limit
    k = k + 1;
end`},
  {id:"loan-payoff",title:"Paying off a loan",brief:"You owe `B`. Each month, interest is added at the monthly rate `r`, then you pay `P`. Create `months`, the number of payments until the balance is 0 or less (the last payment can be a partial one, but it still counts as a month).\n\nEach month: B = B × (1 + r) − P.",pre:"B = 1000;\nP = 100;\nr = 0.01;",starter:"",
   tests:[{eq:[["months","11"]]},{pre:"B = 500;\nP = 500;\nr = 0;",eq:[["months","1"]]},{pre:"B = 5000;\nP = 250;\nr = 0.02;",eq:[["months","b = B; want = 0; while b > 0, b = b*(1+r) - P; want = want + 1; end"]]}],
   hints:["months = 0; while B > 0 ... end","Inside: B = B * (1 + r) - P; months = months + 1;"],solution:m`months = 0;
while B > 0
    B = B * (1 + r) - P;
    months = months + 1;
end`}]},

/* ======================================================================= 14 */
{n:14,ref:null,title:"Writing your own functions",
 sections:[
  {h:"Why write functions",p:"A function packages up some code under a name, with inputs and outputs. Once written, you can use it again and again without copying code, and test it on its own."},
  {h:"The shape of a function",p:"```\nfunction out = name(in1, in2)\n    out = ...;\nend\n```\n\nThe first line says what comes out (`out`), the function's name, and what goes in. Inside, you must set `out` before the function ends. That value is what the caller gets back."},
  {h:"Functions in scripts",p:"In a script, functions go at the very end of the file, after all the other code. The code at the top can call them. In MATLAB you can also save a function in its own file called `name.m`.",code:m`y = triple(4)
z = triple(10)

function out = triple(x)
    out = 3 * x;
end`},
  {h:"Functions have their own workspace",p:"Variables inside a function are private. The function can't see your other variables, and its variables vanish when it finishes. Everything it needs must come in as an input, and everything you need back must go out as an output. That's what makes functions safe to reuse."},
  {h:"Several outputs",p:"List them in square brackets: `function [lo, hi] = range_of(x)`. The caller collects them the same way: `[a, b] = range_of(data)`.",code:m`[a, b] = range_of([4 9 1 7])

function [lo, hi] = range_of(x)
    lo = min(x);
    hi = max(x);
end`},
  {h:"Anonymous functions",p:"For a quick one-line formula, an anonymous function saves writing a whole function: `f = @(x) x.^2 + 1` makes `f` a function of x, called like any other: `f(3)`.",code:m`f = @(x) x.^2 + 1;
f(3)
f([1 2 3])`},
  {h:"Testing on this site",p:"Checks call your function with different inputs. You can test it yourself by calling it at the top of your script and pressing Run."}],
 takeaways:["function out = name(inputs) ... end","Set every output before the function ends.","In a script, functions go at the end of the file.","Function variables are private: pass things in and out.","f = @(x) ... makes a quick anonymous function."],
 quick:[
  {q:"What is the value of y?",code:m`y = triple(4);

function out = triple(x)
    out = 3 * x;
end`,v:"y",a:"12",why:"triple(4) runs the function with x = 4 and returns 12."},
  {q:"Where do local functions go in a script file?",opts:["At the end, after all the other code","At the top, before anything else","Anywhere","In a separate script only"],a:0,why:"MATLAB requires functions in a script to come after the script's own code."},
  {q:"What is the value of y?",code:m`f = @(x) x + 10;
y = f(5);`,v:"y",a:"15",why:"f adds 10 to its input."},
  {q:"What is the value of p?",code:m`[s, p] = sp(2, 5);

function [s, p] = sp(a, b)
    s = a + b;
    p = a * b;
end`,v:"p",a:"10",why:"The second output is a * b."},
  {q:"A function sets x = 99 inside it. What happens to an x in your script?",opts:["Nothing: the function has its own separate variables","It becomes 99","It's deleted","You get an error"],a:0,why:"Each function has its own private workspace."},
  {q:"You see: Output argument \"y\" not assigned a value. What does it mean?",opts:["The function finished without setting y","You passed too many inputs","y is a reserved word","The function has a typo in its name"],a:0,why:"Every output must be given a value before the function ends, on every path through it."},
  {q:"What is the value of v?",code:m`g = @(a, b) a * b + 1;
v = g(3, 4);`,v:"v",a:"13",why:"3 × 4 + 1."}],
 problems:[
  {id:"c2f",title:"Celsius to Fahrenheit",brief:"Write a function `c2f` that takes a temperature in Celsius and returns it in Fahrenheit: F = C × 9/5 + 32. It should work on a whole vector of temperatures too.\n\nTry it at the top of your script, for example `c2f(100)`.",
   starter:m`% Try your function here, e.g.
% c2f(100)

function f = c2f(c)
    % your code here
end
`,tests:[{eq:[["c2f(0)","32"],["c2f(100)","212"],["c2f(-40)","-40"],["c2f([0 100])","[32 212]"]]}],hints:["Inside the function, set f = ...;","f = c * 9 / 5 + 32;"],solution:m`function f = c2f(c)
    f = c * 9 / 5 + 32;
end`},
  {id:"is-even",title:"Is it even?",brief:"Write a function `is_even(n)` that returns true if n is even and false otherwise.",starter:m`function tf = is_even(n)
    % your code here
end
`,tests:[{eq:[["is_even(4)","true"],["is_even(7)","false"],["is_even(0)","true"],["is_even(-3)","false"]]}],hints:["An even number has remainder 0 when divided by 2.","tf = mod(n, 2) == 0;"],solution:m`function tf = is_even(n)
    tf = mod(n, 2) == 0;
end`},
  {id:"stats",title:"Three answers",brief:"Write a function `stats` that takes a vector and returns three outputs: its smallest value, largest value and average, in that order.\n\n```\n[lo, hi, avg] = stats([4 1 9 6])\n```\n\nshould give lo = 1, hi = 9, avg = 5.",starter:m`function [lo, hi, avg] = stats(x)
    % your code here
end
`,tests:[{check:m`[a, b, c] = stats([4 1 9 6]);
assert(a == 1, 'The first output should be the smallest value: stats([4 1 9 6]) should give lo = 1.');
assert(b == 9, 'The second output should be the largest value: hi = 9 for [4 1 9 6].');
assert(abs(c - 5) < 1e-9, 'The third output should be the average: 5 for [4 1 9 6].');
[a, b, c] = stats([2 2]);
assert(a == 2 && b == 2 && c == 2, 'stats([2 2]) should give 2, 2 and 2.');`,label:"stats([4 1 9 6]) and stats([2 2])"}],
   hints:["Set all three outputs inside the function.","lo = min(x); hi = max(x); avg = mean(x);"],solution:m`function [lo, hi, avg] = stats(x)
    lo = min(x);
    hi = max(x);
    avg = mean(x);
end`},
  {id:"fv-func",title:"Future value function",brief:"Write `future_value(P, rate, years)`, which returns P × (1 + rate)^years. Don't round it.",starter:m`function fv = future_value(P, rate, years)
    % your code here
end
`,tests:[{eq:[["future_value(1000, 0.05, 10)","1000*1.05^10"],["future_value(500, 0, 3)","500"],["future_value(100, 0.1, 2)","121"]]}],hints:["fv = P * (1 + rate)^years;"],solution:m`function fv = future_value(P, rate, years)
    fv = P * (1 + rate)^years;
end`},
  {id:"anon-area",title:"A one-line function",brief:"Create `area`, an anonymous function that gives the area of a circle from its radius, π r². It should work on a vector of radiuses too, so use `.^`.",starter:"",
   tests:[{eq:[["area(2)","4*pi"],["area([1 2])","[pi 4*pi]"]]}],hints:["area = @(r) ...;","area = @(r) pi * r.^2;"],solution:m`area = @(r) pi * r.^2;`},
  {id:"count-above",title:"Count above a limit",brief:"Write `count_above(x, limit)`, which returns how many elements of x are greater than limit.",starter:m`function n = count_above(x, limit)
    % your code here
end
`,tests:[{eq:[["count_above([1 5 8 2 9], 4)","3"],["count_above([1 2], 5)","0"],["count_above([5 5 6], 5)","1"]]}],hints:["x > limit marks the ones you want.","n = nnz(x > limit);"],solution:m`function n = count_above(x, limit)
    n = nnz(x > limit);
end`}]},

/* ======================================================================= 15 */
{n:15,ref:null,title:"Cell arrays and structures",
 sections:[
  {h:"When an array isn't enough",p:"An ordinary array holds values of one type, and a matrix's rows must be the same length. A list of names like 'Ada', 'Grace' and 'Alan' has different lengths, so it doesn't fit in a char matrix. Cell arrays and structures solve that."},
  {h:"Cell arrays",p:"A cell array is made with curly braces. Each cell can hold anything: text, a number, a whole matrix.\n\n- `c{2}` (curly braces) gets what's inside cell 2.\n- `c(2)` (round brackets) gets a smaller cell array containing cell 2, which is rarely what you want.",code:m`names = {'Ada', 'Grace', 'Alan'};
names{2}
numel(names)`},
  {h:"Looping over a cell array",p:"Loop over positions and use curly braces to get each item.",code:m`names = {'Ada', 'Grace', 'Alan'};
for k = 1:numel(names)
    fprintf('Hello, %s!\n', names{k})
end`},
  {h:"Structures",p:"A structure groups related values under field names, using a dot: `s.name = 'Ada'`. It's like a record or a form with labelled boxes. Read a field the same way: `s.name`. `fieldnames(s)` lists the fields.",code:m`s.name = 'Ada';
s.born = 1815;
s.languages = {'English', 'French'};
s
age_at_1843 = 1843 - s.born`},
  {h:"Structure arrays",p:"`people(2).name = 'Alan'` makes a structure array: a list of records with the same fields. `[people.born]` collects one field from every record into a vector, ready for `mean` or `max`.",code:m`people(1).name = 'Ada';  people(1).born = 1815;
people(2).name = 'Alan'; people(2).born = 1912;
years = [people.born]`},
  {h:"Finding a match in a list",p:"`strcmp(names, 'Grace')` compares each cell with 'Grace' and gives a logical array, so `scores(strcmp(names, 'Grace'))` finds Grace's score."}],
 takeaways:["{ } makes a cell array; each cell can hold anything.","c{k} gets the contents; c(k) gets a cell.","s.field stores and reads named values in a structure.","s(k).field makes a structure array; [s.field] collects a field.","strcmp(cellArray, text) finds matches."],
 quick:[
  {q:"What is the value of x?",code:m`c = {10, 'hi', [1 2]};
x = c{1};`,v:"x",a:"10",why:"Curly braces get the contents of cell 1."},
  {q:"What is the value of n?",code:m`c = {'a', 'bb', 'ccc'};
n = numel(c);`,v:"n",a:"3",why:"Three cells, whatever is inside them."},
  {q:"What does this display?",code:m`c = {'red', 'green'};
disp(c{2})`,a:"green",why:"c{2} is the text 'green'."},
  {q:"c = {'red', 'green'}. What is the difference between c(2) and c{2}?",opts:["c(2) is a 1×1 cell containing 'green'; c{2} is the text 'green' itself","They're the same","c(2) is an error","c{2} is a cell"],a:0,why:"Round brackets select cells; curly braces open them."},
  {q:"What is the value of d?",code:m`s.x = 3;
s.y = 4;
d = sqrt(s.x^2 + s.y^2);`,v:"d",a:"5",why:"Fields are read with a dot."},
  {q:"What is the value of m?",code:m`p(1).age = 30;
p(2).age = 40;
m = mean([p.age]);`,v:"m",a:"35",why:"[p.age] collects [30 40]."},
  {q:"What is the value of t?",code:m`names = {'Ada', 'Grace', 'Alan'};
t = strcmp(names, 'Alan');`,v:"t",a:"[0 0 1]",why:"strcmp compares each cell with 'Alan'."}],
 problems:[
  {id:"name-list",title:"A list of names",brief:"`names` is a cell array of names. Create `count`, how many names there are, and `second`, the second name as text (not a cell).",pre:"names = {'Ada', 'Grace', 'Alan'};",starter:"",
   tests:[{eq:[["count","3"],["second","'Grace'"]]},{pre:"names = {'Sam', 'Lee'};",eq:[["count","2"],["second","'Lee'"]]}],hints:["numel(names) counts the cells.","Curly braces get the text out: names{2}"],solution:m`count = numel(names);
second = names{2};`},
  {id:"greet-all",title:"Greet everyone",brief:"Print `Hello, NAME!` on its own line for each name in `names`, in order.",pre:"names = {'Ada', 'Grace', 'Alan'};",starter:"",
   tests:[{out:"Hello, Ada!\nHello, Grace!\nHello, Alan!"},{pre:"names = {'Sam'};",out:"Hello, Sam!"}],hints:["for k = 1:numel(names)","fprintf('Hello, %s!\\n', names{k})"],solution:m`for k = 1:numel(names)
    fprintf('Hello, %s!\n', names{k})
end`},
  {id:"record",title:"Make a record",brief:"Create a structure `book` with three fields: `title` is `'Dune'`, `author` is `'Frank Herbert'` and `year` is 1965.",starter:"",
   tests:[{eq:[["book","want = struct('title', 'Dune', 'author', 'Frank Herbert', 'year', 1965);"]]}],hints:["book.title = 'Dune';","Add book.author and book.year the same way."],solution:m`book.title = 'Dune';
book.author = 'Frank Herbert';
book.year = 1965;`},
  {id:"avg-age",title:"Average age",brief:"`people` is a structure array, and each person has a `name` and an `age`. Create `avg`, their average age.",pre:"people = struct('name', {'Ada', 'Alan', 'Grace'}, 'age', {36, 41, 85});",starter:"",
   tests:[{eq:[["avg","54"]]},{pre:"people = struct('name', {'A', 'B'}, 'age', {20, 30});",eq:[["avg","25"]]}],hints:["[people.age] collects every age into a vector.","avg = mean([people.age]);"],solution:m`avg = mean([people.age]);`},
  {id:"lookup",title:"Look it up",brief:"`names` and `scores` line up: `scores(k)` belongs to `names{k}`. Create `score`, the score of the person whose name is in `who`.",pre:"names = {'Ada', 'Grace', 'Alan'};\nscores = [91 85 78];\nwho = 'Grace';",starter:"",
   tests:[{eq:[["score","85"]]},{pre:"names = {'Ada', 'Grace', 'Alan'};\nscores = [91 85 78];\nwho = 'Alan';",eq:[["score","78"]]}],hints:["strcmp(names, who) marks the matching name.","score = scores(strcmp(names, who));"],solution:m`score = scores(strcmp(names, who));`}]},

/* ======================================================================= 16 */
{n:16,ref:"Final Project",title:"Putting it together",
 sections:[
  {h:"Bigger problems",p:"Real problems mix everything: arrays, indexing, loops, decisions, functions and plots. The trick is to break them into small steps you already know how to do, and check each step with Run before moving on."},
  {h:"A way to work",p:"- Read the problem and write down, in comments, the steps you'll take.\n- Do one step, Run, and look at the workspace to check the result.\n- When you're stuck, print the variables with `disp` or leave off a semicolon to see them.\n- Only then put it all together."},
  {h:"Matrix multiplication, for real",p:"If `prices` has one row per day and one column per stock, and `shares` holds how many of each stock you own, then `prices * shares'` gives the portfolio's value on each day in one step. Each row of prices is multiplied element by element with the shares, then added up. That's exactly what `*` (without the dot) does."},
  {h:"What next",p:"After this course, do MATLAB Onramp's final project, then try MathWorks' free short courses (Simulink Onramp, Machine Learning Onramp) or the MATLAB Fundamentals course if your university provides it. Practice on real data: download a share price history as CSV and use `readtable` in MATLAB to load it."}],
 takeaways:["Break a problem into small steps.","Run after each step and check the workspace.","prices * shares' values a portfolio day by day.","Next: Onramp's final project, then real data."],
 quick:[
  {q:"What is the value of v?",code:m`prices = [10 20; 11 19];
shares = [2 1];
v = prices * shares';`,v:"v",a:"[40; 41]",why:"Day 1: 10×2 + 20×1 = 40. Day 2: 11×2 + 19×1 = 41."},
  {q:"What is the value of ma?",code:m`x = [2 4 6 8];
ma = (x(1:end-1) + x(2:end)) / 2;`,v:"ma",a:"[3 5 7]",why:"The average of each neighbouring pair."},
  {q:"What does this display?",code:m`scores = [70 90 80];
[best, who] = max(scores);
fprintf('Student %d scored %d\n', who, best)`,a:"Student 2 scored 90",why:"max gives 90 at position 2."},
  {q:"Your code gives the wrong answer and you don't know why. What's the best first step?",opts:["Remove some semicolons (or add disp) to see the values step by step","Rewrite it from scratch","Add more brackets","Use format long"],a:0,why:"Seeing the intermediate values shows exactly where it goes wrong."}],
 problems:[
  {id:"moving-avg",title:"Moving average",brief:"A 3-day moving average smooths out noisy prices: each value is the average of 3 days in a row. Create `ma`, the averages of every window of `k` consecutive prices, from the first window to the last. With 6 prices and k = 3 there are 4 windows, so `ma` has 4 elements.",
   pre:"prices = [10 11 12 13 15 14];\nk = 3;",starter:"",
   tests:[{eq:[["ma","[11 12 13.3333333333 14]"]]},{pre:"prices = [1 2 3 4 5];\nk = 2;",eq:[["ma","[1.5 2.5 3.5 4.5]"]]},{pre:"prices = [5 7 9];\nk = 3;",eq:[["ma","7"]]}],
   hints:["There are numel(prices) - k + 1 windows. Window i covers prices(i : i+k-1).","ma = zeros(1, n); for i = 1:n, ma(i) = mean(prices(i:i+k-1)); end"],solution:m`n = numel(prices) - k + 1;
ma = zeros(1, n);
for i = 1:n
    ma(i) = mean(prices(i:i+k-1));
end`},
  {id:"grade-report",title:"Grade report",brief:"`scores` has one row per student and one column per test. Print each student's average to 1 decimal place, then the number of the student with the best average:\n\n```\nStudent 1: 80.0\nStudent 2: 65.0\nStudent 3: 91.7\nTop student: 3\n```",pre:"scores = [70 80 90; 60 65 70; 88 92 95];",starter:"",
   tests:[{out:"Student 1: 80.0\nStudent 2: 65.0\nStudent 3: 91.7\nTop student: 3"},{pre:"scores = [50 60; 100 90];",out:"Student 1: 55.0\nStudent 2: 95.0\nTop student: 2"}],
   hints:["mean(scores, 2) gives each student's average as a column.","Loop over the students to print, then [~, top] = max(avgs)."],solution:m`avgs = mean(scores, 2);
for k = 1:numel(avgs)
    fprintf('Student %d: %.1f\n', k, avgs(k))
end
[~, top] = max(avgs);
fprintf('Top student: %d\n', top)`},
  {id:"mortgage",title:"Monthly loan payment",brief:"A loan of `P` at an annual interest rate `annual` is repaid monthly over `years` years. With monthly rate r = annual / 12 and n = years × 12 payments, the monthly payment is\n\n```\nM = P × r / (1 − (1 + r)^(−n))\n```\n\nCreate `payment`, M rounded to 2 decimal places, and `interest`, the total interest paid (M × n − P), also rounded to 2 decimal places. Use the unrounded M for the interest.",
   pre:"P = 200000;\nannual = 0.05;\nyears = 25;",starter:"",
   tests:[{eq:[["payment","r = annual/12; n = years*12; M = P*r/(1-(1+r)^(-n)); want = round(M, 2);"],["interest","r = annual/12; n = years*12; M = P*r/(1-(1+r)^(-n)); want = round(M*n - P, 2);"]]},{pre:"P = 10000;\nannual = 0.06;\nyears = 2;",eq:[["payment","443.21"],["interest","r = annual/12; n = years*12; M = P*r/(1-(1+r)^(-n)); want = round(M*n - P, 2);"]]}],
   hints:["Work out r and n first, then M.","Careful with brackets: (1 + r)^(-n)."],solution:m`r = annual / 12;
n = years * 12;
M = P * r / (1 - (1 + r)^(-n));
payment = round(M, 2);
interest = round(M * n - P, 2);`},
  {id:"portfolio",title:"Portfolio value",brief:"`prices` has one row per day and one column per stock. `shares` says how many of each stock you hold. Create `value`, a column with the portfolio's total value on each day, then `best` and `day`: the highest value and the day it happened.\n\nMatrix multiplication does the first part in one line (see this unit's lesson).",
   pre:"shares = [10 5 20];\nprices = [100 50 20; 102 49 21; 101 52 19];",starter:"",
   tests:[{eq:[["value","[1650; 1685; 1650]"],["best","1685"],["day","2"]]},{pre:"shares = [1 1];\nprices = [5 5; 3 3; 9 1];",eq:[["value","[10; 6; 10]"],["best","10"],["day","1"]]}],
   hints:["value = prices * shares'; (the ' makes shares a column).","[best, day] = max(value);"],solution:m`value = prices * shares';
[best, day] = max(value);`},
  {id:"temp-report",title:"Temperature report",brief:"`temps` holds two weeks of daily temperatures. Do three things:\n\n- create `hot`, the number of days above 25\n- create `avg`, the average temperature\n- plot the temperatures (day number on the x-axis, which `plot(temps)` gives you) with a title and both axis labels",
   pre:"temps = [21 23 26 28 24 22 27 29 30 25 24 26 23 22];",starter:"",
   tests:[{eq:[["hot","6"],["avg","mean(temps)"]],plot:{y:"temps",title:true,xlabel:true,ylabel:true}},{pre:"temps = [30 10 26];",eq:[["hot","2"],["avg","22"]],plot:{y:"temps"}}],
   hints:["nnz(temps > 25) counts the hot days.","plot(temps), then title, xlabel and ylabel."],solution:m`hot = nnz(temps > 25);
avg = mean(temps);
plot(temps)
title('Daily temperature')
xlabel('Day')
ylabel('Temperature')`}]}
];
