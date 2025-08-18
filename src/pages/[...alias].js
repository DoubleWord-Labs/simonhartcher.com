// Map of aliases to their corresponding post URLs
const aliasMap = {
  // Original post slugs without dates
  'howto-query-mssql-and-send-html-email-using-powershell': '/posts/2009-09-13-howto-query-mssql-and-send-html-email-using-powershell',
  'image-caching-for-a-wpf-desktop-application': '/posts/2009-12-12-image-caching-for-a-wpf-desktop-application',
  'serious-sam-hd-kleer-skeleton-surfing': '/posts/2010-01-27-serious-sam-hd-kleer-skeleton-surfing',
  'update-all-hg-repositories-using-powershell': '/posts/2012-07-05-update-all-hg-repositories-using-powershell',
  'xbox-media-centre-with-raspberry-pi': '/posts/2013-09-30-xbox-media-centre-with-raspberry-pi',
  'university-upending-my-life-and-some-history': '/posts/2013-11-17-university-upending-my-life-and-some-history',
  'how-to-build-the-native-docker-client-on-windows': '/posts/2015-03-10-how-to-build-the-native-docker-client-on-windows',
  'getting-started-with-meteor-and-react': '/posts/2015-09-28-getting-started-with-meteor-and-react',
  'git-delete-merged-deleted-branches': '/posts/2016-01-29-git-delete-merged-deleted-branches',
  'how-to-add-javascript-bundling-to-an-existing-mvc-project': '/posts/2018-10-15-how-to-add-javascript-bundling-to-an-existing-mvc-project',
  'migrating-from-styled-components-to-emotion': '/posts/2021-08-07-migrating-from-styled-components-to-emotion',
  'unrecord-is-this-game-footage-real-or-fake': '/posts/2023-04-22-unrecord-is-this-game-footage-real-or-fake',
  'get-3d-look-rotations-in-2d-with-godot-4': '/posts/2023-04-23-get-3d-look-rotations-in-2d-with-godot-4',
  'how-to-cherry-pick-a-git-commit-from-a-fork': '/posts/2023-06-08-how-to-cherry-pick-a-git-commit-from-a-fork',
  'react-behavioural-props': '/posts/2023-06-08-react-behavioural-props',
  
  // Special variants
  'how-to-add-java-script-bundling-to-an-existing-mvc-project': '/posts/2018-10-15-how-to-add-javascript-bundling-to-an-existing-mvc-project',
  'polygon-peril-prototype': '/posts/2024-01-17-polygon-peril-prototype-video-game-available-to-play-now',
};

export async function getStaticPaths() {
  return Object.keys(aliasMap).map(alias => ({
    params: { alias }
  }));
}

export async function GET({ params, redirect }) {
  const { alias } = params;
  const destination = aliasMap[alias];
  
  if (destination) {
    return redirect(destination, 301);
  }
  
  // If no alias found, return 404
  return new Response('Not Found', { status: 404 });
}