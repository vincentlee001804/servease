# Testing the Language Selection Modal

## Quick Test Steps

### Test Scenario 1: New User (First Visit)
1. **Clear localStorage:**
   - Open Browser DevTools (F12)
   - Go to **Console** tab
   - Run: `localStorage.removeItem('user_language_preference')`
   - Or go to **Application** tab → **Local Storage** → Delete `user_language_preference`

2. **Navigate to Vendor Page:**
   - Visit: `http://localhost:3000/en/vendor/VENDOR_ID`
   - Or scan the QR code

3. **Expected Result:**
   - ✅ Language selection modal appears immediately
   - ✅ Shows "Welcome / Selamat Datang / 欢迎"
   - ✅ Three language buttons visible (English, Bahasa Melayu, 中文)

### Test Scenario 2: Select Language from Modal
1. **After modal appears:**
   - Click on any language button (e.g., "Bahasa Melayu")
   
2. **Expected Result:**
   - ✅ Modal closes
   - ✅ Toast notification appears: "Language changed to Bahasa Melayu"
   - ✅ Page language changes to selected language
   - ✅ URL updates to new language (e.g., `/bm/vendor/...`)

3. **Check localStorage:**
   - Open DevTools Console
   - Run: `localStorage.getItem('user_language_preference')`
   - ✅ Should return: `"bm"` (or the selected language code)

### Test Scenario 3: Returning User (No Modal)
1. **After selecting a language:**
   - Refresh the page (F5)
   - Or navigate away and come back

2. **Expected Result:**
   - ✅ Modal does NOT appear
   - ✅ Page loads in the previously selected language
   - ✅ Language preference is remembered

### Test Scenario 4: Change Language via Header Switcher
1. **Click the language icon** (🌐) in the header
2. **Select a different language** from the dropdown/bottom sheet

3. **Expected Result:**
   - ✅ Language changes immediately
   - ✅ Toast notification appears
   - ✅ localStorage is updated
   - ✅ URL updates to new language

4. **Refresh page:**
   - ✅ Modal still does NOT appear (preference exists)
   - ✅ Page loads in the NEW language

### Test Scenario 5: Mobile Bottom Sheet
1. **Open vendor page on mobile device** (or use browser DevTools mobile view)
2. **Click the language icon** in the header

3. **Expected Result:**
   - ✅ Bottom sheet slides up from bottom
   - ✅ Shows drag handle at top
   - ✅ Large buttons with flags
   - ✅ Can select language

### Test Scenario 6: Desktop Dropdown
1. **Open vendor page on desktop** (or desktop browser view)
2. **Click the language icon** in the header

3. **Expected Result:**
   - ✅ Dropdown menu appears below icon
   - ✅ Compact design with flags
   - ✅ Current language highlighted

## Browser Console Commands for Testing

```javascript
// Check current language preference
localStorage.getItem('user_language_preference')

// Clear language preference (simulate new user)
localStorage.removeItem('user_language_preference')

// Set specific language preference
localStorage.setItem('user_language_preference', 'en')  // or 'bm' or 'jtzw'

// Check all localStorage items
console.log(localStorage)

// Clear all localStorage (nuclear option)
localStorage.clear()
```

## Testing Checklist

- [ ] Modal appears when `user_language_preference` is missing
- [ ] Modal does NOT appear when preference exists
- [ ] Selecting language from modal saves to localStorage
- [ ] Selecting language from modal closes modal
- [ ] Selecting language from modal shows toast notification
- [ ] Selecting language from modal updates URL
- [ ] Header switcher works on mobile (bottom sheet)
- [ ] Header switcher works on desktop (dropdown)
- [ ] Header switcher saves to localStorage
- [ ] Language persists after page refresh
- [ ] Language persists after navigating away and back
- [ ] Both modal and header switcher stay in sync

## Common Issues & Solutions

### Issue: Modal doesn't appear
**Solution:** 
- Check if `user_language_preference` exists in localStorage
- Clear it: `localStorage.removeItem('user_language_preference')`
- Refresh page

### Issue: Modal appears every time
**Solution:**
- Check if `changeLanguage()` function is being called
- Verify localStorage is being set correctly
- Check browser console for errors

### Issue: Language doesn't persist
**Solution:**
- Check localStorage in DevTools
- Verify the `changeLanguage()` function is saving to localStorage
- Check if browser is blocking localStorage (private/incognito mode)

### Issue: Header switcher doesn't work
**Solution:**
- Check if `handleLanguageChange()` is being called
- Verify the click handler is attached
- Check browser console for JavaScript errors

