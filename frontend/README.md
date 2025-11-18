# PT Pal Frontend

A modern, high-end frontend for PT Pal - Physical Therapy Made Friendly.

## Features

- **Modern Design**: Inspired by Talkspace, featuring a clean, professional interface
- **Typing Animation**: Dynamic text animation on the homepage
- **Responsive**: Fully responsive design that works on all devices
- **Multi-page Structure**: Home, Exercises, About, and Contact pages
- **Smooth Animations**: Scroll-triggered animations and smooth transitions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
frontend/
├── server.js              # Express server
├── package.json           # Dependencies
├── public/
│   ├── index.html         # Home page
│   ├── exercises.html     # Exercises page
│   ├── about.html         # About page
│   ├── contact.html       # Contact page
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   └── js/
│       ├── typing-animation.js  # Typing animation
│       └── main.js              # Main JavaScript
```

## Pages

- **Home** (`/`): Main landing page with hero section and features
- **Exercises** (`/exercises`): Exercise library with available exercises
- **About** (`/about`): Information about PT Pal
- **Contact** (`/contact`): Contact form and information

## Technologies Used

- Node.js
- Express.js
- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript
- Google Fonts (Inter)

## Customization

### Colors

Edit CSS variables in `public/css/styles.css`:
```css
:root {
    --primary-color: #00a896;
    --primary-dark: #008a7a;
    --primary-light: #00d4b8;
    /* ... */
}
```

### Typing Animation Text

Edit the `typingTexts` array in `public/js/typing-animation.js`:
```javascript
const typingTexts = [
    "PT Pal therapy made friendly",
    "Your custom text here",
    // ...
];
```

## Deployment

To deploy, build the project and serve the `public` directory with your preferred hosting service.

## License

ISC


