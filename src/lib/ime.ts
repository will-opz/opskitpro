/** keyCode 229 also covers Safari's compositionend-before-keydown ordering. */
export function isImeComposing(event: Pick<KeyboardEvent, "isComposing" | "keyCode">) {
  return event.isComposing || event.keyCode === 229;
}
