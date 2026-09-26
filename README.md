# Hilltop Manor — The Family Crypt

**In the family crypt**  
Invited to pay respects for the late Henrietta Crane

A complete static character app with 17 characters from the supplied photos and screenshots. Players enter their six-digit code to open their own dossier. The character wording and red/private distinctions are preserved; the labeled catchphrase sections are excluded. Printed small capitals are displayed in sentence case.

## Open the app

Open `index.html` and use the file picker to choose the included `characters.xlsx`. For a hosted website, the workbook loads automatically. The **Guest Codes** sheet lists every character and code. For a quick preview, Michelle Myers is **816015**.

The app includes Your character, Share in red, Personality trait, Suggested dress, three act tabs, and Am I the murderer? It displays: **Share the information in red with your fellow guests.**

## Upload to GitHub Pages

1. Unzip the download. Upload **all contents inside the Hilltop-Manor folder** to the root of your GitHub repository. `index.html` and `characters.xlsx` must be beside one another. Keep the `assets` folder and all JavaScript/CSS files.
2. In the repository, open **Settings → Pages**.
3. Under Build and deployment, choose **Deploy from a branch**, select your branch (usually `main`), select **/(root)**, and save.
4. Wait for GitHub Pages to finish publishing, then open the URL shown there.

No build step or API key is needed. Official setup reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Edit the Excel workbook

Open `characters.xlsx` in Excel and edit the **Characters** sheet. Keep sheet names and column headers unchanged. Save in `.xlsx` format, replace the file in the repository, and wait for Pages to redeploy. Players should reload and re-enter their codes after an update. If using the separately downloaded `hilltop-characters.xlsx`, rename it to `characters.xlsx` before uploading it to the site.

| Column | What it controls |
| --- | --- |
| Code | A unique, fixed six-digit player code; keep it as text to preserve leading zeros. |
| Name | Character name, displayed in red. |
| Occupation | The supplied occupation; red markers control which portions are shared. |
| Information | The supplied introduction or background. |
| Personality | The supplied personality instructions. |
| Dress | Optional costume guidance. |
| Act1, Act2, Act3 | Optional dialogue, including line breaks. |
| Murderer | `UNASSIGNED` for everyone, or exactly one `YES` and `NO` for all other characters. |
| Reveal | Optional private text displayed after opening the role reveal. |
| Source | Reference to the original supplied image; not displayed to players. |

Use `[red]shared text[/red]` in Occupation, Information, or Personality to mark the exact red portions. Text outside these markers remains private guidance. The app uses these markers, not the Excel font color. Keep Edward H. Rulloff's mixed red/black passages intact. Belle Gunness's personality paragraph is red in the supplied screenshot and is included in her Share in red tab.

No murderer, act dialogue, or explicit costume instructions were supplied. These fields are intentionally unassigned or blank. To activate the dramatic private role reveal, set Murderer to YES for one person and NO for all others. A character's background crimes do not automatically designate that person as the murderer of this mystery.

The **Settings** sheet controls the location and invitation context. **Guest Codes** links to the Characters sheet, and **Host Guide** includes editing instructions. The supplied 17 code rows are already set up; if adding more characters, extend the Guest Codes formulas too.

## Files and behavior

- `index.html`, `style.css`, `app.js`: the website.
- `characters.xlsx`: the editable source of all character content.
- `assets/crypt.webp`: the candlelit crypt backdrop.
- `favicon.svg`: the Hilltop Manor monogram.
- `xlsx.full.min.js` and `SHEETJS-LICENSE.txt`: the bundled Excel reader and its license (SheetJS CE 0.20.3).
- `.nojekyll`: tells GitHub Pages this is a static site.

The layout adapts to mobile screens. Tabs support keyboard navigation, red passages also carry sharing labels, focus states are visible, and reduced-motion preferences are respected. The app uses no autoplay sound, flashing effects, analytics, or browser storage. Fonts load from Google Fonts when available, with local serif/sans-serif fallbacks.

Codes keep casual spoilers out of the interface; they are not server-side authentication. As with any static GitHub Pages app, the workbook can be downloaded and contains every character and code. Give each guest only their own code. **Lock & leave** clears the current dossier from the screen.
