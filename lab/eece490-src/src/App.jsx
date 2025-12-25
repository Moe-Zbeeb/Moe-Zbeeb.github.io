import React from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Overview from './components/Overview.jsx';
import CourseStaff from './components/CourseStaff.jsx';
import Materials from './components/Materials.jsx';
import team from './data/team.js';

const heroBackgrounds = [
  './background/wide1.png',
  './background/wide2.png',
  './background/wide3.png',
  './background/wide4.png',
];

function App() {
  return (
    <div className="bg-page min-h-screen text-primary">
      <Navbar />
      <Hero backgrounds={heroBackgrounds} interval={3000} />
      <main>
        <Overview />
        <Materials />
        <CourseStaff />
      </main>
    </div>
  );
}

export default App;
