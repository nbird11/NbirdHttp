import profile from '/scripts/load-profile.js';

/**
 * Generates the HTML template for the profile information section
 * @param {string} name The user's full name
 * @param {import('./load-profile.js').Contact} contact Contact information object
 * @param {string} headline Brief blurb text
 * @param {Array<import('./load-profile.js').Website>} websites Array of website objects
 * @returns {string} HTML string containing formatted profile information
 */
function profileInfoTemplate(name, contact, headline, websites) {
  const headlineHTML = headline.replace(/\n/g, '<br />');  // just in case
  const websiteLinks = websites
    .filter(website => website.name !== 'Portfolio')  // they're already on the portfolio
    .map(website => `<a href="${website.url}" target="_blank">${website.name}</a>`)
    .join('');
  return `
    <h1 id="name">${name}</h1>
    <div class="contact-info">
      <p id="location">📍 ${contact.location}</p>
      <p id="email">📧 ${contact.email}</p>
      <p id="phone">📱 ${contact.phone}</p>
    </div>
    <div id="headline" class="headline">${headlineHTML}</div>
    <div id="websites" class="websites">${websiteLinks}</div>`
}

/**
 * Loads the profile information into the DOM.
 * Populates the profile-info section with user data from profile.json
 */
function loadProfile() {
  document.getElementById('profile-info').innerHTML = profileInfoTemplate(
    profile.name,
    profile.contact,
    profile.headline,
    profile.websites
  );
}

/**
 * Loads the about text into the DOM
 * Converts newlines to semantic paragraphs and populates the about section
 */
function loadAbout() {
  // I want about paragraphs to be separated into semantic paragraphs.
  const aboutHTML = profile.about.split('\n').map(para => `<p>${para}</p>`).join('');
  document.getElementById('about-text').innerHTML = aboutHTML;
}

/**
 * Main
 */
function main() {
  loadProfile();
  loadAbout();
}

main();