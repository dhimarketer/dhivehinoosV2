# Chakra UI to Tailwind CSS + Headless UI Migration Plan

## Executive Summary

**Current State:**
- Using Chakra UI v2.8.2 with Emotion and Framer Motion
- Bundle size: ~647KB (217KB gzipped) for vendor chunk
- 18 files using Chakra UI components
- Performance issues on mobile devices

**Target State:**
- Replace with Tailwind CSS + Headless UI
- Expected bundle reduction: ~40-50% (from 217KB to ~100-130KB gzipped)
- Better mobile performance
- Maintained functionality and design

**Timeline:** 4-6 weeks (phased approach)

---

## Phase 1: Preparation & Setup (Week 1)

### 1.1 Analysis & Inventory
- [ ] **Audit all Chakra UI components in use**
  - Document all components per file
  - Identify custom styling patterns
  - List all theme customizations
  - Map component usage frequency

- [ ] **Create component mapping table**
  ```
  Chakra UI Component → Tailwind/Headless UI Equivalent
  - Box → div with Tailwind classes
  - Button → Headless UI Button or native button
  - Card → Custom component with Tailwind
  - Container → div with max-width utilities
  - Grid/GridItem → Tailwind Grid
  - Heading → h1-h6 with Tailwind typography
  - Text → p/span with Tailwind
  - Spinner → Custom spinner or react-spinners
  - Alert → Headless UI Alert
  - Modal/Dialog → Headless UI Dialog
  - Menu → Headless UI Menu
  - Form components → Headless UI Form + Tailwind
  ```

- [ ] **Measure current bundle size**
  - Document exact bundle sizes
  - Identify largest dependencies
  - Create baseline metrics

