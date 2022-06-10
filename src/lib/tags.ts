import capitalize from 'just-capitalize';

export function formatTag(tag: string) {
  return tag
    .split(' ')
    .map((word) => {
      if (word !== word.toUpperCase()) {
        word = capitalize(word);
      }
      return word;
    })
    .join(' ');
}
