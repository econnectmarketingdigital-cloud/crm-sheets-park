import sharp from 'sharp';
import fs from 'fs';

async function processLogo() {
  const inputPath = "C:/Users/User 2023/.gemini/antigravity/brain/829519ed-d377-4a00-874e-ef1e2f1ffa07/.user_uploaded/media_1787553347446.png";
  
  // Get metadata
  const metadata = await sharp(inputPath).metadata();
  const size = Math.min(metadata.width, metadata.height);

  // Create an SVG circular mask with smooth antialiasing
  const circleSvg = Buffer.from(`
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#fff" />
    </svg>
  `);

  // Crop to square and apply circle mask
  const circularBuffer = await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{
      input: circleSvg,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const targets = [
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/public/logo.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/public/logo_icon.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/public/logo_full.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/public/logo_horizontal.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/public/logo_stacked.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/dist/logo.png",
    "c:/Users/User 2023/Documents/CRM SHEETS PARK/client/dist/logo_icon.png"
  ];

  for (const target of targets) {
    fs.writeFileSync(target, circularBuffer);
    console.log(`Saved circular logo to ${target}`);
  }
}

processLogo().then(() => console.log('Logo processing completed!'));
