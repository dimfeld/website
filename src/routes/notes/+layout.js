export async function load({ fetch }) {
  let [{ notes }, tags] = await Promise.all([
    fetch('/notes/list.json').then((r) => r.json()),
    fetch('/notes/tags.json').then((r) => r.json()),
  ]);

  return { notes, tags };
}
