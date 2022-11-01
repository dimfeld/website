let autotags = #{
  "sql": "databases",
  "rust": "rust",
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ergo": "ergo"
};

if page.is_journal {
  page.url_base = "/journals";
  page.path_base = "pkm-pages/journals";

  // The title has dashes instead of underscores, which makes for a nicer id.
  page.path_name = page.title + ".html";

  let saw_content_block = false;
  each_block(1, |block, depth| {
    if depth == 0 {
      // The top level
      block.view_type = ViewType::Document;
    } else if block.contents == "Journal" {
      block.include = BlockInclude::OnlyChildren;
      saw_content_block = true;

      let tags = autotag(autotags, block.id);
      page.add_tags(tags);
    } else if block.contents == "Learning" ||
        block.contents == "Links" {
      if block.contents == "Learning" {
        block.view_type = ViewType::Document;
      } else {
        block.view_type = ViewType::Bullet;
      }
      block.heading = 3;
      block.include = BlockInclude::IfChildrenPresent;
      saw_content_block = true;

      let tags = autotag(autotags, block.id);
      page.add_tags(tags);
    } else if depth > 0 {
      block.include = BlockInclude::Exclude;
    }
  });

  page.include = saw_content_block;
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

  each_block(9999, |block, depth| {
    let tags = block.tags;
    if !exclude && tags.some(|t| t in exclude_tags) {
      exclude = true;
    } else if !include && tags.some(|t| t in include_tags) {
      include = true;
    }

    // Add all the hashtags seen in the content.
    page.add_tags(tags);

    if block.contents.starts_with("Highlights first synced") ||
          block.contents.starts_with("New highlights added") {
      block.include = BlockInclude::Exclude;
    }
  });

  if !exclude {
    page.allow_embedding = AllowEmbed::Yes;
  }

  let allow = include && !exclude;
  page.include = allow;

  if allow {
    // Handle namespaced pages, setting the final element as the title and adding the other elements as tags.
    let title = page.title.split("/");
    if title.len > 1 {
      page.title = title.pop();
      for t in title {
        if t == "Book" {
          page.add_tag("Books");
        } else if t == "Article" {
          page.add_tag("Articles")
        } else if t == "Projects" {
          page.add_tag("Projects")
        }
      }
    }

    let omit_tags = [
      "Inbox",
      "In Progress",
      "Newsletter Item",
      "Done",
      "Readwise",
      "Deliberate Practice",
      "Video",
      "note-export",
      "public",
      "progress",
      "Progress",
      "tags",
      "Tags"
    ];

    // Save computation time by only doing these operations on pages that we're allowing.
    for tag in omit_tags {
      page.remove_tag(tag);
    }
  }
}

