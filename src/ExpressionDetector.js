import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
const faceapi = window.faceapi;


const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Traducciones y colores asociados
const expressionColors = {
  happy: 'lightgreen',
  angry: 'lightcoral',
  sad: 'lightblue',
  surprised: 'khaki',
  disgusted: 'plum',
  fearful: 'orange',
  neutral: 'white'
};

const expressionTranslations = {
  neutral: 'Neutral 😐',
  happy: 'Feliç 😊',
  sad: 'Trist 😢',
  angry: 'Enfadat 😠',
  fearful: 'Espantat 😨',
  disgusted: 'Disgustat 🤢',
  surprised: 'Sorprès 😮',
};

const ExpressionDetector = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectedExpression, setDetectedExpression] = useState('Detectant...');
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [bgColor, setBgColor] = useState('white');
  const intervalRef = useRef(null);

  // --- PAS A: Carregar models ---
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('✅ Models carregats!');
      } catch (err) {
        console.error('❌ Error carregant models:', err);
      }
    };
    loadModels();

    return () => clearInterval(intervalRef.current);
  }, []);

  // --- PAS B: Detecció en temps real ---
  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video && canvasRef.current && modelsLoaded) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const displaySize = { width: VIDEO_WIDTH, height: VIDEO_HEIGHT };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const dominant = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );

          setDetectedExpression(expressionTranslations[dominant] || dominant);
          setBgColor(expressionColors[dominant] || 'white');

          const resized = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceLandmarks(canvas, resized); // 🔹 Dibuix dels 68 punts
        } else {
          setDetectedExpression('Sense rostre detectat');
          setBgColor('white');
        }
      }
    }, 500);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: bgColor,
      minHeight: '100vh',
      transition: 'background-color 0.5s ease'
    }}>
      <h2>🎭 El Reflex de l'Emoció</h2>
      {!modelsLoaded ? <p>Carregant models...</p> : <p>Models Carregats!</p>}

      <div style={{ position: 'relative', width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          videoConstraints={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: 'user' }}
          onUserMedia={startDetection}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {modelsLoaded && <h3 style={{ marginTop: 20 }}>Estat d'ànim: {detectedExpression}</h3>}
    </div>
  );
};

export default ExpressionDetector;
