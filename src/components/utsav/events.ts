export const UTSAV_OPEN = "eventura:utsav-open";
export function openUtsav() {
  window.dispatchEvent(new Event(UTSAV_OPEN));
}
