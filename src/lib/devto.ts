export interface DevToArticle {
  post_id: string;
  body_markdown: string;
  canonical_url: string;
  url: string;
  positive_reactions_count: number;
  public_reactions_count: number;
}

export async function readDevTo(): Promise<DevToArticle[]> {
  let devtoApiKey = process.env.DEVTO_API_KEY;
  if (devtoApiKey) {
    let articles: DevToArticle[] = await fetch(
      'https://dev.to/api/articles/me/published',
      {
        headers: { api_key: devtoApiKey },
      }
    ).then((r) => r.json());

    return articles.map((p) => {
      let postId = p.canonical_url.split('/').slice(-1)[0];
      return {
        ...p,
        post_id: postId,
      };
    });
  } else {
    return [];
  }
}
