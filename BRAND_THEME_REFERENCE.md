# Brand Theme Reference

## Plain CSS Variables

```css
:root {
  --color-bg-top: #f4f7fb;
  --color-bg-bottom: #e9eff6;
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;
  --color-panel: rgba(18, 34, 53, 0.94);
  --color-text: #162235;
  --color-muted: #5c6b7c;
  --color-muted-strong: #48586a;
  --color-primary: #1f5d8c;
  --color-primary-hover: #17486d;
  --color-accent: #8fb7d8;
  --color-success: #2e7d6d;
  --color-danger: #c55b66;
  --color-border: rgba(22, 34, 53, 0.1);
}
```

## Tailwind Theme Config

```js
export default {
  theme: {
    extend: {
      colors: {
        ice: '#f4f7fb',
        frost: '#e9eff6',
        ink: '#162235',
        slate: '#5c6b7c',
        harbor: '#1f5d8c',
        harborHover: '#17486d',
        iceBlue: '#8fb7d8',
        success: '#2e7d6d',
        danger: '#c55b66'
      },
      boxShadow: {
        glass: '0 18px 44px rgba(22, 34, 53, 0.08)',
        glassHover: '0 26px 54px rgba(31, 93, 140, 0.16)'
      },
      borderRadius: {
        glass: '1.25rem'
      },
      backgroundImage: {
        'ice-mist': 'radial-gradient(circle at top left, rgba(31, 93, 140, 0.12), transparent 34%), radial-gradient(circle at top right, rgba(143, 183, 216, 0.18), transparent 24%), linear-gradient(180deg, #f4f7fb, #e9eff6)',
        'harbor-button': 'linear-gradient(135deg, #1f5d8c, #4479a3)'
      }
    }
  }
};
```

## React Theme Object

```js
export const brandTheme = {
  colors: {
    bgTop: '#f4f7fb',
    bgBottom: '#e9eff6',
    surface: 'rgba(255, 255, 255, 0.92)',
    surfaceStrong: '#ffffff',
    panel: 'rgba(18, 34, 53, 0.94)',
    text: '#162235',
    muted: '#5c6b7c',
    mutedStrong: '#48586a',
    primary: '#1f5d8c',
    primaryHover: '#17486d',
    accent: '#8fb7d8',
    success: '#2e7d6d',
    danger: '#c55b66',
    border: 'rgba(22, 34, 53, 0.1)'
  },
  radii: {
    card: '1.25rem',
    pill: '9999px',
    input: '1rem'
  },
  shadows: {
    card: '0 18px 44px rgba(22, 34, 53, 0.08)',
    hover: '0 26px 54px rgba(31, 93, 140, 0.16)',
    focus: '0 0 0 4px rgba(143, 183, 216, 0.28)'
  },
  backgrounds: {
    app: 'radial-gradient(circle at top left, rgba(31, 93, 140, 0.12), transparent 34%), radial-gradient(circle at top right, rgba(143, 183, 216, 0.18), transparent 24%), linear-gradient(180deg, #f4f7fb, #e9eff6)',
    card: 'rgba(255, 255, 255, 0.92)',
    primaryButton: 'linear-gradient(135deg, #1f5d8c, #4479a3)'
  }
};
```

## Figma-Friendly Style Spec

- Background: Ice Mist `#F4F7FB` to Frost `#E9EFF6`
- Surface: Soft white glass `rgba(255,255,255,0.92)`
- Main text: Ink `#162235`
- Muted text: Slate `#5C6B7C`
- Accent: Ice Blue `#8FB7D8`
- Primary action: Harbor Blue `#1F5D8C`
- Border: `rgba(22, 34, 53, 0.1)`
- Card radius: `20px`
- Card shadow: `0 18px 44px rgba(22, 34, 53, 0.08)`
- App background: radial top-left steel blue glow, radial top-right ice blue glow, vertical Ice Mist to Frost gradient
- Primary button: 135 degree Harbor Blue gradient with full pill radius
