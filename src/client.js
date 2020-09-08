import * as sapper from '@sapper/app';

sapper
  .start({
    target: document.querySelector('#sapper'),
  })
  .then(() => sapper.prefetchRoutes(['/notes', '/writing', '/about']));
