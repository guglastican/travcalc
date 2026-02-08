require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.static(__dirname));
app.use((req, res, next) => {
  if (req.url.endsWith('.xml')) {
    res.type('application/xml');
  }
  next();
});
app.use(express.json());

const ROUTES_PATH = path.join(__dirname, 'data', 'routes.json');
const PLACES_PATH = path.join(__dirname, 'data', 'places.json');

// Helper to read data
const readData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// Helper to save data
const saveData = (filePath, item) => {
  try {
    const data = readData(filePath);
    if (!data.find(r => r.slug === item.slug)) {
      data.push(item);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(`Error saving to ${filePath}:`, error);
  }
};

// Helper to clean slug (removes NY, USA, extra hyphens, etc.)
const cleanSlug = (text) => {
  if (!text) return '';
  // Take only the first part before the first comma (usually the city)
  const city = text.split(',')[0].trim();
  return city
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single one
    .replace(/^-|-$/g, ''); // Trim hyphens
};

// Distance Matrix API endpoint
app.post('/api/calculate-distance', async (req, res) => {
  try {
    const { origin, destination, mode, units } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: 'Locations required' });

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: { origins: origin, destinations: destination, mode: mode || 'driving', units: units || 'metric', key: process.env.GOOGLE_MAPS_API_KEY }
    });

    if (response.data.status !== 'OK') throw new Error(response.data.error_message || 'API Error');

    const result = response.data?.rows?.[0]?.elements?.[0];
    if (!result || result.status !== 'OK') throw new Error('Route not found');

    const originAddr = response.data.origin_addresses[0];
    const destAddr = response.data.destination_addresses[0];

    const slug = `${cleanSlug(originAddr)}-to-${cleanSlug(destAddr)}`;

    const routeData = {
      origin: originAddr,
      destination: destAddr,
      distance: result.distance.text,
      duration: result.duration.text,
      slug: slug,
      timestamp: new Date().toISOString()
    };

    saveData(ROUTES_PATH, routeData);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Distance pSEO route
