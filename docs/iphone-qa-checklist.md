# iPhone QA checklist

Use this on a real iPhone, in Safari, against a production build (`npm run build && npm start`) or the shared tunnel. The phone companion is `/phone`. Sample lodging, permits, and the gig agreement are example data.

Do one pass after a fresh install, and one pass after **Explore demo data**.

## Install

1. On Wi-Fi, open `/phone` in Safari.
2. Tap Share, then **Add to Home Screen**. The icon is the amber mark on ink, and the name is BandCamp.
3. Open BandCamp from the home screen. It should be standalone: no Safari toolbar, starting on the road view.
4. Force-quit and open it again. The same profile, dates, and tour should still be there.

## Airplane mode

1. While online, open the home screen app once so the shell can cache. Visit Tour and a gig so those screens are cached too.
2. Turn on Airplane mode.
3. Open the app. Saved dates and the tour should still be readable. A line at the top says the phone is offline.
4. Accept, counter, or send a note. More → This device should say the change will sync later.
5. Turn Airplane mode off and leave the app open. The queued change should clear, with a “Synced” notice.
6. Reload. The change should still be in the book.

## Keyboard overlap

1. Open a screen with a field: a gig counter, a message, or sign-up.
2. Focus the field. The keyboard should resize the page (`interactive-widget=resizes-content` on browsers that support it) so the field and the button stay above the keyboard.
3. Type a few lines. The caret should stay visible. Scroll the phone content if the note is long.
4. Dismiss the keyboard. The bottom tabs should sit above the home indicator, not under it.

## Safe areas

1. On an iPhone with a notch or a home indicator, check the header. The wordmark sits below the status bar (`safe-area-inset-top`).
2. Check Book, Tour, Profile, and More. The labels sit above the home indicator (`safe-area-inset-bottom`).
3. Open More. The sheet’s last control, **Reset demo data**, should clear the home indicator.
4. Rotate to landscape once. Nothing should sit under the notch.

## Audio playback

1. As a band or a venue, open Mesa Dust (or any profile with a sample).
2. Tap play on a sample. Audio should start. The iPhone silent switch mutes some browser audio and leaves others alone; try both positions and note which one you heard.
3. Lock the screen for a few seconds, then unlock. Playback may stop. That is acceptable. The play control should still work after unlock.
4. A sample you upload stays in this browser. It is not inside the JSON backup.

## Share sheet

1. Open a confirmed show (Mesa Dust at The Yucca Room is public).
2. Tap **Share with fans**. iOS should open the system share sheet with the show title and link.
3. Cancel the sheet. The show should stay put.
4. Share into Messages or copy the link. The link should open the same confirmed show.
5. From a flyer, tap **Share** if a file is ready. The sheet should offer the image. Cancel is not an error.

## Settings

1. More → **This device** (fans: Profile / You, since fans have no More tab).
2. **Export JSON** downloads `bandcamp-backup.json`.
3. **Reset demo data** restores the seeded book. A profile you created should still be listed.
4. **Import JSON** brings the backup back, including dates and the tour plan.
