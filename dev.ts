import { $ } from "bun";
import { watch } from "fs";
import http from "http";
import nodeStatic from "node-static";

const doBuild = async () => {
  for await (const line of $`bun run build -Ddebug 2>&1`.lines()) {
    console.info(line);
  }
};

await doBuild();

const include = ["src", "assets/styles.css", "content/images", "content/posts/images", "content/pages/images"];

watch(
  import.meta.dir,
  {
    recursive: true,
  },
  async (event, filename) => {
    if (filename && include.some((path) => filename.startsWith(path))) {
      console.log("File changed:", filename, event);

      await doBuild();
    }
  }
);

const server = new nodeStatic.Server("zig-out");

http
  .createServer((req, res) => {
    req.addListener("end", () => server.serve(req, res)).resume();
  })
  .listen(1990);