app.get('/distance/:slug', async (req, res) => {
  const { slug } = req.params;
  const routes = readData(ROUTES_PATH);
  let route = routes.find(r => r.slug === slug);

  if (!route) {
    const parts = slug.split('-to-');
    if (parts.length === 2) {
      const originRaw = parts[0].replace(/-/g, ' ');
      const destRaw = parts[1].replace(/-/g, ' ');

      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: { origins: originRaw, destinations: destRaw, mode: 'driving', units: 'metric', key: process.env.GOOGLE_MAPS_API_KEY }
        });
        const result = response.data?.rows?.[0]?.elements?.[0];
        if (result && result.status === 'OK') {
          const originAddr = response.data.origin_addresses[0];
          const destAddr = response.data.destination_addresses[0];
          const clean = `${cleanSlug(originAddr)}-to-${cleanSlug(destAddr)}`;

          // Redirect to clean slug if current one is messy
          if (slug !== clean) {
            return res.redirect(301, `/distance/${clean}`);
          }

          route = {
            origin: originAddr,
            destination: destAddr,
            distance: result.distance.text,
            duration: result.duration.text,
            slug: clean,
            timestamp: new Date().toISOString()
          };
          saveData(ROUTES_PATH, route);
        }
      } catch (e) { }
    }
  }

  if (!route) return res.status(404).send('Distance route not found.');

  let html = fs.readFileSync(path.join(__dirname, 'distance.html'), 'utf8');
  const title = `Distance from ${route.origin} to ${route.destination}`;
  const description = `Find out the exact distance between ${route.origin} and ${route.destination}. Travel time is approximately ${route.duration}. Driving distance and directions.`;
  html = html.replace(/<h1 id="distanceCalculatorTitle">.*?<\/h1>/, `<h1>${dynamicTitle}</h1>`);
  const url = `https://www.calculatortrip.com/distance/${route.slug}`;

  // Generate dynamic SEO content
  const dynamicTitle = `Traveling between ${route.origin} and ${route.destination}`;
  const dynamicArticle = `
    <article class="dynamic-seo-content" style="margin-top: 40px;">
      <p>Planning a trip from <strong>${route.origin}</strong> to <strong>${route.destination}</strong>? Understanding the travel logistics is key to a smooth journey. Whether you are traveling for business or leisure, knowing the distance and estimated travel time helps you manage your schedule effectively.</p>
      
      <h2>How far is ${route.origin} from ${route.destination}?</h2>
      <p>The total driving distance between these two locations is approximately <strong>${route.distance}</strong>. Depending on traffic conditions, the estimated travel time is about <strong>${route.duration}</strong>. This route connects two vibrant areas, each offering its own unique attractions and atmosphere.</p>

      <h3>Travel Tips for your journey</h3>
      <p>When driving between ${route.origin} and ${route.destination}, it's always a good idea to check for real-time traffic updates. If you are using public transit or other modes of transport, travel times may vary significantly. Make sure to plan for breaks if you are on a long road trip to ensure safety and comfort.</p>
      
      <p>Use our calculator above to explore alternative travel modes like walking, bicycling, or transit if available for this specific route. Safe travels!</p>
    </article>
  `;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

  // Inject article before the footer or at the end of main
  html = html.replace('</main>', `
    ${dynamicArticle}
    <p style="margin-top: 20px;">Use our <a href="/distance">Distance Calculator</a> to find the exact mileage for other routes, or explore nearby accommodations with our <a href="/places">Hotel & Airport Finder</a>. If you're scheduling a complex trip, our <a href="/turnaround-time-calculator">Turnaround Day Calculator</a> can help you stay on track.</p>
  </main>`);

  // Inject OG Tags and JSON-LD
  const advancedSEO = `
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://www.calculatortrip.com/social-share.jpg">
    <link rel="canonical" href="${url}">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${url}",
      "publisher": {
        "@type": "Organization",
        "name": "Travel Calculator",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calculatortrip.com/logo.png"
        }
      }
    }
    </script>
  `;

  html = html.replace('</head>', `${advancedSEO}</head>`);
  html = html.replace('</head>', `<script>window.PSEO_DATA = ${JSON.stringify(route)};</script></head>`);
  res.send(html);
});

// Legacy redirect for /udaljenost
app.get('/udaljenost/:slug', (req, res) => {
  res.redirect(301, `/distance/${req.params.slug}`);
});

