/**
 * @typedef {Object} Contact
 * @property {string} location The location of the contact.
 * @property {string} email The email of the contact.
 * @property {string} phone The phone number of the contact.
 */

/**
 * @typedef {Object} Website
 * @property {string} name The name of the website.
 * @property {string} url The url of the website.
 */

/**
 * @typedef {Object} Education
 * @property {string} logo The logo of the education.
 * @property {string} institution The institution of the education.
 * @property {string} degree The degree of the education.
 * @property {string} start The start date of the education.
 * @property {string} end The end date of the education.
 * @property {string | null} gpa The gpa of the education.
 * @property {Array<string>} activities The activities of the education.
 */

/**
 * @typedef {Object} Experience
 * @property {string} logo The logo of the experience.
 * @property {string} title The title of the experience.
 * @property {string} company The company of the experience.
 * @property {string} employmentType The employment type of the experience, e.g., `"Part-time"`, `"Full-time"`, etc.
 * @property {string} start The start date of the experience.
 * @property {string} end The end date of the experience.
 * @property {string} location The location of the experience.
 * @property {string} locationType The location type of the experience, e.g., `"On-site"`, `"Remote"`, etc.
 * @property {Array<string>} bullets The bullets of the experience.
 */

/**
 * @typedef {Object} Profile
 * @property {string} name The name of the LinkedIn profile.
 * @property {Contact} contact The contact information of the LinkedIn profile.
 * @property {string} bio The bio of the LinkedIn profile.
 * @property {Array<Website>} websites The websites of the LinkedIn profile.
 * @property {string} about The about text of the LinkedIn profile.
 * @property {Array<Education>} education The education of the LinkedIn profile.
 * @property {Array<Experience>} experience The experience of the LinkedIn profile.
 * @property {Array<Project>} projects The projects of the profile
 */

/** @type {Profile} */
const profile = await fetch('/scripts/profile.json').then(res => res.json());

export default profile;