### 1.2 Setup New Stack
- [ ] **Install dependencies**
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npm install @headlessui/react @heroicons/react
  npm install react-spinners  # For loading spinners
  ```

- [ ] **Configure Tailwind CSS**
  - Initialize Tailwind config
  - Set up PostCSS
  - Configure content paths
  - Set up design tokens (colors, spacing, typography)
  - Configure breakpoints to match current theme

- [ ] **Create design system**
  - Extract color palette from current theme
  - Define typography scale
  - Create spacing scale
  - Set up component variants

- [ ] **Create utility components**
  - Base components (Button, Card, Container, etc.)
  - Layout components (Grid, Stack, Flex)
  - Form components
  - Loading states

### 1.3 Create Migration Branch
- [ ] Create feature branch: `feature/tailwind-migration`
- [ ] Set up parallel development environment
- [ ] Document migration strategy

---

## Phase 2: Core Components Migration (Week 2)

### 2.1 Base Components (Priority: High)
- [ ] **Create Button component**
  - Match current Chakra Button API
  - Support all variants (solid, outline, ghost)
  - Support all sizes
  - Support loading state
  - Support disabled state

- [ ] **Create Card component**
  - Match current Card styling
  - Support CardHeader, CardBody, CardFooter
  - Support hover effects
  - Support different variants

- [ ] **Create Container component**
  - Match current max-widths
  - Support responsive padding
  - Support different sizes

- [ ] **Create Typography components**
  - Heading (h1-h6) with size variants
  - Text component with variants
  - Link component

- [ ] **Create Layout components**
  - Box (div wrapper)
  - Flex/Stack (flexbox utilities)
  - Grid (CSS Grid wrapper)
  - Spacer

### 2.2 Form Components
- [ ] **Create Input component**
  - Match Chakra Input API
  - Support error states
  - Support sizes
  - Support variants

- [ ] **Create Textarea component**
- [ ] **Create Select component** (using Headless UI)
- [ ] **Create Checkbox component** (using Headless UI)
- [ ] **Create Radio component** (using Headless UI)
- [ ] **Create FormControl/FormLabel/FormErrorMessage**

### 2.3 Feedback Components
- [ ] **Create Spinner/Loading component**
  - Use react-spinners or custom CSS spinner
  - Match current spinner styles

- [ ] **Create Alert component**
  - Use Headless UI Alert
  - Support variants (success, error, warning, info)
  - Support icons

- [ ] **Create Skeleton component**
  - Custom CSS-based skeleton
  - Match current loading states

---

## Phase 3: Complex Components Migration (Week 3)

### 3.1 Navigation Components
- [ ] **Migrate TopNavigation**
  - Replace Chakra Menu with Headless UI Menu
  - Replace Chakra Icons with Heroicons
  - Maintain mobile menu functionality
  - Maintain search functionality

- [ ] **Migrate CategoryNavigation**
  - Replace Chakra components
  - Maintain active state styling
  - Maintain responsive behavior

### 3.2 Modal/Dialog Components
- [ ] **Create Modal component** (using Headless UI Dialog)
  - Match current modal API
  - Support sizes
  - Support close button
  - Support overlay

### 3.3 Dropdown/Menu Components
- [ ] **Create Dropdown component** (using Headless UI Menu)
- [ ] **Create Popover component** (using Headless UI Popover)

### 3.4 Data Display Components
- [ ] **Migrate StoryCard component**
  - Replace Chakra Card, Image, Text, Badge
  - Maintain hover effects
  - Maintain responsive layout

- [ ] **Migrate AdComponent**
  - Replace Chakra Box, Image, Link
  - Maintain styling

---

## Phase 4: Page-Level Migration (Week 4)

### 4.1 HomePage Migration
- [ ] Replace all Chakra components
- [ ] Maintain grid layout
- [ ] Maintain responsive behavior
- [ ] Maintain loading states
- [ ] Maintain error states
- [ ] Test all interactions

### 4.2 ArticlePage Migration
- [ ] Replace all Chakra components
- [ ] Maintain article layout
- [ ] Maintain social sharing
- [ ] Maintain comments section
- [ ] Test all interactions

### 4.3 ContactPage Migration
- [ ] Replace all Chakra components
- [ ] Maintain form layout
- [ ] Maintain validation
- [ ] Maintain success/error messages
- [ ] Test form submission

### 4.4 SettingsPage Migration
- [ ] Replace all Chakra components
- [ ] Maintain admin layout
- [ ] Maintain form controls
- [ ] Maintain data tables
- [ ] Test all admin functions

### 4.5 Other Components
- [ ] Migrate ErrorBoundary
- [ ] Migrate NewsletterSubscription
- [ ] Migrate SocialShare
- [ ] Migrate FormattedText
- [ ] Migrate CategoryNavigation

---

## Phase 5: Testing & Refinement (Week 5)

### 5.1 Visual Testing
- [ ] **Pixel-perfect comparison**
  - Compare each page side-by-side
  - Ensure all spacing matches
  - Ensure all colors match
  - Ensure all typography matches

- [ ] **Responsive testing**
  - Test all breakpoints
  - Test mobile (320px - 767px)
  - Test tablet (768px - 1023px)
  - Test desktop (1024px+)

- [ ] **Browser testing**
  - Chrome/Edge
  - Firefox
  - Safari
  - Mobile browsers (iOS Safari, Chrome Mobile)

### 5.2 Functional Testing
- [ ] **Test all interactions**
  - Button clicks
  - Form submissions
  - Navigation
  - Modals/dialogs
  - Dropdowns/menus
  - Search functionality

- [ ] **Test all states**
  - Loading states
  - Error states
  - Success states
  - Disabled states
  - Hover states
  - Focus states

### 5.3 Performance Testing
- [ ] **Measure bundle size**
  - Compare before/after
  - Verify reduction targets met
  - Check tree-shaking effectiveness

- [ ] **Measure runtime performance**
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - Total Blocking Time (TBT)
  - Cumulative Layout Shift (CLS)

- [ ] **Mobile performance**
  - Test on real devices
  - Measure scroll performance
  - Measure interaction responsiveness

### 5.4 Accessibility Testing
- [ ] **Keyboard navigation**
  - Tab order
  - Focus indicators
  - Keyboard shortcuts

- [ ] **Screen reader testing**
  - ARIA labels
  - Semantic HTML
  - Announcements

- [ ] **Color contrast**
  - WCAG AA compliance
  - WCAG AAA where possible

---

## Phase 6: Cleanup & Deployment (Week 6)

### 6.1 Code Cleanup
- [ ] **Remove Chakra UI dependencies**
  ```bash
  npm uninstall @chakra-ui/react @chakra-ui/icons
  npm uninstall @emotion/react @emotion/styled
  npm uninstall framer-motion
  ```

- [ ] **Remove unused code**
  - Delete old theme.js (or convert to Tailwind config)
  - Remove Chakra-specific utilities
  - Clean up imports

- [ ] **Update documentation**
  - Update component documentation
  - Update style guide
  - Update migration notes

### 6.2 Final Testing
- [ ] **End-to-end testing**
  - Test complete user flows
  - Test admin flows
  - Test edge cases

- [ ] **Regression testing**
  - Ensure no features broken
  - Ensure no visual regressions
  - Ensure performance maintained/improved

### 6.3 Deployment
- [ ] **Staging deployment**
  - Deploy to staging environment
  - Run smoke tests
  - Get stakeholder approval

- [ ] **Production deployment**
  - Create deployment plan
  - Schedule deployment window
  - Deploy with rollback plan
  - Monitor performance metrics

- [ ] **Post-deployment**
  - Monitor error logs
  - Monitor performance metrics
  - Gather user feedback
  - Address any issues

---

## Component Mapping Reference

### Layout Components
| Chakra UI | Tailwind CSS Equivalent |
|-----------|------------------------|
| `Box` | `div` with Tailwind classes |
| `Container` | `div` with `max-w-*` and `mx-auto` |
| `Flex` | `div` with `flex` classes |
| `HStack` | `div` with `flex flex-row` |
| `VStack` | `div` with `flex flex-col` |
| `Grid` | `div` with `grid` classes |
| `GridItem` | `div` with grid column classes |
| `SimpleGrid` | `div` with `grid grid-cols-*` |
| `Spacer` | `div` with `flex-1` |

### Typography
| Chakra UI | Tailwind CSS Equivalent |
|-----------|------------------------|
| `Heading` | `h1-h6` with `text-*` classes |
| `Text` | `p` or `span` with `text-*` classes |
| `Link` | `a` with `text-blue-*` and hover states |

### Form Components
| Chakra UI | Headless UI + Tailwind |
|-----------|------------------------|
| `Input` | Custom component with Tailwind |
| `Textarea` | Custom component with Tailwind |
| `Select` | Headless UI Listbox |
| `Checkbox` | Headless UI Switch/Checkbox |
| `Radio` | Headless UI RadioGroup |
| `FormControl` | Custom wrapper component |
| `FormLabel` | `label` with Tailwind |
| `FormErrorMessage` | `span` with error styling |

### Feedback Components
| Chakra UI | Replacement |
|-----------|-------------|
| `Spinner` | `react-spinners` or custom CSS |
| `Alert` | Headless UI Alert |
| `Skeleton` | Custom CSS skeleton |
| `Progress` | Custom progress bar |

### Overlay Components
| Chakra UI | Headless UI |
|-----------|-------------|
| `Modal` | `Dialog` |
| `Drawer` | `Dialog` with slide animation |
| `Popover` | `Popover` |
| `Tooltip` | `Popover` or custom tooltip |
| `Menu` | `Menu` |
| `Dropdown` | `Menu` |

### Data Display
| Chakra UI | Tailwind CSS Equivalent |
|-----------|------------------------|
| `Card` | Custom component with Tailwind |
| `CardHeader` | `div` with padding |
| `CardBody` | `div` with padding |
| `CardFooter` | `div` with padding |
| `Image` | `img` with Tailwind classes |
| `Badge` | `span` with `badge` classes |
| `Divider` | `hr` with Tailwind styling |
| `Table` | `table` with Tailwind classes |

### Icons
| Chakra UI | Heroicons |
|-----------|-----------|
| `@chakra-ui/icons` | `@heroicons/react` |
| `SearchIcon` | `MagnifyingGlassIcon` |
| `HamburgerIcon` | `Bars3Icon` |
| `ChevronDownIcon` | `ChevronDownIcon` |
| `EmailIcon` | `EnvelopeIcon` |

---

## Tailwind Configuration Template

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0073e6',
          600: '#005bb3',
          700: '#004280',
          800: '#002a4d',
          900: '#00111a',
        },
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      screens: {
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## Risk Assessment

### High Risk
- **Breaking changes during migration** → Mitigation: Phased approach, thorough testing
- **Visual regressions** → Mitigation: Side-by-side comparison, pixel-perfect testing
- **Performance degradation** → Mitigation: Performance testing at each phase

### Medium Risk
- **Timeline delays** → Mitigation: Buffer time built in, prioritize critical components
- **Learning curve** → Mitigation: Good documentation, pair programming

### Low Risk
- **Bundle size not meeting targets** → Mitigation: Tree-shaking, code splitting
- **Accessibility issues** → Mitigation: Use Headless UI (built-in a11y)

---

## Success Metrics

### Performance Targets
- **Bundle size reduction:** 40-50% (from 217KB to 100-130KB gzipped)
- **FCP improvement:** 20-30% faster
- **LCP improvement:** 15-25% faster
- **TBT reduction:** 30-40% reduction
- **Mobile performance:** 25-35% improvement

### Quality Targets
- **Zero visual regressions**
- **100% feature parity**
- **WCAG AA compliance maintained**
- **All tests passing**

---

## Rollback Plan

If critical issues arise:
1. Keep Chakra UI branch active
2. Revert to previous commit
3. Deploy previous version
4. Investigate issues
5. Fix and retry migration

---

## Resources & Documentation

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Headless UI Documentation](https://headlessui.com/)
- [Heroicons Documentation](https://heroicons.com/)
- [React Spinners](https://www.davidhu.io/react-spinners/)
- [Tailwind UI Components](https://tailwindui.com/) (reference, not required)

---

## Notes

- This migration can be done incrementally
- Consider keeping Chakra UI for admin pages if needed
- Can use both libraries during transition period
- Test thoroughly at each phase before proceeding


