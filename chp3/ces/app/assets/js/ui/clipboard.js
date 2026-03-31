export async function copyTextToClipboard(text) {
  if (!text) return { ok: false, mode: "empty" };

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, mode: "navigator.clipboard" };
    } catch (error) {
      // fall through
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (copied) return { ok: true, mode: "execCommand" };
  } catch (error) {
    document.body.removeChild(textarea);
  }
  return { ok: false, mode: "manual" };
}