// Places pSEO route
app.get('/places/:slug', async (req, res) => {
  const { slug } = req.params;
  const type = slug.includes('hotels-in-') ? 'hotels' : slug.includes('airports-near-') ? 'airports' : null;
  const city = slug.replace('hotels-in-', '').replace('airports-near-', '').replace(/-/g, ' ');

  if (!type) return res.status(404).send('Invalid place category');

  let html = fs.readFileSync(path.join(__dirname, 'places.html'), 'utf8');
  const dynamicTitle = type === 'hotels' ? `Discover the Best Hotels in ${city}: Your Ultimate Accommodation Guide` : `Airports Near ${city}: Comprehensive Travel and Aviation Guide`;
  const title = type === 'hotels' ? `Best Hotels in ${city}` : `Airports near ${city}`;
  const description = type === 'hotels' ? `Find the best rated hotels in ${city}.` : `Locate airports near ${city}.`;
  html = html.replace('<h1>Places Finder: Hotels and Airports</h1>', `<h1 style="font-size: 2.5rem; margin-bottom: 1.5rem;">${dynamicTitle}</h1>`);

  // Generate dynamic SEO content
  const dynamicArticle = type === 'hotels'
    ? `
    <article class="dynamic-seo-content" style="margin-top: 40px; line-height: 1.8; color: #333; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
      <p>Finding the perfect place to stay in <strong>${city}</strong> is more than just picking a room; it's about setting the stage for your entire travel experience. Whether you're visiting for a high-stakes business meeting, a much-needed family vacation, or a spontaneous weekend getaway, the right accommodation can make all the difference. Our comprehensive hotel finder is designed to help you navigate the diverse lodging landscape of ${city} with ease and confidence. In this guide, we dive deep into everything you need to know about choosing the right stay, from neighborhood nuances to booking secrets that only seasoned travelers know.</p>
      
      <p>${city} is a destination that caters to every type of traveler, offering a rich tapestry of neighborhoods, each with its own unique character and charm. From the bustling energy of the city center to the serene quiet of residential districts, understanding the layout of the city is the first step in choosing your home away from home. When you search for hotels in ${city}, you aren't just looking for a bed; you're looking for a base from which to explore the local culture, cuisine, and history. The proximity to local highlights and transport links can drastically change how you perceive your time in this wonderful location.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Choosing the Perfect Neighborhood in ${city}</h2>
      <p>Before diving into specific hotel listings, it's essential to consider which area of ${city} best suits your needs. Location is often the most critical factor in guest satisfaction, impacting everything from your daily travel time to the types of restaurants and attractions you'll have at your doorstep. Each district in ${city} has its own personality, and choosing the one that aligns with your travel goals is paramount.</p>
      
      <p>If you prefer to be in the heart of the action, look for hotels in the central business district or historical center. Here, you'll find easy access to major landmarks, flagship shopping, and a high concentration of public transport links. Being in the center means you are never far from the pulse of the city, with museums, theaters, and major transport hubs just a short walk or transit ride away. However, keep in mind that these areas can be livelier and sometimes noisier, especially during peak tourist seasons or local festivals. For those seeking a more authentic, local experience, the surrounding residential neighborhoods often host charming boutique hotels and guest houses. These areas frequently offer a quieter atmosphere and the chance to discover hidden gems like neighborhood cafes, local markets, and independent bookstores that are off the beaten path for most tourists. These secondary neighborhoods often provide a glimpse into the real daily life of ${city}, away from the tourist crowds.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">A Diverse Range of Accommodations for Every Budget</h2>
      <p>${city} boasts a wide spectrum of lodging options, ensuring that regardless of your budget, you'll find something that fits. Our tool reveals everything from the heights of opulence to the most practical budget-friendly stays. Whether you are looking for a historic grand hotel or a modern minimalist space, ${city} has it all.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Luxury and Five-Star Excellence</h3>
      <p>For those who appreciate the finer things in life, ${city} offers several world-class luxury hotels. These establishments are known for their impeccable service, stunning architecture, and premium amenities such as rooftop infinity pools, award-winning spas, and fine-dining restaurants. Staying in a luxury hotel in ${city} provides an oasis of comfort where every detail is managed to perfection. Many of these properties are located in historic buildings, offering a blend of traditional elegance and modern technological convenience. You can expect personalized concierge services, high-thread-count linens, and breathtaking views of the city skyline or major landmarks.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Boutique and Independent Hotels</h3>
      <p>Boutique hotels have become increasingly popular in ${city}, offering a personalized touch that larger chains sometimes lack. These properties often feature unique interior designs, local artwork, and a deep connection to the neighborhood's culture. If you're looking for a stay with character and a welcoming, intimate atmosphere, a boutique hotel is an excellent choice. Many boutique options in ${city} are family-run or part of small collections, meaning the staff often have intimate knowledge of the best local spots that aren't in any guidebook.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Business and Practical Lodging</h3>
      <p>For visitors arriving in ${city} on business, efficiency is often the priority. Many hotels are strategically located near convention centers and financial districts, offering high-speed internet, dedicated workspaces, and meeting facilities. These hotels are designed to help you stay productive while ensuring a seamless transition from work to rest. Beyond just work facilities, these hotels often provide quick laundry services, early breakfasts, and easy access to late-night transportation, catering specifically to the needs of the modern professional traveler.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Budget-Friendly and Economy Stays</h3>
      <p>Traveling on a budget doesn't mean you have to sacrifice quality. ${city} has a wealth of reputable economy hotels, hostels, and guest houses that provide clean, safe, and comfortable environments at a fraction of the cost. By choosing a well-rated budget option, you can save more of your travel funds for exploring the city's sights and experiencing the local cuisine. Many modern hostels in ${city} also offer private rooms, combining the social atmosphere of a shared space with the privacy you desire.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Top Tips for Booking Your Ideal Hotel in ${city}</h2>
      <p>To get the best value and ensure a stress-free trip, consider the following strategies when using our finder:</p>
      <ul>
        <li><strong>Best Time to Book:</strong> Prices in ${city} can fluctuate based on local holidays, major events, and seasonal demand. Booking several weeks in advance often yields the best rates, but don't overlook last-minute deals if your travel dates are flexible. If you are visiting during a major convention or holiday, booking several months ahead is highly recommended.</li>
        <li><strong>Cancellation Policies:</strong> Always check the flexibility of your reservation. Many hotels offer free cancellation up to 24 or 48 hours before arrival, which provides peace of mind if your plans change. In the modern travel landscape, flexible booking is more valuable than ever.</li>
        <li><strong>Read Recent Reviews:</strong> While ratings provide a quick snapshot, reading detailed guest reviews can give you insights into specific aspects like the quality of the breakfast, the friendliness of the staff, and the actual noise levels in the rooms. Look for reviews from the last three to six months to get the most accurate picture.</li>
        <li><strong>Check Amenity Details:</strong> Don't assume every hotel has a gym or air conditioning. Verify the specific amenities that are important to you directly on the listing before making your choice. Some older buildings in ${city} may have unique layouts or limited elevator access, so check these details if mobility is a concern.</li>
      </ul>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Local Etiquette and Culture in ${city}</h2>
      <p>When staying at a hotel in ${city}, it's helpful to be aware of local customs. Tipping practices, check-in requirements, and even power outlet types can vary. Most hotels in ${city} will have multi-voltage outlets or adapters available at the front desk, but it's always wise to carry your own. Regarding noise, many residential areas in ${city} value quiet hours after 10 PM, so keep this in mind if you are staying in a smaller guest house or apartment-style hotel. Engaging with the hotel staff in ${city} can be very rewarding—they are often proud of their city and eager to share recommendations for the best local dishes or lesser-known viewpoints.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Safety Tips and Peace of Mind</h2>
      <p>Safety is a top priority for any traveler. Most hotel districts in ${city} are safe and well-patrolled, but as with any popular destination, it's good to stay vigilant. Use the hotel safe for your passport and valuables, and be aware of your surroundings when returning late at night. Our hotel finder prioritizes well-established and reputable properties to ensure you can book with confidence. If you're unsure about a specific area, a quick search for local safety ratings can provide additional reassurance.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Sustainable and Eco-Friendly Stays</h2>
      <p>If you are an environmentally conscious traveler, you'll be pleased to know that many hotels in ${city} are adopting sustainable practices. Look for certifications such as the Green Key or LEED, which indicate a commitment to reducing energy consumption, waste, and water usage. Some eco-friendly hotels in ${city} also prioritize local sourcing for their restaurants and use non-toxic cleaning products, allowing you to enjoy your stay while minimizing your carbon footprint.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Frequently Asked Questions About Hotels in ${city}</h2>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 2rem;">
        <p><strong>What is the average price for a hotel in ${city}?</strong><br>Hotel prices vary widely by season and location, but generally, you can find quality mid-range accommodation for a moderate nightly rate, while luxury options will be higher. Booking mid-week can often save you money compared to weekend stays.</p>
        <p><strong>Are hotels in ${city} pet-friendly?</strong><br>Many hotels now welcome furry friends, though sometimes an additional cleaning fee is required. It's always best to filter your search for pet-friendly options or contact the hotel directly to confirm their policy.</p>
        <p><strong>Is breakfast typically included?</strong><br>In ${city}, it's common for mid-range and luxury hotels to offer breakfast, either as part of the room rate or for an extra fee. Boutique hotels often provide a more local, artisanal breakfast experience that shouldn't be missed.</p>
        <p><strong>Do hotels in ${city} offer airport shuttle services?</strong><br>Many of the larger hotels and those specifically catering to business travelers provide shuttle services to and from the nearest airports. If not, most are easily accessible by taxi or public transit as detailed in our airport guide.</p>
      </div>

      <h2 style="font-size: 2rem; margin-top: 2rem;">How to Use the Hotel Finder Tool Effectively</h2>
      <p>Our interactive map above is your primary tool for discovery. Simply enter ${city} in the search box and adjust the radius to see all available hotels within that range. You can zoom in to see exactly where each property is located relative to the streets and parks you'll be frequenting. Each marker on the map represents a potential stay, and clicking through will provide more details to help you finalize your decision. The tool is mobile-responsive, so you can even use it while on the go in ${city} to find a last-minute place to stay.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Complete Your Travel Planning with Us</h2>
      <p>Finding a hotel is just one piece of the puzzle. Once you've secured your stay in ${city}, use our <a href="/distance">Distance Calculator</a> to plan your routes between the hotel and the city's top attractions. If you're managing a tight schedule or a multi-leg journey, our <a href="/turnaround-time-calculator">Turnaround Day Calculator</a> is the perfect companion to ensure your arrival and departure dates are perfectly aligned. We are committed to making your trip to ${city} as smooth and enjoyable as possible! Our goal is to provide you with all the data you need to make informed travel decisions, saving you time and reducing the stress of planning.</p>
      <p style="margin-top: 20px;">Start your search above to discover available hotels in ${city} and book your perfect stay!</p>
    </article>
  `
    : `
    <article class="dynamic-seo-content" style="margin-top: 40px; line-height: 1.8; color: #333; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
      <p>Whether you're arriving by air or planning your next departure, understanding the aviation landscape around <strong>${city}</strong> is crucial for a seamless travel experience. Choosing the right airport can significantly impact your travel time, overall costs, and the level of convenience you enjoy during your journey. This comprehensive guide provides everything you need to know about the air gateways serving the ${city} region, from terminal maps to ground transport secrets.</p>
      
      <p>The area surrounding ${city} is typically served by a network of airports ranging from massive international hubs to smaller regional terminals. Depending on your origin or destination, you may find that different airports offer varying flight schedules, airline options, and amenities. Some travelers prioritize proximity, while others look for the best fare or the most comfortable lounge. In this guide, we break down those choices to help you fly like a pro.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Navigating the Major Aviation Hubs Serving ${city}</h2>
      <p>Most travelers flying into the region will pass through one of the major international airports. These hubs are the lifelines of ${city}'s connection to the world, hosting hundreds of daily flights from every corner of the globe. These airports are designed to handle large volumes of passengers and offer wide-ranging services, including multi-lingual staff, extensive duty-free areas, and a variety of airline lounges. However, their sheer size can sometimes be overwhelming, involving long walks between gates or even inter-terminal trains.</p>
      
      <p>On the other hand, regional airports near ${city} often provide a more relaxed and efficient alternative. While they may have fewer international connections, they are frequently closer to certain parts of the city and can offer much shorter wait times at security and baggage claim. The "budget" airlines often prefer these smaller airports, which can lead to significant savings on your flight tickets. If you have the option, comparing flights into both major and regional airports can lead to significant time and money savings, especially if you factor in the cost and time of ground transportation to ${city}.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Comprehensive Ground Transportation Guide</h2>
      <p>Once you touch down at an airport near ${city}, your next priority is reaching your final destination. Fortunately, most airports in this region are well-connected by a variety of transport modes, catering to different budgets and schedules.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Public Transit: Trains and Buses</h3>
      <p>Many major airports offer direct rail links to ${city}'s city center, often referred to as "Airport Express" services. These are typically the fastest and most reliable ways to beat traffic, with trains running every 15-30 minutes. For those on a tighter budget, a network of airport shuttle buses frequently connects the terminals with major hotels and transport hubs throughout the city. While buses might take longer due to potential traffic, they often stop at more varied locations, which might be closer to your specific hotel in ${city}.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Taxis and Ride-Sharing</h3>
      <p>Official taxi stands are available at all arrival terminals. It is always recommended to use the official queue rather than accepting offers from unlicensed drivers inside the airport building. Most taxis in the ${city} area now accept credit cards, but it's always good to have some local currency just in case. Ride-sharing apps also operate at most airports serving ${city}, often with dedicated pickup zones located a short walk from the baggage claim area. These services can be a cost-effective alternative to traditional taxis, especially for groups or families.</p>

      <h3 style="font-size: 1.5rem; margin-top: 1.5rem;">Car Rentals and Private Transfers</h3>
      <p>If you prefer the flexibility of driving yourself, a wide range of car rental agencies maintain desks at the airport. We recommend booking your vehicle in advance, particularly during peak travel seasons, to ensure you get the car type you need at a fair price. For a more premium and stress-free experience, private transfer services can be arranged to meet you at the arrivals hall with a personalized sign and take you directly to your hotel in ${city}. This is an excellent option after a long-haul flight when you just want to reach your destination without any hassle.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Airport Amenities and Passenger Services</h2>
      <p>Modern airports serving ${city} are designed to be destinations in themselves, offering a range of services to make your wait more pleasant. Whether you have a short layover or a long wait for a delayed flight, these facilities can make a big difference.</p>
      <ul>
        <li><strong>Dining and Shopping:</strong> From international fast-food chains to local gourmet restaurants and extensive duty-free shops, you'll find plenty to occupy your time. Many airports near ${city} now feature local food halls where you can get a taste of the city's cuisine before you even leave the terminal.</li>
        <li><strong>Connectivity:</strong> High-speed Wi-Fi is generally available throughout the terminals, along with numerous charging stations for your electronic devices. Some airports also offer quiet zones or "nap pods" for those needing a quick rest.</li>
        <li><strong>Lounges:</strong> For those seeking extra comfort, several airline and independent lounges offer quiet spaces, refreshments, and business facilities. Many of these can be accessed via day-pass programs if you don't have elite frequent flyer status.</li>
        <li><strong>Family and Accessibility:</strong> All major airports near ${city} are equipped with nursing rooms, children's play areas, and facilities to assist passengers with reduced mobility. Specialized transport and accessible restrooms are standard in all modern terminals.</li>
      </ul>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Security and Check-in Best Practices</h2>
      <p>To ensure a stress-free departure from any airport near ${city}, planning ahead is vital. The security landscape is constantly evolving, so staying updated on the latest liquid restrictions and electronics policies is helpful. For international flights, it is generally recommended to arrive at the airport at least three hours before your scheduled departure time. For domestic or regional flights, two hours is usually sufficient. Always check your airline's specific requirements before leaving for the airport, as some might have stricter cutoff times for baggage drop.</p>
      
      <p>Ensure you have all necessary travel documents, including passports, visas, and any required health documentation, easily accessible. Modern security procedures at airports serving ${city} are efficient but can be time-consuming during peak hours (usually early morning and late afternoon), so staying organized and following the instructions of the security staff will help you move through the checkpoints smoothly.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Layover Guide: Making the Most of Tight Connections</h2>
      <p>If you find yourself with a few hours between flights at an airport near ${city}, consider exploring the terminal's unique offerings. Some hubs feature art galleries, gardens, or even small museums. If your layover is longer than six hours, you might even have enough time to venture into ${city} itself, provided you have the necessary visa and transport is quick. Always factor in the time needed to clear immigration and return through security before deciding to leave the airport.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Sustainable Aviation and Your Carbon Footprint</h2>
      <p>Many airports and airlines operating around ${city} are working toward more sustainable operations. This includes investing in sustainable aviation fuel, reducing single-use plastics in the terminals, and implementing more efficient flight routing. As a traveler, you can contribute by using public transit to reach the airport, opting for electronic boarding passes, and supporting carbon offset programs offered by many major carriers serving the ${city} region.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Frequently Asked Questions About Airports Near ${city}</h2>
      <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 2rem;">
        <p><strong>Which airport is closest to the city center?</strong><br>While this depends on your exact destination in ${city}, typically there is one primary regional or city airport that offers the quickest access, although it might have fewer flight options than the larger international hubs.</p>
        <p><strong>Is there a 24-hour transport option from the airport?</strong><br>Most major airports serving ${city} have 24-hour taxi or ride-share availability. Some "Airport Express" rail services might stop during the middle of the night, so always check the schedule if you have a very early or late flight.</p>
        <p><strong>Can I store my luggage at the airport?</strong><br>Yes, most airports near ${city} offer luggage storage facilities or lockers, usually located in the arrivals or terrestrial transport areas. This is perfect if you have a long layover and want to explore the city unencumbered.</p>
        <p><strong>Is Wi-Fi free at the airport?</strong><br>Yes, free Wi-Fi is standard at nearly all modern airports serving the ${city} area, although some might require a quick registration or have time limits on the free session.</p>
      </div>

      <h2 style="font-size: 2rem; margin-top: 2rem;">How to Use the Airport Finder Tool</h2>
      <p>Our map-based search tool above is specifically designed to help you locate all airports within a given radius of ${city}. By adjusting the search radius, you can discover smaller regional airports that you might not have considered. Each result on the map provides essential information, including location markers and distances, to help you evaluate which airport is the best fit for your specific itinerary. The map is interactive, allowing you to pan around and see the geographic relationship between various air gateways and ${city}.</p>

      <h2 style="font-size: 2rem; margin-top: 2rem;">Optimize Your Schedule with Travel Calculator</h2>
      <p>Planning your flight is just the beginning of a successful journey. Use our <a href="/distance">Distance Calculator</a> to determine exactly how long the drive from the airport to ${city} will take, or vice versa. This helps you avoid the stress of rushing to catch a flight or arriving late to a hotel check-in. Additionally, our <a href="/turnaround-time-calculator">Turnaround Day Calculator</a> is an invaluable tool for travelers with tight connections or complex schedules, helping you calculate precisely how much time you have between landing and your next engagement in ${city}. We are here to provide the tools you need for a perfectly planned trip.</p>
      
      <p style="margin-top: 20px;">Search above to discover all airports serving the ${city} area and plan your travel with precision!</p>
    </article>
  `;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
  html = html.replace('</head>', `<script>window.PLACES_PSEO = { type: "${type}", city: "${city}", slug: "${slug}" };</script></head>`);

  // Inject SEO article into the correct placeholder
  const placeholderId = type === 'hotels' ? 'id="pseo-article-hotels"' : 'id="pseo-article-airports"';
  html = html.replace(`<div ${placeholderId}></div>`, `<div ${placeholderId}>${dynamicArticle}</div>`);

  saveData(PLACES_PATH, { slug, city, type, timestamp: new Date().toISOString() });
  res.send(html);
});

