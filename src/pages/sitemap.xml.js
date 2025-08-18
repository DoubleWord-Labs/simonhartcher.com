export async function GET({ redirect }) {
  return redirect('/sitemap-index.xml', 301);
}