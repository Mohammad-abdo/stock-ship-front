# Bilingual Font Setup Implementation

## Files Changed

### 1. **src/index.css**
**Why:** Global stylesheet where Tailwind is imported. This is the correct place for global font rules.

**Changes:**
- Added Google Fonts imports (Cairo, Titillium Web, Amiri)
- Added default font rule: `html *:not(i)` → "Titillium Web"
- Added Arabic font override: `html:lang(ar) *:not(i)` → "Amiri" with `!important`

### 2. **index.html**
**Why:** Set default language to Arabic as requested.

**Changes:**
- Changed `lang="en"` to `lang="ar"`
- Added `dir="rtl"` for RTL layout

### 3. **src/main.jsx**
**Why:** Initialize language from localStorage on app startup to ensure persistence.

**Changes:**
- Read language from localStorage (default: 'ar')
- Set `document.documentElement.lang` and `dir` attributes immediately
- Ensures correct font loads from the start (reduces FOUC)

### 4. **src/hooks/useLanguage.js** (NEW)
**Why:** Centralized language state management with localStorage persistence.

**Changes:**
- Custom hook that manages language state
- Automatically updates HTML `lang` and `dir` attributes
- Persists to localStorage
- Returns `[language, setLanguage]` tuple

### 5. **src/components/Navbar.jsx**
**Why:** Language selector in navbar needs to actually change language.

**Changes:**
- Import `useLanguage` hook
- Replace language dropdown Links with buttons that call `setLanguage`
- Update HTML attributes when language changes
- Close sidebar after language change

### 6. **src/components/NavbarBottom.jsx**
**Why:** Language selector in bottom navbar also needs to work.

**Changes:**
- Import `useLanguage` hook
- Pass `onLanguageChange` handler to `DesktopDropdownPortal`
- Update `DesktopDropdownPortal` to handle language items as buttons instead of Links
- Update HTML attributes when language changes

### 7. **src/App.css**
**Why:** Remove conflicting font-family declaration.

**Changes:**
- Removed `font-family: 'Almarai', sans-serif` from body
- Fonts now controlled globally by index.css based on lang attribute

## How It Works

1. **On Page Load:**
   - `main.jsx` reads language from localStorage (default: 'ar')
   - Sets `html lang="ar"` and `dir="rtl"`
   - CSS applies "Amiri" font to all text (except `<i>` icons)

2. **When User Switches Language:**
   - User clicks "العربية" or "English" in language dropdown
   - `setLanguage()` is called with 'ar' or 'en'
   - Hook updates:
     - `document.documentElement.lang` → 'ar' or 'en'
     - `document.documentElement.dir` → 'rtl' or 'ltr'
     - localStorage → saves preference
   - CSS automatically applies correct font:
     - `lang="ar"` → "Amiri" serif
     - `lang="en"` → "Titillium Web" sans-serif

3. **Font Application:**
   - Default: All elements use "Titillium Web"
   - Arabic override: When `html:lang(ar)`, all elements use "Amiri" with `!important`
   - Icons excluded: `*:not(i)` ensures icon fonts aren't affected

## Test Checklist

### ✅ Language Switching
- [ ] Click "العربية" in Navbar → Font changes to Amiri immediately
- [ ] Click "English" in Navbar → Font changes to Titillium Web immediately
- [ ] Click language in NavbarBottom → Same behavior
- [ ] Check browser DevTools → `html lang` attribute updates correctly
- [ ] Check browser DevTools → `html dir` attribute updates correctly (rtl/ltr)

### ✅ Persistence
- [ ] Switch to English → Refresh page → Language stays English
- [ ] Switch to Arabic → Refresh page → Language stays Arabic
- [ ] Check localStorage → `stockship_language` key exists with correct value

### ✅ Font Application
- [ ] With `lang="ar"`: All text uses Amiri (check computed styles)
- [ ] With `lang="en"`: All text uses Titillium Web (check computed styles)
- [ ] Icons (`<i>` elements) are NOT affected by font rules
- [ ] No FOUC (Flash of Unstyled Content) - fonts load early

### ✅ Layout Direction
- [ ] Arabic (`lang="ar"`): Layout is RTL (`dir="rtl"`)
- [ ] English (`lang="en"`): Layout is LTR (`dir="ltr"`)

## Technical Details

- **Font Loading:** Google Fonts imported at top of CSS (early load, reduces FOUC)
- **Specificity:** Arabic rule uses `!important` to override default
- **Icon Protection:** `*:not(i)` selector ensures icon fonts (Font Awesome, Lucide, etc.) aren't affected
- **State Management:** Simple hook with localStorage, no complex i18n library needed
- **Performance:** Language preference loaded synchronously in main.jsx before React renders

## Notes

- Default language is **Arabic** as requested
- Fonts apply to all text elements except `<i>` tags
- Language preference persists across page refreshes
- Both Navbar and NavbarBottom language selectors work identically
- No breaking changes to existing components

