# Client PC Install Runbook

Runbook for Claude Code to follow when starting a fresh session on the client's Windows 10 PC. The human operator handles GUI installers; Claude handles everything scriptable and verifies each step.

## Context

- Target: client's Windows 10 desktop, Brother QL-800 printer attached via USB.
- Goal: get the print agent running on boot, producing correct labels end-to-end.
- Human has a USB stick with four installers: Node.js LTS x64, Git for Windows, Brother QL-800 driver, Brother b-PAC 3 SDK x64.
- Human has GitHub access to clone the repo and the production `.env` values to paste in.
- Repo will live at `C:\kafemashini\` (short path, no spaces, not under Program Files).

## Phase 1 — verify human-installed prerequisites

Ask the human to confirm each is done, then verify from the shell.

1. **Node.js installed.** Run `node --version` and `npm --version`. Expect Node v22.x. If "command not found," the installer didn't add to PATH — have the human open a fresh terminal (PATH only updates in new shells).
2. **Git installed.** Run `git --version`. Any recent 2.x is fine.
3. **Brother QL-800 driver installed and printer plugged in.** Run in PowerShell: `Get-Printer | Where-Object Name -like "*Brother*"`. Must show a printer named exactly `Brother QL-800`. If the name is different, either rename it in Windows or note the actual name to use in `.env` later.
4. **QL-800 paper size set to 62mm continuous.** Run `Get-PrintConfiguration -PrinterName "Brother QL-800"` and check the paper size. If wrong, the human must fix it through the Windows printer preferences GUI (Settings → Printers → Brother QL-800 → Printing preferences). This is a silent failure mode — prints will come out wrong size with no error.
5. **Brother b-PAC 3 SDK installed (x64).** Verify the COM class is registered by running in PowerShell: `New-Object -ComObject bpac.Document`. Success means a COM object prints; failure with "class not registered" means the SDK is missing or the wrong bitness was installed. Must match Node bitness (Node x64 → b-PAC x64).

Do not proceed past this phase until all five verifications pass.

## Phase 2 — clone and build

1. `cd /c/` and `git clone <repo-url> kafemashini`. Ask the human for the repo URL and any auth if the clone prompts for credentials.
2. `cd kafemashini` and `npm install`. This populates the root `node_modules/` (workspaces hoist dependencies to the root, not to `apps/print-agent/node_modules/` — this is expected).
3. `npm run build`. Confirms the agent compiles on this machine and produces `apps/print-agent/dist/index.js`. If the repo already has a committed `dist/`, the build still runs cleanly.

## Phase 3 — configure environment

1. Check if `apps/print-agent/.env` exists. If not, create it.
2. Required keys (ask the human for each value, do not guess):
   - `SUPABASE_URL` — production Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — production service role key. Treat as a secret; do not log it.
   - `WEB_BASE_URL` — production web app URL (used to build QR code links). Must match the deployed web app exactly, otherwise QR codes on labels point nowhere useful and there is no way to tell by looking at a printed label.
   - `LABEL_PRINTER_NAME` — `Brother QL-800` (or whatever Phase 1 step 3 revealed).
   - `LABEL_TEMPLATE_PATH` — `./assets/label.lbx`.
   - `PRINT_POLL_INTERVAL_MS` — `5000`.
3. After writing `.env`, read it back and confirm every line is present and non-empty (except do not print the service role key to the terminal — just check `grep -c ^SUPABASE_SERVICE_ROLE_KEY apps/print-agent/.env` is 1).

## Phase 4 — first run smoke test

1. From `apps/print-agent/`, run `./start-print-agent.bat` (or `cmd //c start-print-agent.bat` from bash). Expect three startup lines: printer name, template path, poll interval.
2. Ask the human to submit a test intake from the production web app on their phone or another device.
3. Watch the agent console. Within ~5 seconds you should see `processing job <id>` followed by `job <id> printed OK`, and a label should come out of the printer.
4. If the job is claimed but printing fails, read the error from the console. Most likely causes:
   - b-PAC COM class not registered — go back to Phase 1 step 5.
   - Template path wrong — verify `apps/print-agent/assets/label.lbx` exists.
   - Printer name mismatch — re-check `Get-Printer` output vs `.env`.
   - Paper size wrong — label prints but looks mangled or wrong dimensions.
5. If the label prints but the QR code scans to the wrong URL, `WEB_BASE_URL` in `.env` is wrong. Fix and restart the agent.
6. Do a second test print to confirm back-to-back printing works (there is a deliberate 2-second gap between jobs — this is expected and correct).

## Phase 5 — auto-start on login

1. Create a shortcut to `C:\kafemashini\apps\print-agent\start-print-agent.bat` in the current user's Startup folder. Scriptable via PowerShell:
   ```powershell
   $ws = New-Object -ComObject WScript.Shell
   $lnk = $ws.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Kafemashini Print Agent.lnk")
   $lnk.TargetPath = "C:\kafemashini\apps\print-agent\start-print-agent.bat"
   $lnk.WorkingDirectory = "C:\kafemashini\apps\print-agent"
   $lnk.Save()
   ```
2. Verify the shortcut exists: `Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Kafemashini Print Agent.lnk"` should return `True`.
3. Optionally create a matching shortcut on the Desktop so the client can manually relaunch if the window ever gets closed. Same script, different path: `[Environment]::GetFolderPath('Desktop')`.

## Phase 6 — reboot verification

This step is not optional. Do not consider the install finished until it passes.

1. Close the running print agent window.
2. Ask the human to reboot the PC and log back in.
3. Session will disconnect during reboot. On reconnect:
   - Verify the print agent console window is visible and shows the three startup lines.
   - Ask the human to submit one more test intake.
   - Confirm it prints.
4. If the agent did not auto-launch, check the Startup shortcut's `TargetPath` and `WorkingDirectory` are both correct (the `WorkingDirectory` matters — the agent resolves the template and PowerShell script via `process.cwd()`).

## Known gotchas

- Root `node_modules/` vs `apps/print-agent/node_modules/`: workspaces hoist to root. Do not try to `npm install` inside `apps/print-agent/` directly; it won't help and may confuse things.
- b-PAC SDK bitness must match Node bitness. Mismatch produces "class not registered" at print time, not at agent startup.
- `start-print-agent.bat` uses `cd /d "%~dp0"` so it works from any launch location including the Startup shortcut. Do not remove this line.
- The visible console window is intentional. It is the client's only signal that printing is alive. Do not hide it or convert the setup to a Windows service.
- Failed print jobs are never auto-retried. If a test print fails, the job stays in `failed` status; the client reprints manually from the intake detail page.
