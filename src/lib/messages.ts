/**
 * postMessage protocol between the admin center and its preview iframe.
 *
 * The preview is a real page load of `/?draft=1` in an iframe rather than an
 * inline render, so what you see is genuinely the site — same components, same
 * fixed positioning, same stylesheet — and not an approximation of it. These
 * two message types are the whole protocol: the frame announces it is ready,
 * and the admin pushes config at it on every edit.
 *
 * Both sides check `event.origin` against their own origin before acting, and
 * the receiver still runs the payload through normalizeConfig.
 */

export const DRAFT_MESSAGE = "xfolio:draft-config";
export const DRAFT_READY = "xfolio:preview-ready";
