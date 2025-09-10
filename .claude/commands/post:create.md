---
allowed-tools: Bash(date:*), Bash(mkdir)
description: Create a new blog post
---

## Command

Infer the arguments from the provided description.

When no arguments have been provided, or when the provided information is insufficient, prompt the user for the missing details.

## Context

- Current date: !`date +%F`

## What to do

Create a new blog post in the `src/content/blog/` folder.

### File name

The file name should be in the format `yyyy-mm-dd-slug.mdx`.

### Frontmatter format

```mdx
---
title: <title>
description: <description>
date: <current date>
author: "Simon Hartcher"
tags: ["Tag1", "Tag2", "Tag3"] # Example only
featured: false
draft: true
---
```

### Assets folder

Create a new folder in `src/content/blog/<filename without extension>/assets}`
