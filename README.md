# NAMELESS - Behind the Scenes

An interactive visual archive exploring the people and systems that keep BITS Pilani Dubai Campus running behind the scenes.

## Mediathon 2026

**Theme:** Nameless | Behind the Scenes

The project focuses on the people and everyday systems students interact with but often overlook.

Instead of presenting the campus through buildings and landmarks, the experience follows the invisible infrastructure of student life.

## Concept

Every day at BPDC depends on people whose work often happens outside the student spotlight.

Admissions.
The campus store.
Medical staff.
The library.
Security.
Student Council.
Mess staff.

These stories are connected through an interactive visual pathway.

The user moves through the experience as if travelling through a hidden layer of campus life.

## Features

- Cinematic opening sequence
- Interactive 3D story pathway
- 7 story categories
- 20 original photographs
- Scroll-based storytelling
- Photo reveal animations
- Hover interactions
- Perimeter red glitch effect
- Particle disintegration typography for major story headers
- WebGL pathway
- Desktop-first layout with responsive fallback
- Reduced-motion support
- Cinematic dark interface
- Red visual accent system
- Story-specific photo collections

## Story Categories

### Admissions
3 photographs

### Maha Mall
2 photographs

### Medical Room
5 photographs

### Library
5 photographs

### Security
1 photograph

### Student Council
3 photographs

### Mess Staff
1 photograph

**Total: 20 photographs**

## Visual Direction

The interface uses:

- Near-black backgrounds
- Off-white typography
- Muted grey supporting text
- Restrained red accents
- Fine grain
- Large editorial photography
- Minimal interface elements
- Smooth transitions
- Spatial movement

The design intentionally avoids a conventional dashboard aesthetic.

## Photo System

The original BPDC photographs are stored by story category under:

```text
assets/stories/
  admissions/
  maha-mall/
  medical/
  library/
  security/
  student-council/
  mess/
```

The story data is defined in `js/stories.js` and references the supplied filenames directly.

Main photographs preserve their original aspect ratio and use a non-cropping presentation:

```css
.photo-frame img {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}
```

## Project Structure

```text
index.html
css/
  style.css
js/
  stories.js
  locations.js
  pathway.js
  main.js
assets/
  stories/
```

`locations.js` contains the centralized provisional relative coordinates used by the 3D pathway. The coordinates can be updated when a verified BPDC site plan is available.

## Running Locally

This is a static HTML/CSS/JavaScript project with no build step.

Open `index.html` in a modern browser, or serve the project directory with any static web server. The Three.js runtime is loaded from the jsDelivr CDN.

## Accessibility and Motion

Interactive controls use semantic buttons and links. Story photos include alternative text, and the experience respects `prefers-reduced-motion` by reducing or disabling large transitions, cursor motion, parallax, and particle effects.

## Content Notes

The story content uses the supplied categories, descriptions, and photographs. No staff names, quotes, qualifications, schedules, statistics, or institutional claims are invented.
