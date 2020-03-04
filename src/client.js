import * as sapper from '@sapper/app';
import 'whatwg-fetch';

sapper
  .start({
    target: document.querySelector('#sapper'),
  })
  .then(() => sapper.prefetchRoutes(['/notes', '/writing', '/about']));
