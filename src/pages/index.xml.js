export async function GET({ redirect }) {
  return redirect('/rss.xml', 301);
}