// Turnaround pSEO route
app.get('/turnaround/:slug', async (req, res) => {
  const { slug } = req.params;
  const city = slug.replace(/-/g, ' ');

  let html = fs.readFileSync(path.join(__dirname, 'turnaround-time-calculator.html'), 'utf8');
  const title = `Turnaround Time Calculator for ${city}`;
  const description = `Calculate turnaround days and trip schedules for travel to ${city}. Ideal for business and leisure trip planning.`;
  html = html.replace('<h1>Turnaround Day Calculator</h1>', `<h1>Turnaround Time Planning for ${city}</h1>`);

  // Generate dynamic SEO content
  const dynamicArticle = `
    <article class="dynamic-seo-content" style="margin-top: 40px;">
      <p>Managing a busy travel schedule in <strong>${city}</strong> requires precise timing. Our turnaround day calculator helps you determine the exact number of days between trip segments, ensuring you never miss a connection or overstay your welcome.</p>
      
      <h2>Optimizing Your Trip to ${city}</h2>
      <p>Whether you're visiting for a quick meeting or an extended stay, understanding your "turnaround" time is crucial for logistics. This tool is specifically designed for travelers who need to calculate gaps between dates or plan efficient multi-city itineraries.</p>

      <h3>Complete Your Planning</h3>
      <p>Don't forget to check the <a href="/distance">driving distance to ${city}</a> from your starting point, or find the best <a href="/places/hotels-in-${slug}">hotels in ${city}</a> using our integrated finder. For those flying, we also track <a href="/places/airports-near-${slug}">airports near ${city}</a>.</p>
    </article>
  `;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

  // Inject article
  html = html.replace('</main>', `${dynamicArticle}</main>`);

  // Inject data to trigger search in turnaround calculator
  html = html.replace('</head>', `<script>window.TURNAROUND_PSEO = { city: "${city}", slug: "${slug}" };</script></head>`);

  res.send(html);
});

