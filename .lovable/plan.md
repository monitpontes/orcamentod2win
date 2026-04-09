

## Plan: Update PDF identity + Add search bar in "Abrir" dialog

### 1. Update PDF visual identity (`src/lib/generatePdf.ts`)

Update colors and branding to match the system's d2win identity:

- **PRIMARY** color: change from `[30, 58, 95]` to `[26, 39, 68]` (navy `#1a2744` from CSS `--primary: 217 60% 18%`)
- **ACCENT** color: change from `[249, 115, 22]` (orange) to `[8, 145, 178]` (cyan `#0891b2` from CSS `--accent: 199 90% 42%`)
- Replace all "VibMonitor" text with **"d2win"**
- Update subtitle to **"Sistema de Orçamentos"**
- Update footer text to "d2win — Sistema de Orçamentos"
- Update filename prefix from `Proposta_VibMonitor_` to `Proposta_d2win_`
- Embed the d2win logo in the PDF header (convert the JPEG asset to base64 and use `doc.addImage`)

### 2. Add search bar in "Abrir" dialog (`src/pages/Index.tsx`)

- Add a search `Input` with a search icon at the top of the dialog content
- Filter `savedBudgets` list by name or client name (case-insensitive)
- Use local state `searchQuery` for the filter

### Files to modify
- `src/lib/generatePdf.ts` — colors, branding, logo
- `src/pages/Index.tsx` — search input in load dialog

