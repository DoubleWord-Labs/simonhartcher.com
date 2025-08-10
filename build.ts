import Bun from 'bun';
import { $ } from "bun";

// Process images first
console.log("Processing images...");
for await (const line of $`bun src/scripts/processImages.ts`.lines()) {
    console.info(line);
}

// Build CSS
await Bun.build({
    entrypoints: ["assets/styles.css"],
    outdir: "assets",
    naming: "[name].min.[ext]",
    minify: true,
})

// Build JS
await Bun.build({
    entrypoints: ["index.ts"],
    outdir: "assets",
    naming: "[dir]/main.min.[ext]",
    minify: true,
});

// Format assets.zig file
console.log("Formatting assets.zig file...");
try {
    await $`zig fmt assets.zig`;
    console.log('Successfully formatted assets.zig');
} catch (error) {
    console.warn(`Could not format assets.zig: ${error.message}`);
}