// Combined Dynamic Sitemap
app.get('/sitemap-dynamic.xml', (req, res) => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);
  const baseUrl = 'https://www.calculatortrip.com';
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Distance routes
  routes.forEach(r => {
    xml += `
  <url>
    <loc>${baseUrl}/distance/${r.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  // Places routes
  places.forEach(p => {
    xml += `
  <url>
    <loc>${baseUrl}/places/${p.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>`;
  });

  // Turnaround routes
  const topCities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Tokyo", "Berlin", "Rome", "Madrid"];
  topCities.forEach(city => {
    xml += `
  <url>
    <loc>${baseUrl}/turnaround/${cleanSlug(city)}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.6</priority>
  </url>`;
  });

  xml += '\n</urlset>';
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(xml.trim());
});

// Popular Routes API
app.get('/api/popular-routes', (req, res) => {
  res.json(readData(ROUTES_PATH).slice(-12).reverse());
});

// Redirects and Static serving
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/distance', (req, res) => res.sendFile(path.join(__dirname, 'distance.html')));
app.get('/turnaround-time-calculator', (req, res) => res.sendFile(path.join(__dirname, 'turnaround-time-calculator.html')));
app.get('/places', (req, res) => res.sendFile(path.join(__dirname, 'places.html')));

const pages = ['about', 'privacy', 'terms', 'contact'];
pages.forEach(p => app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, `${p}.html`))));

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://www.calculatortrip.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${baseUrl}/sitemap-main.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemap-dynamic.xml</loc></sitemap>
</sitemapindex>`.trim();
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(xml);
});

app.get('/sitemap-main.xml', (req, res) => {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'sitemap-main.xml'));
});

