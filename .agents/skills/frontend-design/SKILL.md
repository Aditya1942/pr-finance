---
name: frontend-design
description: Use when building web components, pages, or applications - provides guidance for creating distinctive, production-grade frontend interfaces that avoid generic AI aesthetics with bold typography, color, motion, and spatial composition choices
---

# Frontend Design

## Overview

Create distinctive, production-grade frontend interfaces with high design quality. Avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

**Core principle:** Every interface should be intentional, memorable, and cohesive. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## Design Thinking Process

Before coding, understand context and commit to a BOLD aesthetic direction:

1. **Purpose:** What problem does this interface solve? Who uses it?
2. **Tone:** Pick a strong direction:
   - Brutally minimal, maximalist chaos, retro-futuristic
   - Organic/natural, luxury/refined, playful/toy-like
   - Editorial/magazine, brutalist/raw, art deco/geometric
   - Soft/pastel, industrial/utilitarian, cyberpunk
   - Or create your own - these are just starting points
3. **Constraints:** Framework, performance, accessibility requirements
4. **Differentiation:** What makes this UNFORGETTABLE? What's the one memorable element?

**CRITICAL:** Choose a clear conceptual direction and execute with precision.

## Frontend Aesthetics Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting:
- **NEVER** use generic fonts: Arial, Inter, Roboto, system fonts
- **DO** use distinctive choices that elevate the design
- Pair a distinctive display font with a refined body font
- Unexpected, characterful font choices create identity
- Vary between projects - NEVER converge on common choices (like Space Grotesk)

### Color & Theme

- Commit to a cohesive aesthetic. Use CSS variables for consistency
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- Avoid cliched schemes (particularly purple gradients on white backgrounds)
- Vary between light and dark themes across projects

### Motion & Animation

- Use animations for effects and micro-interactions
- Prioritize CSS-only solutions for HTML
- Use Motion library for React when available
- **Focus on high-impact moments:** One well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions
- Use scroll-triggering and hover states that surprise

### Spatial Composition

- Unexpected layouts. Asymmetry. Overlap. Diagonal flow
- Grid-breaking elements
- Generous negative space OR controlled density
- Never default to predictable component patterns

### Backgrounds & Visual Details

Create atmosphere and depth rather than solid colors:
- Gradient meshes, noise textures, geometric patterns
- Layered transparencies, dramatic shadows
- Decorative borders, custom cursors, grain overlays
- Contextual effects matching the overall aesthetic

## Anti-Patterns to Avoid

**NEVER use:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (purple gradients on white)
- Predictable layouts and component patterns
- Cookie-cutter design lacking context-specific character
- Generic card grids with rounded corners and subtle shadows
- The same aesthetic across different projects

## Implementation Guidelines

- Match complexity to vision: maximalist = elaborate code with extensive animations; minimalist = restraint, precision, subtle details
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Integration

- **Before design:** Use `superpowers:brainstorming` to explore the design direction
- **After design:** Use `superpowers:writing-plans` to plan implementation
- **For your project:** Reference the project's AGENTS.md for existing color palette and design system constraints
