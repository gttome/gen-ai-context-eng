export function actionRow(buttons = []) {
  return `<div class="card-actions">${buttons.join("")}</div>`;
}

export function calloutCard(title, body, variant = "") {
  return `<div class="callout ${variant}"><h3>${title}</h3>${body}</div>`;
}

export function stageIntro(title, body) {
  return `<div class="stage-intro"><h2>${title}</h2><p class="muted">${body}</p></div>`;
}

export function twoColumnStage(left, right) {
  return `<div class="two-col">${left}${right}</div>`;
}
