# Image Styling Analysis: standard.mv vs Current Implementation

## How standard.mv Styles Images

### 1. Base Image Styles
```css
img {
    max-width: 100%;
    height: auto;
    vertical-align: middle;
    border-style: none;
    object-fit: cover;
}
```

### 2. Featured Article Images (Main Content)
- **Wrapper Structure:**
  - `.s-feat-outer` - Outer container with `margin-bottom: 30px`
  - `.s-feat` - Inner container using aspect ratio technique
  - `.featured-lightbox-trigger` - Clickable wrapper for lightbox functionality

- **Aspect Ratio Technique:**
  ```css
  .i-ratio .s-feat {
      position: relative;
      width: 100%;
      padding-bottom: var(--image-ratio, 56%); /* 16:9 = 56.25% */
  }
  
  .s-feat img {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
  }
  ```

- **Image Attributes:**
  - `loading="lazy"` (for non-critical images)
  - `decoding="async"`
  - Explicit `width` and `height` attributes
  - Classes: `wp-post-image`, `attachment-foxiz_crop_o1`, `size-foxiz_crop_o1`

### 3. Card/List Images
- Similar structure but with different aspect ratios
- Uses `featured-img` class
- Same absolute positioning technique within aspect ratio container

### 4. Visual Enhancements
- **Border Radius:** Applied via CSS variables (`--round-5`)
- **Box Shadows:** Subtle shadows for depth
- **Dark Mode:** Images have reduced opacity (0.7) in dark mode
- **Hover Effects:** Lightbox trigger with cursor pointer

### 5. Responsive Image Handling
- Uses WordPress image sizes (e.g., `-860x573.jpg`)
- Proper srcset and sizes attributes
- Responsive breakpoints

## Current Implementation Analysis

### Strengths
✅ Already using `aspect-ratio` CSS property (modern approach)
✅ `object-fit: cover` implemented
✅ Lazy loading with `loading="lazy"` and `decoding="async"`
✅ Border radius and box shadows
✅ Proper width/height attributes
✅ Error handling for failed images

### Areas for Improvement

1. **Consistent Wrapper Structure**
   - Current: Mix of inline styles and classes
   - Standard.mv: Consistent wrapper classes (`.s-feat-outer`, `.s-feat`)
   - **Recommendation:** Create reusable image wrapper components

2. **Spacing Consistency**
   - Current: Various margin values
   - Standard.mv: Consistent `margin-bottom: 30px` for featured images
   - **Recommendation:** Standardize spacing values

3. **Figure/Figcaption Usage**
   - Current: Uses `<figure>` but could be more consistent
   - Standard.mv: Uses `<figure>` with proper semantic structure
   - **Recommendation:** Ensure all images are wrapped in `<figure>` with optional `<figcaption>`

4. **Aspect Ratio Container Technique**
   - Current: Uses CSS `aspect-ratio` property (modern, good!)
   - Standard.mv: Uses padding-bottom technique (older but widely supported)
   - **Recommendation:** Keep modern approach but ensure fallback

5. **Image Container Classes**
   - Current: Inline styles mixed with Tailwind classes
   - Standard.mv: Dedicated CSS classes for different image types
   - **Recommendation:** Create utility classes for image containers

## Recommended Improvements

### 1. Create Reusable Image Components

```jsx
// components/ArticleImage.jsx
const ArticleImage = ({ 
  src, 
  alt, 
  aspectRatio = "16/9",
  borderRadius = 8,
  shadow = true,
  maxHeight = "600px",
  objectFit = "cover",
  objectPosition = "center",
  loading = "lazy",
  className = ""
}) => {
  return (
    <figure className="article-image-container" style={{ marginBottom: '30px' }}>
      <div 
        className="article-image-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspectRatio,
          maxHeight: maxHeight,
          borderRadius: `${borderRadius}px`,
          boxShadow: shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
          overflow: 'hidden',
          backgroundColor: '#f3f4f6'
        }}
      >
        <img
          src={src}
          alt={alt}
          className="article-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: objectFit,
            objectPosition: objectPosition,
            display: 'block'
          }}
          loading={loading}
          decoding="async"
        />
      </div>
    </figure>
  );
};
```

### 2. Add Global Image Styles

Add to `frontend/src/index.css`:

```css
/* Base image styles - matching standard.mv */
img {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
  border-style: none;
}

/* Article image containers */
.article-image-container {
  margin: 0;
  padding: 0;
  width: 100%;
  display: block;
}

.article-image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  display: block;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Card images */
.card-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Responsive images */
img[loading="lazy"] {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

img[loading="lazy"].loaded {
  opacity: 1;
}
```

### 3. Standardize Spacing

Create spacing constants:
- Featured image margin-bottom: `30px` (1.875rem)
- Inline image margin: `2.5rem auto` (top/bottom)
- Card image margin-bottom: `1rem` (0.75rem)

### 4. Improve Aspect Ratio Handling

Ensure consistent aspect ratios:
- Featured article images: `16/9` (56.25%)
- Card images: `16/9` (56.25%)
- Compact images: `4/3` (75%) or `1.2/1` (83.33%)

### 5. Add Lightbox Functionality (Optional)

Consider adding lightbox for featured images like standard.mv:
- Use a library like `react-image-lightbox` or `yet-another-react-lightbox`
- Wrap featured images in clickable containers
- Show full-size image on click

## Implementation Priority

1. **High Priority:**
   - Standardize image wrapper structure
   - Consistent spacing (30px margin-bottom for featured)
   - Ensure all images use `<figure>` wrapper
   - Add global image CSS classes

2. **Medium Priority:**
   - Create reusable Image component
   - Improve responsive image handling
   - Add loading state transitions

3. **Low Priority:**
   - Add lightbox functionality
   - Dark mode image opacity adjustments
   - Advanced hover effects

## Key Takeaways

1. **Standard.mv uses:**
   - Padding-bottom technique for aspect ratios (older but reliable)
   - Absolute positioning for images within containers
   - Consistent wrapper classes (`.s-feat-outer`, `.s-feat`)
   - 30px margin-bottom for featured images
   - Semantic HTML with `<figure>` elements

2. **Your current implementation:**
   - Modern CSS `aspect-ratio` property (better!)
   - Good lazy loading implementation
   - Proper error handling
   - Needs more consistency in wrapper structure

3. **Best approach:**
   - Keep modern CSS `aspect-ratio` but add fallback
   - Create reusable components for consistency
   - Standardize spacing and wrapper structure
   - Maintain semantic HTML structure

