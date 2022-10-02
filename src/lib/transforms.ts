export function transformLinkToAbsolute(
  url: string,
  location: string,
  host?: string
) {
  let lastSlash = location.lastIndexOf('/');
  let sameDir = location.slice(0, lastSlash + 1);
  if (!url.includes('//')) {
    if (url[0] === '#') {
      url = `${location}${url}`;
    } else if (!url.startsWith('/')) {
      if (/\.(svg|png|jpg|gif)$/.test(url)) {
        url = `/images/${url}`;
      } else {
        url = `${sameDir}${url}`;
      }
    }

    if (host) {
      url = `${host}${url}`;
    }
  }

  return url;
}

export function journalLink(id: string) {
  const [year, month] = id.split('-');
  return `/journals/${year}/${month}/${id}`;
}
