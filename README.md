# PTPal Demo - Physical Therapy Assistant

A web-based demo application for PTPal, a physical therapy assistant that uses pose estimation to help patients perform PT exercises correctly.

## Project Overview

PTPal is a capstone project that aims to create a physical therapy assistant using pose estimation technology (BlazePose) to provide real-time feedback on exercise form. This demo serves as a foundation for understanding the technical requirements and creating a detailed development plan.

## Current Demo Features

- ✅ Live webcam feed display
- ✅ Modern, responsive web interface
- ✅ Camera access controls (start/stop)
- ✅ Canvas overlay ready for pose estimation
- ✅ Error handling for camera access issues

## Future Features (To Be Implemented)

- 🔄 Real-time pose estimation using BlazePose
- 🔄 Pose detection and comparison
- 🔄 Real-time feedback (correct/incorrect pose)
- 🔄 Exercise-specific pose templates
- 🔄 Progress tracking and analytics

## Getting Started

### Prerequisites

- A modern web browser with camera access support
- A webcam or camera-enabled device
- No additional software installation required (runs entirely in the browser)

### Running the Demo

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd PTPal_Demo
   ```

2. **Open the application**
   - Option 1: Double-click `index.html` to open in your default browser
   - Option 2: Use a local web server for better performance:
     ```bash
     # Using Python (if installed)
     python -m http.server 8000
     # Then visit http://localhost:8000
     
     # Using Node.js (if installed)
     npx serve .
     ```

3. **Allow camera access**
   - Click "Start Camera" when prompted
   - Allow camera access when your browser asks for permission

### Troubleshooting

**Camera not working?**
- Ensure your camera is not being used by another application
- Check that your browser has permission to access the camera
- Try refreshing the page and clicking "Start Camera" again

**Page not loading?**
- Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Try opening the developer console (F12) to check for any error messages

## Technical Details

### Current Architecture

- **Frontend**: Pure HTML5, CSS3, and JavaScript (no frameworks)
- **Camera Access**: WebRTC getUserMedia API
- **Canvas Overlay**: HTML5 Canvas for pose estimation visualization
- **Responsive Design**: Mobile-friendly interface

### File Structure

```
PTPal_Demo/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # This file
└── .gitignore          # Git ignore file
```

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Development Roadmap

### Phase 1: Basic Webcam Demo ✅
- [x] Live webcam feed
- [x] Basic UI/UX
- [x] Camera controls

### Phase 2: Pose Estimation Integration (Next)
- [ ] Integrate BlazePose model
- [ ] Real-time pose detection
- [ ] Pose visualization overlay

### Phase 3: Pose Analysis (Future)
- [ ] Pose comparison algorithm
- [ ] Exercise-specific templates
- [ ] Real-time feedback system

### Phase 4: Advanced Features (Future)
- [ ] Exercise progress tracking
- [ ] Multiple exercise support
- [ ] Data analytics and reporting

## Contributing

This is a capstone project. For team members:

1. Fork or clone the repository
2. Create a feature branch for your work
3. Test thoroughly before submitting changes
4. Document any new features or modifications

## Technologies to Research

Based on this demo, the team should research:

1. **BlazePose Integration**
   - MediaPipe BlazePose model
   - TensorFlow.js for browser-based ML
   - Performance optimization for real-time processing

2. **Pose Comparison Algorithms**
   - Key point distance calculations
   - Angle measurements between joints
   - Temporal smoothing for stable detection

3. **Exercise Database**
   - Standard PT exercise poses
   - Key point configurations for each exercise
   - Tolerance thresholds for "correct" poses

4. **User Experience**
   - Real-time feedback design
   - Progress visualization
   - Accessibility considerations

## License

This project is part of a capstone course at Northeastern University.

## Team

- Capstone Project - PTPal Physical Therapy Assistant
- Northeastern University - EECE4792

---

*Last updated: [Current Date]*
