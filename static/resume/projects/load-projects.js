/**
 * @typedef {Object} Project
 * @property {string} title The title of the project
 * @property {string} description A brief description of the project
 * @property {Array<string>} technologies Array of technologies used
 * @property {Array<string>} categories Array of project categories
 * @property {string | null} image URL to project screenshot/demo
 * @property {string | null} demo URL to live demo
 * @property {string | null} github URL to GitHub repository
 * @property {boolean} featured Whether this is a featured project
 * @property {string} date When the project was worked on
 */

/**
 * @type {Array<Project>}
 */
const projects = await fetch('./projects.json').then(res => res.json());

export default projects;