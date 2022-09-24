
if page.is_journal {
  page.url_base = "/journals";
  page.path_base = "pkm-pages/journals";

  let saw_content_block = false;
  page.each_block(1, |depth| {
    if depth == 0 {
      // The top level
      this.view_type = ViewType::Document;
    } else if this.contents == "Journal" {
      this.include = BlockInclude::OnlyChildren;
      saw_content_block = true;
      // debug(this.contents);
    } else if this.contents == "Learning" ||
        this.contents == "Links" {
      this.view_type = ViewType::Bullet;
      this.heading = 3;
      this.include = BlockInclude::IfChildrenPresent;
      saw_content_block = true;
      // debug(this.contents);
    } else if depth > 0 {
      this.include = BlockInclude::Exclude;
    }
  });

  //if saw_content_block {
  //  debug(page.title);
  //}
  page.allow_render(saw_content_block);
} else {
  page.url_base = "/notes";
  page.path_base = "pkm-pages/notes";

  let include = false;
  let exclude = false;

  if page.get_attr_first("public") == "true" {
    include = true;
  }

  let new_slug = page.get_attr_first("note-export");
  if new_slug.len > 0 {
    page.path_name = new_slug + ".html";
  }

  let exclude_tags = [
    "Areas",
    "CV",
    "syntax-test"
  ];

  let include_tags = [
    "learning",
    "svelte",
    "SQL",
    "database",
    "Mental Models",
    "JTBD",
    "note-export"
  ];

  page.each_block(9999, |depth| {
    let tags = this.tags;
    if !exclude && tags.some(|t| t in exclude_tags) {
      exclude = true;
    } else if !include && tags.some(|t| t in include_tags) {
      include = true;
    }

    if this.contents.starts_with("Highlights first synced") ||
          this.contents.starts_with("New highlights added") {
      this.include = BlockInclude::Exclude;
    }
  });

  if !exclude {
    page.allow_embedding = AllowEmbed::Yes;
  }
  page.allow_render(include && !exclude);
}

