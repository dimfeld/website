export const config = {
  runtime: 'edge',
};

export function GET({ fetch }) {
  return fetch('https://plausible.io/js/script.js');
}
