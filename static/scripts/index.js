import profile from './profile.mjs';

/**
 * Generates the HTML template for the profile information section
 * @param {string} name The user's full name
 * @param {import('./profile.mjs').Contact} contact Contact information object
 * @param {string} bio Brief biography text
 * @param {Array<import('./profile.mjs').Website>} websites Array of website objects
 * @returns {string} HTML string containing formatted profile information
 */
function profileInfoTemplate(name, contact, bio, websites) {
  // I want bio paragraphs to be separated by a line break.
  const bioParagraphs = bio.replace(/\n/g, '<br />');
  const websiteLinks = websites
    .filter(website => website.name !== 'Personal Webserver')
    .map(website => `<a href="${website.url}" target="_blank">${website.name}</a>`)
    .join('');
  return `
    <h1 id="name">${name}</h1>
    <div class="contact-info">
      <p id="location">📍 ${contact.location}</p>
      <p id="email">📧 ${contact.email}</p>
      <p id="phone">📱 ${contact.phone}</p>
    </div>
    <div id="bio" class="bio">${bioParagraphs}</div>
    <div id="websites" class="websites">${websiteLinks}</div>`
}

/**
 * Loads the profile information into the DOM.  
 * Populates the profile-info section with user data from profile.mjs
 */
function loadProfile() {
  document.getElementById('profile-info').innerHTML = profileInfoTemplate(
    profile.name, 
    profile.contact, 
    profile.bio, 
    profile.websites
  );
}

/**
 * Loads the about text into the DOM  
 * Converts newlines to semantic paragraphs and populates the about section
 */
function loadAbout() {
  // I want about paragraphs to be separated into semantic paragraphs.
  const aboutText = profile.about.split('\n').map(para => `<p>${para}</p>`).join('');
  document.getElementById('about-text').innerHTML = aboutText;
}

/**
 * Main
 */
function main() {
  loadProfile();
  loadAbout();
}

main();