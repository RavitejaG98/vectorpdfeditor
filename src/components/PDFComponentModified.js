import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
pdfjs.GlobalWorkerOptions.workerSrc = `cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const App = () => {
    const [pdfDocument, setPdfDocument] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfUrl, setPdfUrl] = useState('https://pdfobject.com/pdf/sample.pdf');
    const [highlightedAreas, setHighlightedAreas] = useState(false);
    const canvasRef = useRef(null);
    const loadPdfFromUrl = async (bloburl) => {
        try {
            let pdf
            if (bloburl !== null) {
                const arrayBuffer = bloburl.buffer;
                pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            } else {
                const loadingTask = pdfjs.getDocument(pdfUrl);
                pdf = await loadingTask.promise;
            }
            setPdfDocument(pdf);
            setHighlightedAreas(!highlightedAreas)
    
        } catch (error) {
            console.error('Error loading PDF from URL:', error);
        }
    };
    const renderPdf = () => {
        if (pdfDocument) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            pdfDocument.getPage(currentPage).then((page) => {
                const viewport = page.getViewport({ scale: 1.0 });
                let centerX, centerY;
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                context.clearRect(0, 0, canvas.width, canvas.height); 
                page.render(renderContext);
            });
        }
    };
    useEffect(() => {
        renderPdf();
    }, [highlightedAreas]);
 
    useEffect(() => {
        loadPdfFromUrl(null)
    }, [])
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '80vw',
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        flexGrow: 1,
    };

    const gridItemStyle = {
        border: '1px solid #ccc',
        padding: '20px',
        boxSizing: 'border-box',
    };
    return (

        <div style={containerStyle}>
            <div style={gridContainerStyle}>
                <div style={gridItemStyle}>
                    <div className="min-w-96"> <div>
                        <button onClick={loadPdfFromUrl} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">
                            Load PDF
                        </button >
                    </div>
                        <canvas
                            id="pdfViewer"
                            ref={canvasRef}
                            style={{ backgroundColor: 'lightred' }}

                        />
                    </div>
                </div>


            </div>

        </div>


    );
};

export default App;