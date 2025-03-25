"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import * as fabric from "fabric"; // v6
import { Button } from "@mui/material";

// Set workerSrc to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFWithFabric() {
  const pdfCanvasRef = useRef(null); // PDF canvas
  const fabricCanvasRef = useRef(null); // Fabric.js canvas
  const fabricInstanceRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("http://localhost:4333/uploadfile/GM(W)-SCR-TESTING-NED-ADB-57-25.pdf ");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 }); // Default size

  // Load PDF document
  const loadPdfFromUrl = async () => {
    try {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  };

  // Render PDF page
  const renderPdf = () => {
    if (!pdfDocument || !pdfCanvasRef.current) return;

    const canvas = pdfCanvasRef.current;
    const context = canvas.getContext("2d");

    pdfDocument.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1.0 });

      // Update both canvases to match PDF size
      setCanvasSize({ width: viewport.width, height: viewport.height });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = { canvasContext: context, viewport };
      page.render(renderContext);
    });
  };

  const addRectangle = () => {
    if (!fabricInstanceRef.current) return;

    const fabricCanvas = fabricInstanceRef.current;

    const rect = new fabric.Rect({
      left: 10, // Random position
      top: 10,
      width: 100,
      height: 100,
      fill: "blue",
      opacity: 0.5,
      selectable: true, // Allow movement
    });

    fabricCanvas.add(rect);
    fabricCanvas.renderAll();
  };

  const deleteSelectedObject = () => {
    if (!fabricInstanceRef.current) return;

    const fabricCanvas = fabricInstanceRef.current;
    const activeObject = fabricCanvas.getActiveObject();

    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.discardActiveObject(); // Remove selection
      fabricCanvas.renderAll();
    }
  };
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
      backgroundColor: "transparent",
      selection: true,
    });

    // Store Fabric.js instance
    fabricInstanceRef.current = fabricCanvas;

    // Add event listener for Delete key
    const handleKeyDown = (event) => {
      if (event.key === "Delete") {
        deleteSelectedObject();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.dispose();
    };
  }, []);
  // Initialize Fabric.js overlay
//   useEffect(() => {
//     if (!fabricCanvasRef.current) return;

//     const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
//       backgroundColor: "transparent",
//       selection: true, // Allow object selection
//     });

//     // Store Fabric.js instance
//     fabricInstanceRef.current = fabricCanvas;

//     return () => fabricCanvas.dispose();
//   }, []);

  // Resize Fabric.js when PDF size updates
  const transformData = (data) => {
    return data.flatMap((character) => [character, '']);
};
  useEffect(() => {
    if (fabricInstanceRef.current && fabricCanvasRef.current) {
      fabricInstanceRef.current.setWidth(canvasSize.width);
      fabricInstanceRef.current.setHeight(canvasSize.height);
      fabricInstanceRef.current.renderAll();
    }
  }, [canvasSize]);

  // Add shapes on PDF (Ensure they align correctly)
//   useEffect(() => {
//     if (!fabricInstanceRef.current) return;

//     const fabricCanvas = fabricInstanceRef.current;

//     // Remove existing objects before adding new ones
//     fabricCanvas.clear();

//     // Create a red rectangle
//     const rect = new fabric.Rect({
//       left: 50,
//       top: 50,
//       width: 100,
//       height: 100,
//       fill: "red",
//       opacity: 0.5, // Semi-transparent
//     });

//     // Create a white circle
//     const circle = new fabric.Circle({
//       left: 200,
//       top: 100,
//       radius: 50,
//       fill: "white",
//       opacity: 0.5,
//     });

//     fabricCanvas.add(rect, circle);
//     fabricCanvas.renderAll();
//   }, [canvasSize]); // Run whenever PDF resizes

  // Load PDF on mount
  useEffect(() => {
    loadPdfFromUrl();
  }, []);

  useEffect(() => {
    renderPdf();
  }, [pdfDocument]);

