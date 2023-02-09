<script lang="ts">
  import NewsletterSignup from './components/NewsletterSignup.svelte';
  import * as contact from '$lib/contact';
</script>

<hr />
<footer>
<p>
  Thanks for reading! If you have any questions or comments, please send me a
  note on <a href="https://www.twitter.com/dimfeld">Twitter</a>
  or <a rel="me" href={contact.mastodon}>Mastodon</a>.
</p>

<p>
  Please also consider subscribing to my weekly-ish newsletter, where I announce
  new articles and share other interesting things I've found.
</p>
<NewsletterSignup />
  </footer>