// SEEDING LOGIC - Populate some top routes if empty
const seedData = async () => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);

  const topCities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Tokyo", "Berlin", "Rome", "Madrid", "Vienna", "Prague", "Budapest", "Ljubljana", "Split", "Dubai", "Singapore", "Sydney", "Toronto", "Istanbul", "Los Angeles", "Chicago", "Miami", "San Francisco", "Amsterdam", "Brussels", "Munich", "Milan", "Barcelona", "Lisbon"];

  // Seed Distance
  if (routes.length < 15) {
    const seeds = [
      { origin: "London", destination: "Paris" },
      { origin: "New York", destination: "Los Angeles" },
      { origin: "Zagreb", destination: "Belgrade" },
      { origin: "Berlin", destination: "Munich" },
      { origin: "Sarajevo", destination: "Zagreb" },
      { origin: "Split", destination: "Zagreb" },
      { origin: "Vienna", destination: "Budapest" },
      { origin: "Rome", destination: "Milan" },
      { origin: "Paris", destination: "Amsterdam" },
      { origin: "New York", destination: "Miami" }
    ];
    seeds.forEach(s => {
      const slug = `${cleanSlug(s.origin)}-to-${cleanSlug(s.destination)}`;
      saveData(ROUTES_PATH, {
        origin: s.origin,
        destination: s.destination,
        distance: "Calculating...",
        duration: "Calculating...",
        slug: slug,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Seed Places
  if (places.length < 20) {
    topCities.forEach(city => {
      const hotelSlug = `hotels-in-${cleanSlug(city)}`;
      const airportSlug = `airports-near-${cleanSlug(city)}`;
      saveData(PLACES_PATH, { slug: hotelSlug, city, type: "hotels", timestamp: new Date().toISOString() });
      saveData(PLACES_PATH, { slug: airportSlug, city, type: "airports", timestamp: new Date().toISOString() });
    });
  }
};
seedData();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
