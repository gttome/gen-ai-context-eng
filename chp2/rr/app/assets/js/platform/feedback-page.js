import { initShellMeta } from './shell.js';

const FEEDBACK_KEY = 'rr_lab_feedback_v1_5';

initShellMeta({ version: 'v1.5.0' });

const titleInput = document.getElementById('feedback-title');
const bodyInput = document.getElementById('feedback-body');
const status = document.getElementById('feedback-status');
const saveButton = document.getElementById('save-feedback');
const copyButton = document.getElementById('copy-feedback');
const clearButton = document.getElementById('clear-feedback');

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSaved() {
  const payload = {
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    updatedAt: new Date().toISOString(),
    version: 'v1.5.0'
  };
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(payload));
  status.textContent = `Saved locally at ${new Date(payload.updatedAt).toLocaleString()}.`;
  status.className = 'status-banner good';
}

function buildNote() {
  const title = titleInput.value.trim() || 'Rubric Runner Lab feedback';
  const body = bodyInput.value.trim() || 'No details entered yet.';
  return [
    `Title: ${title}`,
    `Version: v1.5.0`,
    `Environment: ${window.location.protocol === 'file:' ? 'File' : window.location.hostname || 'Local'}`,
    'Context:',
    '- Scenario / screen: [add here]',
    '- Observed behavior: [add here]',
    '- Expected behavior: [add here]',
    '- Recommended next iteration action: [add here]',
    '',
    'Notes:',
    body
  ].join('\n');
}

const saved = readSaved();
if (saved.title) titleInput.value = saved.title;
if (saved.body) bodyInput.value = saved.body;
if (saved.updatedAt) {
  status.textContent = `Loaded locally saved feedback from ${new Date(saved.updatedAt).toLocaleString()}.`;
  status.className = 'status-banner';
}

saveButton.addEventListener('click', writeSaved);
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildNote());
    status.textContent = 'Structured feedback note copied to clipboard.';
    status.className = 'status-banner good';
  } catch {
    status.textContent = 'Clipboard copy failed. You can still save locally and copy manually.';
    status.className = 'status-banner warn';
  }
});
clearButton.addEventListener('click', () => {
  titleInput.value = '';
  bodyInput.value = '';
  localStorage.removeItem(FEEDBACK_KEY);
  status.textContent = 'Local feedback draft cleared.';
  status.className = 'status-banner';
});
