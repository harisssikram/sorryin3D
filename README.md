# For you — a little apology from Haris

A private, offline 3D adventure for a desktop or laptop. Five connected miniature islands, ten hidden hearts, ten puzzles, and short messages from Haris about listening, taking responsibility, and treating her with care.

## Play

Extract the entire folder. Open `START-Windows.bat` on Windows or `START-Mac-Linux.command` on macOS/Linux. Python 3 must be installed. You can also run `python3 start.py` from this folder. Keep the terminal open while playing.

The game opens a private address on your own computer. No account, upload, or internet connection is required. On a desktop, the browser window needs to be wider than 900 pixels.

## Controls

- **WASD / arrow keys:** walk as the girl labeled **YOU**.
- **Shift:** run. **Space:** hop. **Drag:** turn the camera. **Scroll:** zoom.
- **M / World map:** switch between the rear camera and the full map.
- **Click a pink heart / Walk to this heart:** follow a golden trail across bridges and around scenery. **Esc / Stop walking:** cancel travel.
- **Walk near a heart:** its puzzle opens automatically. **E** reopens a dismissed nearby heart.
- **Mint envelope markers:** finish an unread keepsake. **Journal:** revisit messages.
- **Hint 1 / 2:** get a nudge, then a second hint if needed. At the paper-boat pier, steer with **A / D**, arrow keys, or the on-screen buttons.
- Music and volume controls are in the upper right.

Explore the Heart Garden, Rain Garden, Lantern Meadow, Starlight Hill, and Promise Pier. Haris waits at the pier. Finish all ten keepsakes to walk to him and open his letter.

Progress, your position, the camera direction, and your selected task are saved in this browser at the local address. The launcher now uses the same port (4173) every time, so returning to the game restores the same browser save. Saves from the previous five-heart edition are preserved at that address. Use Start a new hunt after the ending to replay.

“My baby” is an endearment in Haris’s messages, not her name. The character is labeled “You.”

## Files

The game is in `dist/`. There is no build step. Three.js, fonts, models, sound synthesis, styles and scripts are all included. Third-party licenses are in `dist/licenses/`.

## Refined edition

Jointed knees and elbows, blinking, breathing, moving hair, a nearby wave from Haris, and walking around the pier. Walking uses acceleration, braking, personal space, collision boundaries, bridge heights, and gravity for small hops. The camera retracts near walls and roofs. Blossoms sway, water moves, lanterns cast soft pools of color, and golden trails guide each journey.

The paper-boat task uses momentum, drag, and a changing current. Gates wait when missed. Puzzle hints and unfinished keepsake markers keep the adventure easy to resume.

## Thoughtful challenge edition

Every challenge is signed “Haris made this for you.” Ten tasks combine deduction, a four-digit code, three memory rounds, listening scenarios, an evening plan with time and budget limits, a route with two stops, steering through a current, and a sliding heart mosaic. The listening task asks how Haris can respect a stated request; it never asks the player to forgive him.

Board attempts and completed memory/listening rounds resume when reopened, even after a refresh. The boat remains a short continuous run. Hints give two small nudges. Undo and reset controls let you rethink a route or a slide. The journal’s **Replay puzzle** button revisits any unlocked challenge without removing hearts or keepsakes. Existing saves are preserved.

## A world that grows with you

- Meet Haris at the pier. Press **F** nearby to invite him along or ask him to wait. He follows paths around water and scenery and remembers where you left him.
- The mini-map shows you, Haris, and island completion. Click it or press **M** for the full world.
- Completed keepsakes grow flowers on their island and light a gem around the central pond.
- Each solved challenge has a heart reward screen. The heart is saved immediately; read Haris’s note now or return through the journal later.
- **P** pauses and resumes. Settings include Balanced/Detailed graphics, gentle motion, and **Save a copy / Load a copy**. Volume, music preference, and visual settings persist.
- Progress keeps a local backup. If the current save becomes unreadable, the game tries the backup. Save copies let you move the hunt to another computer or browser.
- Running includes subtle leaning, jumps buffer a press just before landing, and steps sound different on bridges. Music softens while reading.

The launcher uses port 4173 by default. If another game server is already using it, return to that tab or close that server before starting again. A different port has a separate browser save; use a save copy to transfer progress.

## Camera and piano update

The rear camera searches for a clear angle above or around roofs, walls, and Haris before moving closer. A character crossing the camera is briefly hidden as a whole, preventing cut-open faces. The full-map view is unchanged.

The soundtrack is an original 68 BPM piano theme with a 16-bar melody, soft sustained chords, gentle room ambience, and quieter footsteps. Music still follows the volume, mute, and pause settings.
