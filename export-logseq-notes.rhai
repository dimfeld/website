let autotags = #{
  "sql": "databases",
  "rust": "rust",
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ergo": "ergo",
  "svelte": "Svelte",
  "sveltekit": "Svelte"
};

let site_category = page.get_attr_first("site-category");
let public_attr = page.get_attr_first("public") == "true";
let publish_title = page.get_attr_first("publish-title");
if !publish_title.is_empty() {
  page.title = publish_title;
  page.url_name = to_slug(publish_title);
} else if page.title.starts_with("Writing/") {
  page.title = page.title.sub_string("Writing/".len);
  page.url_name = to_slug(page.title);
}

fn process_html_attrs(block) {
  let wrap_el = block.get_attr_first("wrap-el");
  if !wrap_el.is_empty() {
    block.wrapper_element = wrap_el;
  }

  let content_el = block.get_attr_first("content-el");
  if !content_el.is_empty() {
    block.content_element = content_el;
  }

  let classes = block.get_attr("wrap-class");
  if !classes.is_empty() {
    block.classlist = classes;
  }

  return block;
}

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
} else if site_category == "writing" {
  page.include = public_attr;
  page.url_base = "/writing";
  page.path_base = "pkm-pages/writing";

  each_block(9999, |block, depth| {
    if depth == 0 {
      block.view_type = ViewType::Document;
    } else if depth == 1 {
      if block.contents.starts_with("Contents") {
        block.include = BlockInclude::OnlyChildren;
      } else {
        block.include = BlockInclude::Exclude;
      }
    } else {
      return process_html_attrs(block)
    }
  });
} else {
  page.url_base = "/notes";
  page.path_base = "pkm-pages/notes";

  let include = false;
  let exclude = false;

  if public_attr {
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

  let remove_prefix = [
    "full-title:",
    "category:",
    "Highlights first synced",
    "New highlights added"
  ];

  each_block(9999, |block, depth| {
    let tags = block.tags;
    if !exclude && tags.some(|t| t in exclude_tags) {
      exclude = true;
    } else if include == false && tags.some(|t| t in include_tags) {
      include = true;
    }

    // Add all the hashtags seen in the content.
    page.add_tags(tags);

    if remove_prefix.some(|prefix| block.contents.starts_with(prefix)) {
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
        } else if t == "ML" {
          page.add_tag("Machine Learning")
        }
      }
    }

    if page.tags.contains("ML") {
      page.remove_tag("ML");
      page.add_tag("Machine Learning");
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

