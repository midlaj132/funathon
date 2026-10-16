# OverThink Calculator — The Calculator That Makes Math Harder

**Why solve it simply when you can overthink it?**

OverThink Calculator is a deliberately overdramatic, mathematically correct calculator built for the FUNATHON college hackathon. Flask serves the page locally; calculation, questions, fake verification, animations, sound and stats all run in the browser. There are no API keys, paid services, or external runtime assets.

## Project structure

```text
overthink-calculator/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

## Features

- Addition, subtraction, multiplication, division, decimals, parentheses, unary negative numbers, and postfix percentages (for example, `25%` is `0.25`).
- A hand-written recursive-descent expression parser; user input is never passed to JavaScript `eval()`.
- Random funny questions, simulated math-square human verification, confidence check, and a fake `2 + 2` intelligence test.
- A theatrical loading screen with an adjustable 1–8 second duration and a reveal-now escape hatch.
- Genius Mode skips the questions and verification and uses a brief loading animation.
- Dramatic answer cards, sarcastic messages, and confetti for short calculations.
- Live uselessness score, question count, wasted-time counter, and completed-calculation count.
- Calculation history, light/dark themes, generated sound effects with a mute control, and a nonsense explanation of `2 + 2 = 4`.
- Responsive layout for laptop and phone screens. Theme, sound preference, stats, and recent history are saved in browser storage.
- The calculator works offline after Flask has been installed. Fonts use local system fallbacks; no CDN or API is needed.

## Create the files in VS Code

1. Create a folder named `overthink-calculator` and open it in VS Code (**File → Open Folder**).
2. Create `app.py`, `requirements.txt`, and `README.md` in the folder.
3. Create `templates/index.html`.
4. Create `static/css/style.css` and `static/js/script.js`.
5. Paste the matching source into each file. The Flask template and static-file paths depend on these exact folder names.

## Run on Windows

Open a terminal in the `overthink-calculator` folder and run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser. Keep the terminal open while presenting the app. To stop the local server, press **Ctrl+C**.

If PowerShell blocks environment activation, either use a one-session policy override and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Or skip activation and use the virtual environment's interpreter directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

## How to use it

1. Type an expression or use the keypad. Keyboard input is supported; **Enter** starts the calculation and **Esc** clears the expression.
2. Choose a drama duration from 1 to 8 seconds. During the flow, use **Skip the drama — reveal answer now** whenever patience runs out.
3. Answer the randomly selected questions and complete the harmless fake verifications, or enable **Genius Mode** to bypass them.
4. View the correct answer, stats, and history. Select a history row to put its expression back in the calculator.
5. Use **Make it more complicated** to wrap a valid expression in extra operations that preserve its value.
6. Toggle the sun/moon for the theme, the speaker for sound, or open the absurd `2 + 2` explanation.

The percentage key applies a postfix percentage to the immediately preceding value: `50%` evaluates to `0.5`. Standard arithmetic precedence applies, and parentheses can change grouping. Multiplication must be explicit (`2 * (3 + 1)`, not `2(3 + 1)`).

## Validation examples

| Expression | Expected result |
|---|---:|
| `2 + 2` | `4` |
| `3.5 * 2` | `7` |
| `(-8 + 3) * 2` | `-10` |
| `(18 + 2) * 5` | `100` |
| `25% + 0.5` | `0.75` |
| `9 / 0` | Clear division-by-zero message |

Malformed expressions such as `2 +` and unsupported characters produce an error message rather than a result.

## Troubleshooting

- **`py` or `python` is not recognized:** Install Python 3 from python.org, enable **Add Python to PATH**, reopen the terminal, and try `python --version`.
- **PowerShell says scripts are disabled:** Use the process-only policy override above, or use `.\.venv\Scripts\python.exe` directly without activating the environment.
- **`ModuleNotFoundError: No module named 'flask'`:** Activate `.venv` and run `python -m pip install -r requirements.txt` again. Confirm that installation and `python app.py` use the same interpreter.
- **Port 5000 is already in use:** Stop the other local app using that port, then run `python app.py` again.
- **The page returns “TemplateNotFound” or has no styling:** Confirm the folder names and locations match the project structure, then restart Flask.
- **Sound is silent:** Some browsers require a user interaction before sound can play. Click a calculator key first and check that the speaker icon is not muted. Sound is optional; calculations still work.
- **Stats do not persist:** The browser may be blocking local storage. The calculator remains usable, but stats/history may reset when the page closes.

## FUNATHON judge demo

1. Introduce the tagline: “Why solve it simply when you can overthink it?”
2. Enter `2 + 2`, start the flow, and answer the emotional-readiness question.
3. Complete the “select all squares containing mathematics” check and fake intelligence test.
4. Let the dramatic loading bar finish, then point out the correct answer and confetti.
5. Show the uselessness score and history, click **Make it more complicated**, and demonstrate **Genius Mode** for the impatient judge.
6. Finish with **Explain why 2 + 2 = 4** to deliver the imaginary peer-reviewed sock theory.

## Five funny example calculations

1. `2 + 2` — **4**. “Please try to remain calm.”
2. `3.5 * 2` — **7**. A decimal has been doubled. Notify the department.
3. `(-8 + 3) * 2` — **-10**. A negative number has made a strong comeback.
4. `(18 + 2) * 5` — **100**. A perfectly round result, suspiciously achieved.
5. `25% + 0.5` — **0.75**. Three quarters, after a deeply unnecessary journey.
