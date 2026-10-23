# MATLAB Learn

Free daily MATLAB practice from absolute zero. The early units follow the order of [MATLAB Onramp](https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted), MathWorks' free intro course. Later units go further, into text, loops, functions, cell arrays and structures.

**Live site:** https://chak720.github.io/matlab-learn/ (once GitHub Pages is switched on)

- **Daily**: today's lesson, a three-question warm-up, then three coding problems: two new ones from where you are in the course, and one you've seen before to solve from memory.
- **Learn**: 16 units, from `3 + 4` to portfolio maths. Each unit has a plain-English lesson with examples you can run, quick questions, and checked coding problems that teach as you go.
- **Practice**: drill quick questions by unit, or re-solve any problem from a blank page.
- **Playground**: a scratch editor that runs any code and shows the output, plots and workspace.
- **Profile**: problems solved, accuracy per unit, a 5-week heatmap and your review queue.

Your code runs in the browser on a small MATLAB engine built into the site (`assets/mlab.js`), so nothing is installed and nothing is sent anywhere. It covers what the course needs: numbers, matrices, logical arrays, text and strings, cell arrays, structures, scripts with local functions, `if`/`for`/`while`/`switch`, anonymous functions, `fprintf`, and line, bar and scatter plots. It isn't the full MATLAB, so for bigger work use MATLAB Online or the desktop app.

Progress is saved in your browser only. Use **Profile → Copy progress** to move it to another device.

## How it's built

Plain HTML, CSS and JavaScript with no build step, so any static host works.

- `assets/mlab.js`: the MATLAB interpreter (lexer, parser, about 300 built-in functions, display formatting, plot recording) and the checker
- `assets/curriculum.js`: units, lessons, quick questions, problems and their tests
- `assets/app.js`: views, daily set, progress, plot drawing
- `tools/selftest.js`: checks that every solution passes, every starter fails, and every quick-question answer and lesson example is right. Run `node tools/selftest.js` after editing the curriculum.
- `tools/crosscheck.js`: compares the interpreter's results with GNU Octave on a list of snippets
- `daily.json` (optional): a daily message and up to two extra problems, picked up automatically when present. Check one with `node tools/selftest.js daily.json`.
