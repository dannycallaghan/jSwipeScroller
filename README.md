Will complete this, and add a demo, when I have the time. Apologies.

# jSwipeScroller

A horizontal scrolling component, primarily for mobile devices, based on the scrolling articles list seen in the iOS BBC News app.

## Features

- Allows for swipe left and right gestures.
- Passed vertical scroll back to the device.
- Can be used with images, links, text, anything.
- Calculates the viewport width, and the width of the scrolling items to 'intelligently' scroll the list. For example - a device that can display 3 items at a time, using a list containing 7 items will show items 1 - 3 initally, 4 - 6 after the first swipe/scroll, and 5 - 7 on the final scroll. Never any unnecessary whitespace.
- Auto adjust after oritentation change. For example - a device that can display 3 items at a time in portrait mode is scrolled to the end, and shows items 5 - 7 (as above). If that devices oritantation changes to landscape, and it can now show 4 items completely, the list automatically scrolls right, so items 4 - 7 are now shown.
- Bounceback effect, like iOS, when a scroll is not possible (scrolling left when on 'page' 1).
- Uses drag and drop on desktops to simulate touch events.
- Uses navigation arrows when gestures aren't possible (Windows Mobile).
- Lost of other stuff...

## Compatability

- Tested on iOS 4 - 5, Android 1.6 - 2.3, Windows Mobile; desktop in Chrome, Safari, Firefox, IE7, IE8.

