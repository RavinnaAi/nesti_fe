# Public Assets Directory

This directory contains static assets that are served directly by Next.js.

## Directory Structure

```
public/
├── logo/          # Brand logos and icons
│   ├── logo.png           # Main logo (required by next.config.js)
│   └── logo-light.png     # Light version logo (used in signup page)
├── images/        # General images and photos
├── icons/         # Application icons
│   └── google.svg        # Google OAuth icon
└── favicon/       # Favicon files
```

## Usage

Files in the `public` directory can be referenced from the root URL path.

### Examples:

- `/logo/logo.png` → `public/logo/logo.png`
- `/images/hero-bg.jpg` → `public/images/hero-bg.jpg`
- `/icons/google.svg` → `public/icons/google.svg`
- `/favicon.ico` → `public/favicon.ico`

## Next.js Image Component

When using Next.js `Image` component, reference assets like this:

```jsx
import Image from 'next/image';

<Image 
  src="/logo/logo.png" 
  alt="Logo" 
  width={100} 
  height={100} 
/>
```

## Required Assets

Based on `next.config.js` rewrites, the following assets are expected:

- `/logo/logo.png` - Main logo (used for favicon, icons, etc.)
- `/logo/logo-light.png` - Light version logo (used in signup page)

## Notes

- All files in this directory are publicly accessible
- Do not put sensitive files here
- Optimize images before adding them
- Use appropriate file formats (WebP, AVIF for images)
- The `.gitkeep` files ensure empty directories are tracked in git
