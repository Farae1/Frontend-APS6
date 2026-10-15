/** True on a touch screen that is not a phone or tablet (the kiosk): there the page shows its own keyboard. Phones
 * keep their system keyboard. */
export const useTouchKeyboard = (): boolean =>
  window.matchMedia('(any-pointer: coarse)').matches && !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
