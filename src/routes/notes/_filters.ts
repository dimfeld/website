import { Post } from '../../staticApi/readPosts';

export function filterText(notes: Post[], searchValue: string) {
  if (searchValue) {
    searchValue = searchValue.toLowerCase();
    return notes.filter((n: Post) =>
      n.title.toLowerCase().includes(searchValue)
    );
  } else {
    return notes;
  }
}
