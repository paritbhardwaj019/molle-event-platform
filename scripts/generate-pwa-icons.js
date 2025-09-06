const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputIcon = path.join(__dirname, "../public/icons/icon.png");
const outputDir = path.join(__dirname, "../public/icons");

async function generateIcons() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the original icon
    const originalIcon = sharp(inputIcon);

    // Generate each icon size
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      await originalIcon
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
        })
        .png()
        .toFile(outputPath);

      console.log(`Generated: icon-${size}x${size}.png`);
    }

    console.log("All PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generateIcons();
