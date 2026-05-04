export const darkColors = {
    primary: {
        light: "#AFC6FF", // Muted Blue-Gray
        main: "#82AAFF", // Bright Blue (Night Owl's primary)
        dark: "#4976A1", // Deep Cool Blue - bg/decorative only, fails AA as text
    },
    secondary: {
        light: "#A3B7C7",   // subtle highlight-level secondary
        main: "#8DA0AF",    // neutral midtone, good for icons/labels
        dark: "#2A3F51",    // subdued for borders and inactive elements
    },
    accent: {
        cyan: "#7fdbca", // Data / numeric emphasis - Night Owl's iconic code color
        coral: "#FFAB70", // Warmth / attention - notifications, offline, gentle warnings
        green: "#C3E88D", // Success / positive - completion, validation, positive deltas
        pink: "#F07178", // Error / destructive - errors, delete, failed operations
        yellow: "#FFCB6B", // Highlight / emphasis - ratings, streaks, featured content
        purple: "#C792EA", // Premium / special - quizzes, achievements, special features
    },
    status: {
        playing: "#D4A44E",   // Muted amber   (hue 39)  - 8.0:1 on base
        queued: "#4EA8C4",    // Muted teal    (hue 194) - 6.7:1 on base
        completed: "#6DAE6A", // Muted sage    (hue 117) - 6.9:1 on base
        dropped: "#C87070",   // Muted rose    (hue 0)   - 5.2:1 on base
        backlog: "#9878BE",   // Muted purple  (hue 267) - 5.0:1 on base
    },
    semantic: {
        success: "#C3E88D",  // = accent.green
        warning: "#FFCB6B",  // = accent.yellow
        error: "#F07178",    // = accent.pink
        info: "#82AAFF",     // = primary.main
    },
    neutral: {
        white: "#FFFFFF",
        lightGray: "#D6DEEB", // Night Owl's Light Text
        gray: "#637777", // Night Owl's Comment Color - fails AA as text, decorative only
        darkGray: "#1D3B53", // Night Owl's Border Color
        black: "#000000",
    },
    background: {
        light: "#D6DEEB", // Light mode text / dark mode background text
        medium: "#1D3B53", // Night Owl's Selection Background
        elevated: "#132A3E", // Elevated Background
        surface: "#0A1E30", // Nested Background (Even darker than dark)
        base: "#011627", // Night Owl's Main Background
        floor: "#010E18", // Deepest Background (For maximum contrast)
        scrim: "rgba(1, 22, 39, 0.6)", // Modal/sheet overlay — Night Owl base at 60% opacity
    },
    text: {
        primary: "#D6DEEB", // Night Owl's Primary Text - 13.5:1 AAA on base
        secondary: "#9DB2C0", // Muted text - 8.3:1 AAA on base
        inverse: "#011627", // Dark Text on Light/Accent Backgrounds
        muted: "#7E8E94", // Caption/tertiary text - 5.4:1 AA on base (adjusted from #637777)
    },
};

export const lightColors = {
    primary: {
        // Blue family used across Night Owl Light (strings, headings, UI accents)
        light: "#6FBEF6", // editorGutter.modifiedBackground
        main: "#4876D6", // token String, many UI accents - AA-large only on light bg
        dark: "#288ED7", // terminal.ansiBlue
    },
    secondary: {
        light: "#A9C4D8",   // gentle cool highlight
        main: "#87A4B8",   // strong midtone for icons / inactive states
        dark: "#5E7484",   // deep cool neutral for borders or low-emphasis text
    },
    accent: {
        cyan: "#176D67", // Data / numeric emphasis
        coral: "#9B3F3D", // Warmth / attention
        green: "#0B6B51", // Success / positive
        pink: "#92215F", // Error / destructive
        yellow: "#7A5B00", // Highlight / emphasis
        purple: "#6B2FA0", // Premium / special
    },
    status: {
        playing: "#7D6020",   // Dark muted amber  - 5.7:1 AA on light
        queued: "#276C76",    // Dark muted teal   - 5.8:1 AA on light
        completed: "#3E7A3A", // Dark muted sage   - 5.0:1 AA on light
        dropped: "#9E4A4A",   // Dark muted rose   - 5.7:1 AA on light
        backlog: "#6B4D8A",   // Dark muted purple - 6.6:1 AA on light
    },
    semantic: {
        success: "#0B6B51",  // = accent.green
        warning: "#7A5B00",  // = accent.yellow
        error: "#92215F",    // = accent.pink
        info: "#4876D6",     // = primary.main
    },
    neutral: {
        white: "#FFFFFF",
        lightGray: "#93A1A1", // subtle text gray / terminal white
        gray: "#697098", // quotes / subdued UI text
        darkGray: "#403F53", // primary foreground text
        black: "#000000",
    },
    background: {
        light: "#FBFBFB", // editor.background (page background)
        medium: "#F6F6F6", // panels, inputs, many UI surfaces
        base: "#EFEFEF", // editorGroup / terminal background tint
        surface: "#E7ECF2", // list.inactiveSelectionBackground
        floor: "#D6E4F2", // list.activeSelectionBackground (light tint band)
        scrim: "rgba(64, 63, 83, 0.5)", // Modal/sheet overlay — Night Owl Light foreground at 50% opacity
    },
    text: {
        primary: "#403F53", // main foreground - 9.9:1 AAA on light
        secondary: "#5A607A", // secondary info - 6.0:1 AA on light (adjusted from #697098)
        inverse: "#FBFBFB", // text on strong-colored buttons
        muted: "#78808A", // caption/tertiary - 3.9:1 AA-large on light (adjusted from #93A1A1)
    },
};

// Use darkColors for the game (can switch to lightColors for light mode)
export const colors = darkColors;
