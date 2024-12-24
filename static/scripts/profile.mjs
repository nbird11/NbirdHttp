/** @module profile */

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
const profile = {
  name: "Nathan Bird",
  contact: {
    location: "Rexburg, ID",
    email: "nathanbirdka+resume@gmail.com",
    phone: "(385) 392-5995"
  },
  bio: "Former Backend Software Development Intern at FamilySearch\nSoftware Engineering Student at Brigham Young University-Idaho",
  websites: [
    { name: "YouTube", url: "https://www.youtube.com/@NathanBird" },
    { name: "GitHub", url: "https://github.com/nbird11" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/nathanabird/" },
    { name: "Personal Webserver", url: "https://nbird.dev/" },
  ],
  about: "I'm currently a full-time student at BYU-Idaho studying Software Engineering with a focus on Software Design, optimizing algorithms, and reducing complexity. Over the summer, I interned as a Backend Web Developer at FamilySearch, where I built and maintained backend REST APIs, handled data collection, and monitored AWS builds/deploys. Notably, I contributed to a Paris 2024 Olympics project under a tight deadline.\nMy passion for technology extends beyond my professional life. I enjoy working on personal programming projects, which allows me to explore new technologies and enhance my skills. I am also an active member of the Association for Computing Machinery (ACM) at BYU-Idaho, participating in discussions on various Computer Science topics. Outside of tech, I love playing board games with friends, practicing the piano, and singing.\nDuring the height of the covid pandemic, I served a proselyting mission for the Church of Jesus Christ of Latter-day Saints where I taught, performed service, and provided spiritual aid in Colorado and Brazil, in English and Portuguese respectively.\nLooking forward to contributing to innovative projects and making a meaningful impact in the tech community.",
  education: [
    {
      logo: "https://media.licdn.com/dms/image/v2/D560BAQHxHHN9dJ9TnA/company-logo_100_100/company-logo_100_100/0/1726260984458?e=1741219200&v=beta&t=z4722-mh-n4kyFSqWmUXEoLTox9dWQ3kBHaAIp50glg",
      institution: "Brigham Young University-Idaho",
      degree: "Bachelor of Science in Software Engineering",
      start: "2019",
      end: "2025",
      gpa: "3.98",
      activities: [
        "Association for Computing Machinery (ACM)",
      ]
    },
    {
      logo: "https://media.licdn.com/dms/image/v2/C4E0BAQF-Aqi67LbmYg/company-logo_100_100/company-logo_100_100/0/1630592259166?e=1741219200&v=beta&t=StTWnvtlf1difjqf79z60TqWlJbAI3tH4OALkylbwLI",
      institution: "Santa Teresa High School",
      degree: "High School Diploma",
      start: "2015",
      end: "2019",
      gpa: null,
      activities: [
        "Computer Science Club",
        "Marching Band",
      ]
    }
  ],
  experience: [
    {
      logo: "https://media.licdn.com/dms/image/v2/D560BAQHxHHN9dJ9TnA/company-logo_100_100/company-logo_100_100/0/1726260984458?e=1741219200&v=beta&t=z4722-mh-n4kyFSqWmUXEoLTox9dWQ3kBHaAIp50glg",
      title: "Programming Tutor",
      company: "Brigham Young University–Idaho",
      employmentType: "Part-time",
      start: "Sep 2024",
      end: "Present",
      location: "Rexburg, Idaho, United States",
      locationType: "On-site",
      bullets: [
        "Lead individual and group sessions to assess understanding of software design principles in Python and C++, as well as low-level language skills in C.",
        "Tutor students in Algorithm Design, Encapsulation Design, and C language classes.",
        "Guide students in discovering solutions to course-related questions independently.",
      ]
    },
    {
      logo: "https://media.licdn.com/dms/image/v2/C4E0BAQGoC_lEdSbT4w/company-logo_100_100/company-logo_100_100/0/1645790791911/familysearch_logo?e=1741219200&v=beta&t=z84KG9Du3is-2JhbF_mwTM35lx9vqZqs6UI5_j3EhQA",
      title: "Backend Software Development Intern",
      company: "FamilySearch",
      employmentType: "Internship",
      start: "Apr 2024",
      end: "Aug 2024",
      location: "Lehi, Utah, United States",
      locationType: "Hybrid",
      bullets: [
        "Developed and maintained 7 backend REST APIs and microservices in Java Spring Boot.",
        "Consulted on the architectural discussion of 3 backend APIs for new projects.",
        "Delivered a prototype demonstration of a current-events user experience developed under a tight deadline.",
        "Implemented over 1000 unit and integration tests utilizing Spring methodologies.",
      ]
    },
    {
      logo: "https://media.licdn.com/dms/image/v2/D560BAQHxHHN9dJ9TnA/company-logo_100_100/company-logo_100_100/0/1726260984458?e=1741219200&v=beta&t=z4722-mh-n4kyFSqWmUXEoLTox9dWQ3kBHaAIp50glg",
      title: "Research Assistant",
      company: "Brigham Young University–Idaho",
      employmentType: "Part-time",
      start: "Dec 2023",
      end: "May 2024",
      location: "Rexburg, Idaho, United States",
      locationType: "Remote",
      bullets: [
        "Conducted in-depth analysis of Angular Ionic framework as part of a comparative study across 5 mobile app platforms.",
        "Developed a mobile app prototype using Angular Ionic, evaluating project setup, learning curve, and maintenance challenges.",
        "Integrated AWS Amplify and transitioned to Google Firestore, achieving a 30% increase in development efficiency, and assessed other pitfalls specific to Angular development.",
        "Documented findings across 15 key metrics, including resource availability and development efficiency, contributing to a comprehensive cross-platform comparison report.",
      ]
    },
    {
      logo: "https://media.licdn.com/dms/image/v2/D560BAQHxHHN9dJ9TnA/company-logo_100_100/company-logo_100_100/0/1726260984458?e=1741219200&v=beta&t=z4722-mh-n4kyFSqWmUXEoLTox9dWQ3kBHaAIp50glg",
      title: "Programming Tutor",
      company: "Brigham Young University–Idaho",
      employmentType: "Seasonal",
      start: "Oct 2023",
      end: "Dec 2023",
      location: "Rexburg, Idaho, United States",
      locationType: "On-site",
      bullets: [
        "Led individual and group sessions with over 30 students to assess their understanding of Python.",
        "Tutored students in Intro to Programming and Algorithm Design classes.",
        "Guided students in discovering solutions to course-related questions independently.",
      ]
    },
    {
      logo: null,
      title: "Software Consultant",
      company: "Self-Employed",
      employmentType: "Freelance",
      start: "Jan 2022",
      end: "Sep 2023",
      location: "Saratoga Springs, Utah, United States",
      locationType: "Remote",
      bullets: [
        "Built and developed custom software for clients looking for professional and well-maintained solutions.",
      ]
    }
  ]
};

export default profile;