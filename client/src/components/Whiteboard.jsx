import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import { 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Trash2, 
  Undo, 
  Redo, 
  Palette,
  Download,
  Upload
} from 'lucide-react';
import { io } from 'socket.io-client';

const Whiteboard = ({ roomId, username, socket }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#90ee90', '#ffd700'
  ];

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
        isDrawingMode: false,
      });

      fabricCanvasRef.current = canvas;

      // Set up drawing brush
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;

      // Event listeners for drawing
      canvas.on('path:created', (e) => {
        if (socket) {
          const pathData = e.path.toObject();
          socket.emit('whiteboard-draw', {
            roomId,
            drawData: {
              type: 'path',
              data: pathData,
              timestamp: Date.now()
            }
          });
        }
        saveState();
      });

      canvas.on('object:added', (e) => {
        if (e.target && e.target.type !== 'path') {
          if (socket) {
            const objectData = e.target.toObject();
            socket.emit('whiteboard-draw', {
              roomId,
              drawData: {
                type: 'object',
                data: objectData,
                timestamp: Date.now()
              }
            });
          }
          saveState();
        }
      });

      // Listen for drawing events from other users
      if (socket) {
        socket.on('whiteboard-draw', ({ drawData, userId }) => {
          if (userId !== username) {
            if (drawData.type === 'path') {
              fabric.Path.fromObject(drawData.data, (path) => {
                canvas.add(path);
                canvas.renderAll();
              });
            } else if (drawData.type === 'object') {
              fabric.util.enlivenObjects([drawData.data], (objects) => {
                objects.forEach(obj => {
                  canvas.add(obj);
                });
                canvas.renderAll();
              });
            }
          }
        });

        socket.on('whiteboard-clear', ({ userId }) => {
          if (userId !== username) {
            canvas.clear();
            canvas.backgroundColor = 'white';
            canvas.renderAll();
          }
        });
      }

      // Save initial state
      saveState();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [roomId, username, socket]);

  // Update canvas settings when tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    switch (tool) {
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
        break;
      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.freeDrawingBrush.color = 'white';
        canvas.freeDrawingBrush.width = brushSize * 2;
        break;
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;
      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
  }, [tool, brushColor, brushSize]);

  // Save canvas state for undo/redo
  const saveState = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const state = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const canvas = fabricCanvasRef.current;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
      });
      
      setHistoryIndex(newIndex);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = fabricCanvasRef.current;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
      });
      
      setHistoryIndex(newIndex);
    }
  };

  // Add rectangle
  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: 2,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
  };

  // Add circle
  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
  };

  // Add text
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: brushColor,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    canvas.clear();
    canvas.backgroundColor = 'white';
    canvas.renderAll();
    
    if (socket) {
      socket.emit('whiteboard-clear', { roomId });
    }
    
    saveState();
  };

  // Download canvas as image
  const downloadImage = () => {
    const canvas = fabricCanvasRef.current;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
    });
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-secondary-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'pen' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
              title="Pen"
            >
              <Pen className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'eraser' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </button>

            <button
              onClick={addRectangle}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </button>

            <button
              onClick={addCircle}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </button>

            <button
              onClick={addText}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              title="Text"
            >
              <Type className="h-4 w-4" />
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center space-x-2 mr-4">
            <span className="text-sm text-secondary-600">Size:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-secondary-600 w-8">{brushSize}</span>
          </div>

          {/* Color Palette */}
          <div className="flex items-center space-x-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  brushColor === color 
                    ? 'border-secondary-400 scale-110' 
                    : 'border-secondary-300 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>

          <button
            onClick={downloadImage}
            className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-secondary-50 p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;