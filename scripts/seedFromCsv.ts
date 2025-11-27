import fs from 'fs';
import path from 'path';

// No need for Supabase client or dotenv for SQL generation
// Ideally user should provide service role, but I'll try with what I have. 
// If RLS blocks, I might need the user to run SQL. 
// Actually, the previous seed script used a direct SQL generation approach or client insert. 
// I will generate a SQL file for the user to run, as that's safer and bypasses RLS issues if they run it in dashboard.
// OR I can try to insert if I have the right policies.
// Let's generate a SQL file "seed_belgium.sql" - it's robust.


const csvPath = path.join(process.cwd(), 'airbnb (1).csv');

// Helper to parse CSV line respecting quotes
function parseCsvLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Extra high-quality images to ensure 4+ images per listing
const EXTRA_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
];

const BELGIUM_LOCATIONS = [
  "Brussels", "Brussel", "Antwerp", "Antwerpen", "Ghent", "Gent", "Bruges", "Brugge", 
  "Liège", "Liege", "Namur", "Leuven", "Mons", "Aalst", "Mechelen", "Ostend", "Oostende", 
  "Koksijde", "Ferrières", "Knokke", "Blankenberge", "De Haan", "Durbuy", "Spa", "Dinant"
];

function getRandomImages(count: number): string[] {
  const shuffled = [...EXTRA_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function cleanPrice(priceStr: string): number {
  // Remove currency symbols, commas, etc.
  // Input might be "₱216,041"
  const numeric = priceStr.replace(/[^0-9.]/g, '');
  const val = parseFloat(numeric);
  
  // Convert PHP to EUR roughly (divide by 60) and divide by 5 nights (assuming 5 nights)
  // Or just make it a realistic monthly/nightly price.
  // Let's assume the CSV price is for the "5 nights" mentioned in another column.
  // So Price / 5 / 60 = EUR per night.
  // 216000 / 5 = 43200 PHP / 60 = 720 EUR.
  
  if (isNaN(val)) return 1500; // Default
  
  return Math.round((val / 5) / 60); 
}

async function generateSeedSql() {
  try {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = parseCsvLine(lines[0]);
    
    // Indices based on inspection
    // "i11046vh src" -> Image
    // "t1jojoys" -> Location/Title
    // "t6mzqp7" -> Name
    // "a8jt5op" -> Bedrooms
    // "umg93v9" -> Price
    
    const idxImage = headers.findIndex(h => h.includes('src'));
    const idxLoc = headers.findIndex(h => h === 't1jojoys');
    const idxName = headers.findIndex(h => h === 't6mzqp7');
    const idxBedrooms = headers.findIndex(h => h === 'a8jt5op');
    const idxPrice = headers.findIndex(h => h === 'umg93v9');

    let sql = `
      -- Clear existing listings (optional, comment out if you want to append)
      -- DELETE FROM public.listings;

      INSERT INTO public.listings (
        name, 
        type, 
        address, 
        price, 
        size, 
        bedrooms, 
        description, 
        "petsAllowed", 
        "imageUrls", 
        "energyClass", 
        coordinates
      ) VALUES
    `;

    const values: string[] = [];
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = parseCsvLine(line);
      
      const rawLoc = cols[idxLoc] || "";
      const name = cols[idxName] || "Beautiful Home";
      const rawPrice = cols[idxPrice] || "0";
      const rawBedrooms = cols[idxBedrooms] || "1 bedroom";
      const mainImage = cols[idxImage] || "";

      // Filter for Belgium
      const isBelgium = BELGIUM_LOCATIONS.some(loc => rawLoc.toLowerCase().includes(loc.toLowerCase()));
      
      if (!isBelgium) continue;

      // Clean data
      const address = rawLoc.replace("Home in ", "") + ", Belgium";
      const price = cleanPrice(rawPrice);
      const bedrooms = parseInt(rawBedrooms) || 2;
      const size = bedrooms * 40 + Math.floor(Math.random() * 50); // Estimate size
      
      // Images
      const extraImages = getRandomImages(4);
      const allImages = [mainImage, ...extraImages].filter(img => img);
      
      // Type
      let type = 'house';
      if (name.toLowerCase().includes('apartment') || name.toLowerCase().includes('condo')) type = 'apartment';
      if (name.toLowerCase().includes('villa')) type = 'villa';
      if (name.toLowerCase().includes('loft')) type = 'loft';

      // Escape SQL strings
      const escape = (str: string) => str.replace(/'/g, "''");
      
      const row = `(
        '${escape(name)}',
        '${type}',
        '${escape(address)}',
        ${price},
        ${size},
        ${bedrooms},
        'Experience luxury living in this beautiful ${type} in ${escape(address)}. Features modern amenities, spacious rooms, and stunning views.',
        ${Math.random() > 0.5},
        ARRAY[${allImages.map(url => `'${url}'`).join(',')}],
        '${Math.random() > 0.7 ? 'A' : 'B'}',
        '{"lat": ${50.85 + (Math.random() - 0.5)}, "lng": ${4.35 + (Math.random() - 0.5)}}'
      )`;
      
      values.push(row);
      count++;
    }

    if (values.length > 0) {
      sql += values.join(',\n');
      sql += ';';
      
      fs.writeFileSync('seed_belgium.sql', sql);
      console.log(`Generated seed_belgium.sql with ${count} listings.`);
    } else {
      console.log("No matching Belgium listings found.");
    }

  } catch (err) {
    console.error("Error generating seed:", err);
  }
}

generateSeedSql();
