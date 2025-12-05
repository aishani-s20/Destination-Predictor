# 🌍 Destination Predictor & Traveller Platform

An intelligent full-stack travel rental platform that combines traditional booking features with machine learning to recommend the best travel destinations based on user preferences.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=render)](https://destination-predictor.onrender.com/listings)

---

## 🚀 Features

* **Smart Recommendations:** Integrated Machine Learning model (Random Forest) to predict travel satisfaction and recommend destinations.
* **Listing Management:** Full CRUD (Create, Read, Update, Delete) functionality for travel listings.
* **Interactive Maps:** Integration with MapLibre/OpenStreetMap for location visualization.
* **Secure Authentication:** User signup and login functionality.
* **Image Storage:** Cloudinary integration for efficient image management.
* **Responsive Design:** Styled for usage on various devices.

---

## 🛠️ Tech Stack

**Backend & Core:**
* Node.js & Express.js
* MongoDB & Mongoose (Database)
* EJS (Templating Engine)

**Machine Learning:**
* Python (Scikit-Learn, Pandas)
* Integrated via `ml-api`

**Tools & Services:**
* Cloudinary (Image Storage)
* MapLibre (Maps)
* Render (Deployment)

---

## 📂 Project Structure

```text
├── controllers/      # Logic for handling requests (MVC pattern)
├── models/           # Mongoose Database Schemas
├── routes/           # Express route definitions
├── views/            # EJS frontend templates
├── public/           # Static files (CSS, JS, Images)
├── ml-api/           # Machine Learning model and Python scripts
├── utils/            # Helper functions and error handling
├── cloudConfig.js    # Cloudinary configuration
├── middleware.js     # Authentication and validation middleware
└── app.js            # Main entry point of the application