const addTable = ()=>{
    if (!fabricInstanceRef.current) return;
    const fabricCanvas = fabricInstanceRef.current;
    const tempTable = ['Signed by RAVI TEJA',' ', 'Signed by AUTOBOT', ' ']
    console.log('table details flatarray', 'multipletables', tempTable);
    let maxString = findLongestInArray(tempTable);
    const currentDate = new Date();
    let xx = 0;
    tableInfo = {
        x: 500,
        y: 200,
        rows: tableLength,
        columns: 2,
        cellWidth: (100*(maxString.length/24))+20,
        cellHeight: 50
    };
    const temp = new fabric.Group([], {
        left: tableInfo.x,
        top: tableInfo.y,
        id: currentDate.toISOString() + 'myTable'
    });
    tableGroup[currentPage] = temp;

    const signRect = new fabric.Rect({
        left: tableInfo.cellWidth - 100*(maxString.length/24) -20 ,
        top: (tableInfo.cellHeight - 100)+ tableInfo.y,
        fill: 'white',
        stroke: 'black',
        width: (tableInfo.cellWidth * 6),
        height: tableInfo.cellHeight,
        lockRotation: true,
        rotatable: false
    });

    const signCellText = new fabric.Text('Signature Heading', {
        left: tableInfo.cellWidth + 40,
        top: (tableInfo.cellHeight + 10 - 100)+ tableInfo.y,
        fontSize: 24,
        fill: 'black',
        originX: 'left',
        originY: 'top',
        lockRotation: true,
        rotatable: false
    });
    
    tableGroup[currentPage].addWithUpdate(signRect);
    tableGroup[currentPage].addWithUpdate(signCellText);

    for (let i = 0; i < tableInfo.rows; i++) {
        for (let j = 0; j < tableInfo.columns; j++) {
            console.log('x,y', i, j);

            const rect = new fabric.Rect({
                left: j === 0 ? j * tableInfo.cellWidth : j * tableInfo.cellWidth * 2,
                top: (i * tableInfo.cellHeight) + tableInfo.y,
                fill: 'white',
                stroke: 'black',
                width: j === 0 ? tableInfo.cellWidth * 2 : tableInfo.cellWidth * 4,
                height: tableInfo.cellHeight,
                lockRotation: true,
                rotatable: false
            });

            const cellText = new fabric.Text(multipleTables[currentTable][xx], {
                left: j === 0 ? j * tableInfo.cellWidth + 10 : j * 2 * tableInfo.cellWidth + 10,
                top: (i * tableInfo.cellHeight + 10) + tableInfo.y,
                fontSize: 14,
                fill: 'black',
                originX: 'left',
                originY: 'top',
                lockRotation: true,
                rotatable: false
            });
            tableGroup[currentPage].addWithUpdate(rect);
            tableGroup[currentPage].addWithUpdate(cellText);
            xx++;
        }
    }

    fabricCanvas.add(tableGroup[currentPage]);
    console.log('table being added', tableGroup);
    saveAnnotation();
}
  return (
    <div>
          <div style={{ marginBottom: "10px" }}>
          <Button
        onClick={addRectangle}
        variant="contained"
      >
        Add Rectangle
      </Button>
      <Button
          onClick={deleteSelectedObject}
          variant="contained"
 
        >
          Delete Selected
        </Button>
         <Button
        variant="contained"
        >
          Export to PDF
        </Button>
          </div>
      <div
      style={{
        position: "relative",
        width: canvasSize.width,
        height: canvasSize.height,
        overflow: "auto", // Enable scrolling
      }}
    >
      {/* Wrapper div for PDF canvas with transparency */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          mixBlendMode: "multiply", // Makes PDF canvas blend correctly
        }}
      >
        {/* PDF Canvas */}
        <canvas
          ref={pdfCanvasRef}
          id="pdfViewer"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent", // Make sure PDF background is invisible
            zIndex: 0, // Keep PDF behind Fabric.js
          }}
        />
      </div>
      <canvas
        ref={fabricCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2, // Ensure it's above the PDF
        }}
      />
    </div>
    </div>
   
  );
}
