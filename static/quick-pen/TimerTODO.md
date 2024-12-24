# QuickPen Sprint Timer Revamp

## Overview
Transform the QuickPen sprint timer from a simple duration/word count input into an interactive writing environment with a live countdown timer and text editor.

## Core Features

### Timer Controls
- ~~Duration input (MM:SS format) - ✓ existing validation~~
- ~~Countdown display (MM:SS)~~
- ~~Control buttons:~~
  - ~~Start~~
  - ~~Pause/Resume~~
  - ~~Discard (with confirmation)~~
- ~~Visual timer progress indicator~~

### Writing Interface
- ~~Large text area for writing~~
- ~~Text area states:~~
  - ~~Disabled (before sprint starts)~~
  - ~~Enabled (during active sprint)~~
  - ~~Read-only (when sprint ends/paused)~~
- ~~Word count display updates in real-time~~
- Auto-save functionality to prevent loss of work

### Sprint Flow
1. ~~User enters duration~~
2. ~~User clicks start~~
3. ~~Timer begins counting down~~
4. ~~Text area becomes enabled~~
5. ~~User writes content~~
6. ~~Timer reaches zero or user ends sprint~~
7. ~~Text area becomes read-only~~
8. ~~System counts words~~
9. ~~Sprint data saved to backend~~

### Data Structure

```javascript
{
id: number,
timestamp: string,
wordCount: number,
wpm: number,
duration: string,
content: string, // New field for storing written text
completed: boolean // Track if sprint was completed or discarded
}
```

## Technical Implementation Plan

### Phase 1: Timer UI
1. ~~Create countdown display component~~
2. ~~Implement timer logic~~
3. ~~Add control buttons~~
4. ~~Add progress indicator~~

### Phase 2: Writing Interface
1. ~~Add text area component~~
2. ~~Implement state management~~
3. ~~Add real-time word counting~~
4. Implement auto-save functionality

### Phase 3: Integration
1. ~~Connect timer with text area states~~
2. ~~Update sprint submission logic~~
3. ~~Modify backend API to handle content storage~~
4. ~~Add error handling and recovery~~

### Phase 4: Backend Updates
1. ~~Update Sprint struct to include new fields:~~
   - ~~content (string)~~
   - ~~completed (boolean)~~
2. ~~Modify storage structure:~~
   - ~~Add completed field to sprint metadata~~
   - ~~Store content in separate files~~
3. ~~Update API handlers:~~
   - ~~Modify POST /api/quick-pen/sprint~~
   - ~~Update GET /api/quick-pen/sprints~~
   - ~~Add GET /api/quick-pen/sprint/{id}/content~~
4. ~~Add content directory initialization~~
5. Add data migration for existing sprints
6. Update tests

## UI/UX Considerations
- ~~Clear visual hierarchy~~
- ~~Prominent timer display~~
- ~~Distraction-free writing environment~~
- ~~Smooth transitions between states~~
- ~~Clear feedback for all actions~~
- ~~Confirmation dialogs for destructive actions~~

## Future Enhancements
- Writing prompts
- Theme customization
- Focus mode
- Export functionality
- Writing statistics and analytics
- Multiple text formats (Markdown, plain text)

