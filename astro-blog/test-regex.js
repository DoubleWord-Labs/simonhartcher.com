const content = `\`\`\`html
<picture><source type="image/webp" srcset="/../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-thumbnail.webp 300w, /../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-small.webp 600w, /../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-medium.webp 900w, /../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-large.webp 1200w, /../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-xlarge.webp 1800w," sizes="100vw"><img src="/../posts/2025-03-27-adventures-in-game-development/1c38e298-d106-8037-9fb1-def62b09b64b-xlarge.webp" alt="Image" class=""></picture>
\`\`\``;

console.log('Original:', content);

const result = content.replace(/```html\n(<picture>.*?<\/picture>)\n```/g, (match, pictureHtml) => {
  console.log('Match found:', match);
  console.log('Picture HTML:', pictureHtml);
  
  const imgMatch = pictureHtml.match(/<img src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
  console.log('Image match:', imgMatch);
  
  if (imgMatch) {
    const [, src, alt] = imgMatch;
    const cleanSrc = src.replace('/..', '').replace('/posts/', '/blog/');
    return `<Image src="${cleanSrc}" alt="${alt}" />`;
  }
  return match;
});

console.log('Result:', result);