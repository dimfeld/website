import got from 'got';

export default async function (request, response) {
  let data = await got(
    `https://svelte.dev/repl/${request.query.id}.json`
  ).json();
  response.setHeader('Cache-Control', 'max-age=0, s-maxage=86400');
  response.json(data);
}
