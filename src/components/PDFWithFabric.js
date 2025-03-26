"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import * as fabric from "fabric"; // v6
import { Button } from "@mui/material";
import axios from "axios";
import * as  PDFLib from 'pdf-lib'
// Set workerSrc to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFWithFabric() {
  const pdfCanvasRef = useRef(null); // PDF canvas
  const fabricCanvasRef = useRef(null); // Fabric.js canvas
  const fabricInstanceRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("http://localhost:4333/uploadfile/BR_487_RVNL_2010.pdf ");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 }); // Default size
const [pdfBytes,setPDFBytes] = useState() 
const [tableGroup, setTableGroup] = useState()
const [tableInfo, setTableInfo] = useState()
  // Load PDF document
//   const loadPdfFromUrl = async () => {
//     try {
//       const loadingTask = pdfjs.getDocument(pdfUrl);
//       const pdf = await loadingTask.promise;
//       setPdfDocument(pdf);
//     } catch (error) {
//       console.error("Error loading PDF:", error);
//     }
//   };
function uint8ArrayToBase64(uint8Array) {
    let binary = "";
    uint8Array.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary); // Convert to Base64
}
function base64ToUint8Array(base64) {
    const binaryString = atob(base64); // Decode Base64 to binary string
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array;
}
  const loadPdfFromUrl = async () => {
    try {
        const response = await axios.get(pdfUrl, {
          responseType: "arraybuffer",
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });
        console.log('content type of response',response.headers['content-type']); 
        console.log("PDF Response Headers:", response.headers);
        console.log("PDF Size:", response.data.byteLength);
        if (!response.headers["content-type"].includes("application/pdf")) {
            throw new Error("Invalid PDF file received. Check response type.");
        }
        console.log('PDF bytes', response.data)
        const typedArray = new Uint8Array(response.data);

        const headerText = new TextDecoder().decode(typedArray.slice(0, 10));
        console.log("Decoded Header:", headerText);
        if (!headerText.includes("%PDF")) {
            throw new Error("Invalid PDF format, missing PDF header.");
        }
        const base64String = uint8ArrayToBase64(typedArray);
        // console.log('base 64 string ', base64String)
        setPDFBytes(base64String); 


        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        console.log("PDF Loaded Successfully:", pdf);
        setPdfDocument(pdf);
        const page = await pdf.getPage(1);
        const rotation = page.rotate;
        console.log(`PDF Rotation: ${rotation}°`);
      } catch (error) {
        console.error("Error loading PDF:", error.message);
      } finally {
      
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
function findLongestInArray(arr) {
    return arr.reduce((longest, current) => current.length > longest.length ? current : longest, "");
}
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

  const tableData = [
    "Signed by OPTIMUS", " ",
    "Signed by AUTOBOT", " "
];

const addTable = () => {
    if (!fabricInstanceRef.current) return;

    const fabricCanvas = fabricInstanceRef.current;

    // Sample table data
  
    // Table properties
    const tableInfo = {
        x: 100,  // X position
        y: 100,  // Y position
        rows: 2,
        columns: 2,
        cellWidth: 150,
        cellHeight: 50
    };

    let index = 0;
    const objects = [];

    // Generate table cells and text
    for (let i = 0; i < tableInfo.rows; i++) {
        for (let j = 0; j < tableInfo.columns; j++) {
            // Create table cell (rectangle)
            const rect = new fabric.Rect({
                left: j * tableInfo.cellWidth,
                top: i * tableInfo.cellHeight,
                width: tableInfo.cellWidth,
                height: tableInfo.cellHeight,
                fill: "white",
                stroke: "black",
                strokeWidth: 2,
                selectable: false
            });

            // Create text inside the cell
            const cellText = new fabric.Text(tableData[index], {
                left: j * tableInfo.cellWidth + 10, // Padding inside cell
                top: i * tableInfo.cellHeight + 15,
                fontSize: 14,
                fill: "black",
                selectable: false
            });

            // Store objects for grouping
            objects.push(rect, cellText);
            index++;
        }
    }

    // Create a group with all table elements
    const tableGroup = new fabric.Group(objects, {
        left: tableInfo.x,
        top: tableInfo.y,
        hasControls: true, 
    });
    setTableGroup(tableGroup)
    setTableInfo(tableInfo)
    // Add the table group to the canvas
    fabricCanvas.add(tableGroup);
    fabricCanvas.renderAll();
};
 
const exportToPDF = async()=>{
    if (!fabricInstanceRef.current) return;

    const fabricCanvas = fabricInstanceRef.current;
     // Should start with "%PDF"
    const savedPDFbytes = base64ToUint8Array(pdfBytes)
    // console.log('pdf bytes',savedPDFbytes);
    const pdfDoc = await PDFLib.PDFDocument.load(savedPDFbytes);
    const numPages = pdfDoc.getPageCount();
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const angleRadians = (60 * Math.PI) / 180;
 console.log('the pdf is priting single table', 0, tableInfo, tableGroup);
    // if (Object.keys(tableGroup).length == 1) {
        

           
            console.log('page number', 0, 'numPages', numPages, 'tableGroup', Object.keys(tableGroup));
         
                const cellWidth = tableInfo.cellWidth * Number(tableGroup.scaleX);
                const cellHeight = tableInfo.cellHeight * Number(tableGroup.scaleY);
                const rows = tableInfo.rows;
                const columns = tableInfo.columns;
                let x = tableGroup.left;
                let y = height - (tableGroup.top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
                // console.log('tableGroup',i, tableGroup[i])

                let xx = 0;

                // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup.angle )
                console.log('adding rectangles')
                page.drawRectangle({
                    x: x,
                    y: y + tableInfo.rows * cellHeight,
                    width: cellWidth * 6,
                    height: cellHeight,
                    borderColor: PDFLib.rgb(0, 0, 0),
                    borderWidth: 1
                    // rotate: PDFLib.degrees(-tableGroup.angle),
                });
                // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup.scaleY))),intersect.x,intersect.y, -tableGroup.angle )
                console.log('adding texts')
                page.drawText("NEW SIGN TABLE", {
                    x: x + 2 * cellWidth,
                    y: y + tableInfo.rows * cellHeight + cellHeight - 24 * Number(tableGroup.scaleY),
                    size: 20 * Number(tableGroup.scaleX),
                    color: PDFLib.rgb(0, 0, 0)
                    // rotate: PDFLib.degrees(-tableGroup.angle),
                });

                // x  = x + 5 * cellHeight;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < columns; col++) {
                        // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup.angle )
                        page.drawRectangle({
                            x: x + col * (col === 0 ? cellWidth : cellWidth * 2),
                            y: y + row * cellHeight,
                            width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                            height: cellHeight,
                            borderColor: PDFLib.rgb(0, 0, 0),
                            borderWidth: 1
                            // rotate: PDFLib.degrees(-tableGroup.angle),
                        });
                        // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup.scaleY)))),intersect.x,intersect.y, -tableGroup.angle )
                        page.drawText(tableData[xx], {
                            x: x + col * cellWidth + 8,
                            y: y + row * cellHeight + cellHeight - 24 * Number(tableGroup.scaleY), // Adjust text position
                            size: 14 * Math.max(Number(tableGroup.scaleX), Number(tableGroup.scaleY)),
                            color: PDFLib.rgb(0, 0, 0)
                        });
                        xx++;
                    }
                
            }

            // Convert fabric canvas to high-resolution image
            const fabricDataUrl = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1 // Max quality
            });
            const pngImage = await pdfDoc.embedPng(fabricDataUrl);
        
    // }

    const pdfBytesEdited = await pdfDoc.save();
      const pdfUrl = URL.createObjectURL(new Blob([pdfBytesEdited], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'edited.pdf';
    link.click();
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
        onClick={addTable}
        variant="contained"
            >
        Add Table
      </Button>
      <Button
          onClick={deleteSelectedObject}
          variant="contained"
        >
          Delete Selected
        </Button>
         <Button
         onClick={exportToPDF}
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
