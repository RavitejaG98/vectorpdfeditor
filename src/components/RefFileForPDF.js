let pdfDoc = null;
let pdfBytes = null;
let fabricCanvas = new fabric.Canvas("fabric-canvas");
let drawCanvas = new fabric.Canvas("draw-canvas");
let originalWidth, originalHeight;
let currentPage = 1;
let numPages = 0;
let pageAnnotations = {};
let tableInfo = null;
let tableGroup = {};

let multipleTables = {
  // 'div block' : ['aman', 'aman signed on 12-6-24', 'divya', 'divya sgined on 11-6-24'],
  // 'hq block' : ['vikram', 'vikram signed on 13-7-24', 'amit', 'amit signed on 14-6-24'],
  // 'railway block' : ['hiroshi', '', 'yamaguchi', '']
};
const DrawingId_ = JSON.parse(localStorage.getItem("pdfFullInfo")).drawingId;
let currentTable = JSON.parse(
  localStorage.getItem("pdfFullInfo")
).signatureBlock;
let options = Object.keys(multipleTables).map((item) => ({
  value: item,
  text: item,
}));
let currentBlock = "";
let tableLength = 0;
let selectedColor = "#ff0000";
const transformData = (data) => {
  return data.flatMap((character) => [character, ""]);
};

let cells = transformData(
  JSON.parse(localStorage.getItem("members"))
).reverse();

let cellss = cells.reverse();
multipleTables = {
  [JSON.parse(localStorage.getItem("pdfFullInfo")).memberData.Alteration > 0
    ? "Alter " +
      JSON.parse(localStorage.getItem("pdfFullInfo")).memberData.Alteration +
      " " +
      JSON.parse(localStorage.getItem("pdfFullInfo")).signatureBlock
    : JSON.parse(localStorage.getItem("pdfFullInfo")).signatureBlock]: cellss,
};
currentTable = Object.keys(multipleTables)[0];
console.log(
  "current table after multiple tables",
  currentTable,
  multipleTables
);

function hexToRgb(hex) {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, "");

  // Parse the hex string
  const bigint = parseInt(hex, 16);

  // Extract the red, green, and blue values
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}
fabricCanvas.on("object:modified", function (e) {
  const obj = e.target;
  if (obj) {
    obj.set("angle", 0); // Reset the angle to 0
    obj.set("lockRotation", true); // Ensure rotation remains locked
  }
});

fabricCanvas.on("path:created", function () {
  fabricCanvas.renderAll();
});
document.addEventListener("DOMContentLoaded", function () {
  var thisPageLink = document.getElementById("thisPage");
  if (!thisPageLink.textContent.trim()) {
    thisPageLink.textContent = "/";
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const link = document.getElementById("thisPage");
  let isEditing = false;

  link.addEventListener("click", function (event) {
    event.preventDefault();

    if (!isEditing) {
      // Convert the link to an input field
      const input = document.createElement("input");
      input.type = "number";
      input.value = link.textContent.trim();
      input.style.cssText = getComputedStyle(link).cssText; // Copy existing styles
      input.classList.add("editable-input");
      input.addEventListener("blur", function () {
        // On blur (when the input loses focus)
        const newPage = input.value.trim();
        link.textContent = newPage || "/";
        link.style.cssText = getComputedStyle(input).cssText; // Restore link styles
        link.classList.remove("editable-input");
        link.href = "#"; // Reset the href attribute if needed

        // Call loadPage function with the new value
        const currentPage = parseInt(link.textContent.trim(), 10);
        loadPage(currentPage);

        // Replace input with link
        input.parentNode.replaceChild(link, input);
        isEditing = false;
      });
      link.parentNode.replaceChild(input, link);
      input.focus();
      isEditing = true;
    }
  });
});

// document.getElementById('upload').addEventListener('change', (event) => {
//     const file = event.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function() {
//             const typedarray = new Uint8Array(this.result);
//             pdfBytes = typedarray;
//             pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
//                 pdfDoc = pdf;
//                 numPages = pdf.numPages;
//                 loadPage(currentPage);
//             });
//         };
//         reader.readAsArrayBuffer(file);
//     }
// });

// document.getElementById('load-pdf').addEventListener('click', () => {
//     fetch(`http://10.244.3.132:5000/pdf/${localStorage.getItem('currentFile')}`)
//         .then(response => response.arrayBuffer())
//         .then(arrayBuffer => {
//             const typedarray = new Uint8Array(arrayBuffer);
//             pdfBytes = typedarray;
//             pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
//                 pdfDoc = pdf;
//                 numPages = pdf.numPages;
//                 loadPage(currentPage);
//             });
//         })
//         .catch(error => {
//             console.error('Error fetching PDF:', error);
//         });
// });
async function fetchSignatures() {
  try {
    const response = await fetch(
      `${apiURL}/awf/api/sign/signature-history/${DrawingId_}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      console.log(
        "error fetching signatures from response top level",
        response
      );
      showErrorToast();
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log("data from signature", data);
    ////////////////===============Shashikant Code==============/////////////////
    // Function to convert date to Indian format (dd-mm-yyyy hh:mm AM/PM)
    const formatDateToIST = (utcDateString) => {
      const date = new Date(utcDateString);

      // Convert to IST using toLocaleString with explicit timezone
      return date
        .toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata", // Ensures proper IST conversion
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true, // Ensures AM/PM format
        })
        .replace(",", ""); // Remove extra comma
    };

    // const mappedObject = data.History.reduce((obj, item) => {
    //     obj[item.SignTitle] = item.MemberDetails.flatMap((sitem) => ['Signed by ' + sitem.MemberName+'\n' + 'Member Name', 'At ' + sitem.SignedAt]); // Use memberId as key and time as the value
    //     return obj;
    // }, {});
    //////////////////====================shashikant code==================/////////////////////
    const mappedObject = data.History.reduce((obj, item) => {
      obj[item.SignTitle] = item.MemberDetails.flatMap((sitem) => [
        "Signed by " + sitem.MemberName + "\n" + "Member name",
        "At " + formatDateToIST(sitem.SignedAt), // Correct IST format
      ]);
      return obj;
    }, {});
    console.log(
      "mapped data of fethced signs",
      mappedObject,
      "multi table",
      multipleTables,
      "merged tabel",
      { ...multipleTables, ...mappedObject }
    );
    multipleTables = { ...multipleTables, ...mappedObject };
    options = Object.keys({ ...multipleTables, ...mappedObject }).map(
      (item) => ({
        value: item,
        text: item,
      })
    );
    console.log("multipltables final", multipleTables);
    console.log("multipltables options", options);
    if (options.length > 1) {
      options.forEach((option) => {
        console.log("option::in append::", option);
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        dropdown.appendChild(opt);
      });
    }
  } catch (error) {
    console.log("error in fethcing signatures", error);
    showErrorToast();
  }
}

// fetchSignatures();
if (options.length > 1) {
  options = Object.keys(multipleTables).map((item) => ({
    value: item,
    text: item,
  }));
}

let zoomLevel = 1;
let pdfId = null;
let apiURL = "";
let nc_api = "";
let angleToRotate = 0;
async function getPDF(id) {
  let fileResponse;
  // let url = `${apiURL}/nc/api/file/download/ApproveDocs/${id}`;
  // let url = `${apiURL}/ncnew/api/file/download/ApproveDocs/${id}`;
  const pdfFullInfo = JSON.parse(localStorage.getItem("pdfFullInfo"));
  console.log("pdfFullInfo::pdfFullInfo::", pdfFullInfo);
  let url = "";
  if (pdfFullInfo.memberData.HQRecheckin === false) {
    url = `${nc_api}/api/file/download/ApproveDocs/${id}`;
  } else {
    url = `${nc_api}/api/file/download/DrawingPDFFile/${id}`;
  }

  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  console.log("pdf url is ", url);
  try {
    //   const fileResponse = await fetch(url, {
    //     method: "GET",
    //     credentials: 'include'
    //   });

    //   // Ensure the response is ok before processing
    //   if (!fileResponse.ok) {
    //     throw new Error('Failed to fetch PDF file');
    //   }

    //   const arrayBuffer = await fileResponse.arrayBuffer();
    //   const typedArray = new Uint8Array(arrayBuffer);

    //   // Load the PDF using pdfjs
    //   const pdfDoc = await pdfjsLib.getDocument(typedArray).promise;

    //   const numPages = pdfDoc.numPages;
    //   loadPage(pdfDoc, currentPage, numPages);

    const fileResponse = await fetch(url, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        const typedarray = new Uint8Array(arrayBuffer);
        pdfBytes = typedarray;
        pdfjsLib.getDocument(typedarray).promise.then(async (pdf) => {
          pdfDoc = pdf;
          numPages = pdf.numPages;

          // Get the first page to determine rotation
          const page = await pdf.getPage(1);
          const rotation = page.rotate; // Rotation (0, 90, 180, 270)
          angleToRotate = page.rotate;
          console.log(`PDF Rotation: ${rotation}°`);

          // Pass rotation to loadPage function
          loadPage(currentPage);
        });

        loader.classList.add("hidden");
      })
      .catch((error) => {
        console.error("Error fetching PDF:", error);
      });
  } catch (error) {
    console.error("Error fetching or rendering PDF:", error);
  }
}
function loadPdf() {
  const base64data = sessionStorage.getItem("uploadedFileBase64");
  const pdfFullInfo = JSON.parse(localStorage.getItem("pdfFullInfo"));

  try {
    // fetch(`${apiURL}/nc/api/nc/naming-conventions/latest/${JSON.parse(localStorage.getItem('pdfFullInfo')).drawingId}`, {
    fetch(
      `${nc_api}/api/nc/naming-conventions/latest/${
        JSON.parse(localStorage.getItem("pdfFullInfo")).drawingId
      }`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Parse the response as JSON
      })
      .then((data) => {
        console.log("Data:", data);
        // pdfId = data.LatestApprovalDos.documentId;
        if (pdfFullInfo.memberData.HQRecheckin === false) {
          pdfId = data.LatestApprovalDos.documentId;
        } else {
          pdfId = data.LatestDrawingPDFFile.documentId;
        }
        console.log("pdf id", pdfId);
        getPDF(pdfId);
      });

    try {
      const blob = new Blob([fileResponse.data], { type: "application/pdf" });
    } catch (error) {
      console.log("error while blob", error);
    }
  } catch (error) {
    console.log("error while loading ", error);
  }

  // fetch(`http://10.244.3.132:5000/pdf/${localStorage.getItem('currentFile')}`)
  //     .then(response => response.arrayBuffer())
  //     .then(arrayBuffer => {
  //         const typedarray = new Uint8Array(arrayBuffer);
  //         pdfBytes = typedarray;
  //         pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
  //             pdfDoc = pdf;
  //             numPages = pdf.numPages;
  //             loadPage(currentPage);
  //         });
  //     })
  //     .catch(error => {
  //         console.error('Error fetching PDF:', error);
  //     });
  // if (base64data) {
  //     // Convert the Base64 string back into a Blob
  //     const byteCharacters = atob(base64data.split(',')[1]);  // Strip out the base64 metadata
  //     const byteNumbers = new Array(byteCharacters.length);
  //     for (let i = 0; i < byteCharacters.length; i++) {
  //         byteNumbers[i] = byteCharacters.charCodeAt(i);
  //     }
  //     const byteArray = new Uint8Array(byteNumbers);

  //     const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

  //     // Convert the Blob to ArrayBuffer for pdfjsLib
  //     const reader = new FileReader();
  //     reader.onload = function (event) {
  //         const arrayBuffer = event.target.result;

  //         // Create a typed array from the ArrayBuffer
  //         const typedarray = new Uint8Array(arrayBuffer);
  //         pdfBytes = typedarray;

  //         // Now process the PDF with pdfjsLib
  //         pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
  //             pdfDoc = pdf;
  //             numPages = pdf.numPages;
  //             loadPage(currentPage);  // Load the initial page of the PDF
  //         }).catch(error => {
  //             console.error('Error processing PDF from Base64 string:', error);
  //         });
  //     };

  //     reader.readAsArrayBuffer(pdfBlob);
  // } else {
  //     console.error('No Base64 string found in sessionStorage.');
  // }
}
async function getIP() {
  try {
    const response = await fetch("/config.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const config = await response.json();
    apiURL = config.API_IP;
    nc_api = config.API_NC;
    loadPdf();
    fetchSignatures();
  } catch (error) {
    console.error("Error fetching config.json:", error.message);
  }
}
getIP();

// Get references to the dropdown and output elements
const dropdown = document.getElementById("dropdown");

// Dynamically populate the dropdown

// Add an event listener to handle changes in the dropdown
dropdown.addEventListener("change", function () {
  const selectedValue = dropdown.value; // Get the selected value
  console.log("selected value", selectedValue);
  currentTable = selectedValue;
});
function tableUpdatedPDf(base64Data) {
  const base64data = base64Data;

  if (base64data) {
    // Convert the Base64 string back into a Blob
    const byteCharacters = atob(base64data.split(",")[1]); // Strip out the base64 metadata
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const pdfBlob = new Blob([byteArray], { type: "application/pdf" });

    // Convert the Blob to ArrayBuffer for pdfjsLib
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;

      // Create a typed array from the ArrayBuffer
      const typedarray = new Uint8Array(arrayBuffer);
      pdfBytes = typedarray;

      // Now process the PDF with pdfjsLib
      pdfjsLib
        .getDocument(typedarray)
        .promise.then((pdf) => {
          pdfDoc = pdf;
          numPages = pdf.numPages;
          loadPage(currentPage); // Load the initial page of the PDF
        })
        .catch((error) => {
          console.error("Error processing PDF from Base64 string:", error);
        });
    };

    reader.readAsArrayBuffer(pdfBlob);
  } else {
    console.error("No Base64 string found in sessionStorage.");
  }
  console.log("getAllObject from tableUpdatedPDF", fabricCanvas.getObjects());
}
function loadPage(num) {
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: zoomLevel });
    const canvas = document.getElementById("pdf-canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    originalWidth = viewport.width;
    originalHeight = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    console.log("PDF Width:", viewport.width, "PDF Height:", viewport.height);
    page.render(renderContext).promise.then(() => {
      fabricCanvas.setWidth(viewport.width);
      fabricCanvas.setHeight(viewport.height);
      fabricCanvas.clear();

      if (pageAnnotations[num]) {
        fabricCanvas.loadFromJSON(pageAnnotations[num]);
      }
    });
  });
}

fabricCanvas.on("object:scaling", function (e) {
  const obj = e.target;
  if (obj && obj.type === "circle") {
    // Calculate the average scale factor
    const scale = Math.max(obj.scaleX, obj.scaleY);
    obj.set({
      scaleX: scale,
      scaleY: scale,
    });
    obj.setCoords();
  }
});

fabricCanvas.on("object:scaling", function (e) {
  const obj = e.target;
  if (obj && obj.type === "circle") {
    const controls = ["tl", "tr", "br", "bl"];
    for (const key in obj.controls) {
      if (!controls.includes(key)) {
        obj.controls[key].visibility = false; // Hide non-corner controls
      }
    }
    obj.setCoords();
  }
});

function updateColor(event) {
  selectedColor = event.target.value;
  document.body.style.backgroundColor = selectedColor;
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Delete" || e.key === "Backspace") {
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);

      console.log(
        "table Group while deleteing",
        JSON.stringify(tableGroup[currentPage]) ===
          JSON.stringify(activeObject),
        "activeObject::",
        activeObject,
        "allObjects::",
        fabricCanvas.getObjects()
      );
      if (
        JSON.stringify(tableGroup[currentPage]) === JSON.stringify(activeObject)
      ) {
        delete tableGroup[currentPage];
      } else {
        // fabricCanvas.clear()
      }
    }
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const colorPicker = document.getElementById("colorPicker");
  colorPicker.addEventListener("input", updateColor);
  fabricCanvas.freeDrawingBrush.color = selectedColor;
  document.body.style.backgroundColor = selectedColor;
});
function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.add("hide");
    toast.classList.remove("show");

    setTimeout(() => {
      toast.classList.remove("hide");
    }, 500);
  }, 3000);
}
function showErrorToast() {
  const toast = document.getElementById("errortoast");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.add("hide");
    toast.classList.remove("show");

    setTimeout(() => {
      toast.classList.remove("hide");
    }, 500);
  }, 3000);
}
document.getElementById("prevPageBtn").addEventListener("click", () => {
  if (currentPage > 1) {
    saveAnnotation();
    currentPage--;
    loadPage(currentPage);
  }
  document.getElementById("thisPage").innerHTML = currentPage;
});

document.getElementById("nextPageBtn").addEventListener("click", () => {
  if (currentPage < numPages) {
    saveAnnotation();
    currentPage++;
    loadPage(currentPage);
  }
  document.getElementById("thisPage").innerHTML = currentPage;
});

document.getElementById("addTextBtn").addEventListener("click", () => {
  const userInput = document.getElementById("userInput").value;

  const text = new fabric.Text(userInput, {
    left: 100,
    top: 100,
    fill: "blue",
    fontSize: 24,
    selectable: true,
  });
  fabricCanvas.add(text);
  saveAnnotation();
});
function findLongestInArray(arr) {
  return arr.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    ""
  );
}
document.getElementById("addTableBtn").addEventListener("click", () => {
  console.log(
    "members in HQ table button",
    JSON.parse(localStorage.getItem("members"))
  );
  let members = JSON.parse(localStorage.getItem("members"));
  const flatArray = transformData(members);
  tableLength = multipleTables[currentTable].length / 2;
  if (tableLength == 0) return;
  console.log(flatArray);
  let maxString = findLongestInArray(multipleTables[currentTable]);
  const currentDate = new Date();
  let xx = 0;
  tableInfo = {
    x: 500,
    y: 200,
    rows: tableLength,
    columns: 2,
    cellWidth: 100 * (maxString.length / 24),
    cellHeight: 50,
  };
  const temp = new fabric.Group([], {
    left: tableInfo.x,
    top: tableInfo.y,
    id: currentDate.toISOString() + "myTable",
  });
  tableGroup[currentPage] = temp;

  const signRect = new fabric.Rect({
    left: tableInfo.cellWidth - 100 * (maxString.length / 24),
    top: tableInfo.cellHeight - 100 + tableInfo.y,
    fill: "white",
    stroke: "black",
    width: tableInfo.cellWidth * 6,
    height: tableInfo.cellHeight,
    lockRotation: true,
    rotatable: false,
  });

  const signCellText = new fabric.Text(currentTable, {
    left: tableInfo.cellWidth + 40,
    top: tableInfo.cellHeight + 10 - 100 + tableInfo.y,
    fontSize: 24,
    fill: "black",
    originX: "left",
    originY: "top",
    lockRotation: true,
    rotatable: false,
  });

  tableGroup[currentPage].addWithUpdate(signRect);
  tableGroup[currentPage].addWithUpdate(signCellText);
  for (let i = 0; i < tableInfo.rows; i++) {
    for (let j = 0; j < tableInfo.columns; j++) {
      console.log("x,y", i, j);

      const rect = new fabric.Rect({
        left: j === 0 ? j * tableInfo.cellWidth : j * tableInfo.cellWidth * 2,
        top: i * tableInfo.cellHeight + tableInfo.y,
        fill: "white",
        stroke: "black",
        width: j === 0 ? tableInfo.cellWidth * 2 : tableInfo.cellWidth * 4,
        height: tableInfo.cellHeight,
        lockRotation: true,
        rotatable: false,
      });

      const cellText = new fabric.Text(multipleTables[currentTable][xx], {
        left:
          j === 0
            ? j * tableInfo.cellWidth + 10
            : j * 2 * tableInfo.cellWidth + 10,
        top: i * tableInfo.cellHeight + 10 + tableInfo.y,
        fontSize: 14,
        fill: "black",
        originX: "left",
        originY: "top",
        lockRotation: true,
        rotatable: false,
      });
      tableGroup[currentPage].addWithUpdate(rect);
      tableGroup[currentPage].addWithUpdate(cellText);
      xx++;
    }
  }

  fabricCanvas.add(tableGroup[currentPage]);
  console.log("table being added", tableGroup);
  saveAnnotation();
});

function saveAnnotation() {
  pageAnnotations[currentPage] = JSON.stringify(fabricCanvas);
}

function extractPathsAsSvg(fabricCanvas) {
  return fabricCanvas.getObjects("path").map((path) => {
    return { svg: path.toSVG(), path: path };
  });
}

document
  .getElementById("downloadPDFBtn")
  .addEventListener("click", async () => {
    const canvas = document.getElementById("pdf-canvas");
    textElements = fabricCanvas
      .getObjects()
      .filter((obj) => obj.type === "text");
    const pathElements = fabricCanvas
      .getObjects()
      .filter((obj) => obj.type === "path");
    console.log("path Elements", pathElements);
    if (pathElements.length === 0) {
      console.log("No text elements found.");
    } else {
      // Create SVG content from text elements
      const svgContent = pathElements
        .map((text) => {
          return `<text x="${text.left}" y="${text.top}" fill="${text.fill}" font-size="${text.fontSize}">${text.text}</text>`;
        })
        .join("\n");

      // Construct SVG string
      const svgString = `
            <svg width="${fabricCanvas.width}" height="${fabricCanvas.height}" xmlns="http://www.w3.org/2000/svg">
              ${svgContent}
            </svg>
        `;

      // // Optionally, display or use the SVG string
      // console.log(svgString);
      // console.log('SVG content has been generated and logged to the console.', textElements);
    }

    if (textElements.length === 0) {
      console.log("No text elements found.");
    } else {
      // Create SVG content from text elements
      const svgContent = textElements
        .map((text) => {
          return `<text x="${text.left}" y="${text.top}" fill="${text.fill}" font-size="${text.fontSize}">${text.text}</text>`;
        })
        .join("\n");

      // Construct SVG string
      const svgString = `
            <svg width="${fabricCanvas.width}" height="${fabricCanvas.height}" xmlns="http://www.w3.org/2000/svg">
              ${svgContent}
            </svg>
        `;

      // // Optionally, display or use the SVG string
      // console.log(svgString);
      // console.log('SVG content has been generated and logged to the console.', textElements);
    }

    console.log("downloading pdf");
    if (!pdfBytes) return;

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const numPages = pdfDoc.getPageCount();
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const angleRadians = (60 * Math.PI) / 180;
    textElements.map((textElement) => {
      // console.log('textElement', textElement.text, textElement.scaleX, textElement.scaleY)
      console.log("textElement", textElement);
      console.log("selected COlor", hexToRgb(textElement.fill));
      const textColor = hexToRgb(textElement.fill);
      page.drawText(textElement.text, {
        x: textElement.left, // X-coordinate for the text
        y: height - (textElement.top + 20 * textElement.scaleY), // Y-coordinate for the text
        size: 20 * Math.ceil(Number(textElement.scaleX)),
        borderWidth: 2, // Outline width
        rotate: PDFLib.degrees(-textElement.angle),
        color: PDFLib.rgb(
          textColor.r / 255,
          textColor.g / 255,
          textColor.b / 255
        ),
      });
    });
    // function rotatePoint(x, y, angleDegrees) {
    //     // Convert degrees to radians
    //     let angleRadians = angleDegrees * (Math.PI / 180);

    //     // Apply the rotation matrix
    //     let xNew = x * Math.cos(angleRadians) - y * Math.sin(angleRadians);
    //     let yNew = x * Math.sin(angleRadians) + y * Math.cos(angleRadians);

    //     return { x: xNew, y: yNew };
    // }
    // function rotatePointAroundPoint(px, py, cx, cy, angleDegrees) {
    //     // Convert degrees to radians
    //     let angleRadians = angleDegrees * (Math.PI / 180);

    //     // Translate point to origin
    //     let translatedX = px - cx;
    //     let translatedY = py - cy;

    //     // Apply the rotation matrix
    //     let xNew = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
    //     let yNew = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);

    //     // Translate back to the original center point
    //     xNew += cx;
    //     yNew += cy;

    //     return { x: xNew, y: yNew };
    // }
    // function getLineIntersection(p1, p2, p3, p4) {
    //     const x1 = p1.x, y1 = p1.y;
    //     const x2 = p2.x, y2 = p2.y;
    //     const x3 = p3.x, y3 = p3.y;
    //     const x4 = p4.x, y4 = p4.y;

    //     // Calculate the denominators
    //     const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    //     // If denom is zero, lines are parallel or coincident
    //     if (denom === 0) {
    //         return null; // No intersection
    //     }

    //     // Calculate the intersection point
    //     const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    //     const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    //     // Check if the intersection point is within the line segments
    //     if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    //         return null; // Intersection is outside the line segments
    //     }

    //     // Calculate the intersection coordinates
    //     const intersectionX = x1 + ua * (x2 - x1);
    //     const intersectionY = y1 + ua * (y2 - y1);

    //     return { x: intersectionX, y: intersectionY };
    // }
    // function rotatePointAroundPoint(px, py, cx, cy, angleDegrees) {
    //     // Convert degrees to radians
    //     let angleRadians = angleDegrees * (Math.PI / 180);

    //     // Translate point to origin
    //     let translatedX = px - cx;
    //     let translatedY = py - cy;

    //     // Apply the rotation matrix
    //     let xNew = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
    //     let yNew = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);

    //     // After rotation, translate back to the center
    //     let finalX = xNew + cx;
    //     let finalY = yNew + cy;

    //     return { x: finalX, y: finalY };
    // }
    // function calculateAngle(x1, y1, x2, y2) {
    //     // Calculate the angle in radians
    //     let angleRadians = Math.atan2(y2 - y1, x2 - x1);

    //     // Convert radians to degrees (optional)
    //     let angleDegrees = angleRadians * (180 / Math.PI);

    //     // Ensure the angle is positive (between 0 and 360 degrees)
    //     if (angleDegrees < 0) {
    //         angleDegrees += 360;
    //     }

    //     return angleDegrees;  // You can return angleRadians if you prefer radians
    // }
    console.log("page number", "numPages", numPages, "tableGroup", tableGroup);
    console.log();
    // if (Object.keys(tableGroup).length == 1) {
    //     for (let i = 0; i < numPages; i++) {
    //         const page = pdfDoc.getPages()[0];
    //         const { width, height } = page.getSize();

    //         console.log('the pdf is priting single table', currentPage, tableInfo, tableGroup);
    //         console.log('page number', i, 'numPages', numPages, 'tableGroup', Object.keys(tableGroup));
    //         if (tableInfo && tableGroup[1] != null) {
    //             const cellWidth = tableInfo.cellWidth * Number(tableGroup[1].scaleX);
    //             const cellHeight = tableInfo.cellHeight * Number(tableGroup[1].scaleY);
    //             const rows = tableInfo.rows;
    //             const columns = tableInfo.columns;
    //             let x = tableGroup[1].left;
    //             let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
    //             // console.log('tableGroup',i, tableGroup[i])

    //             let xx = 0;

    //             // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
    //             page.drawRectangle({
    //                 x: x,
    //                 y: y + tableInfo.rows * cellHeight,
    //                 width: cellWidth * 6,
    //                 height: cellHeight,
    //                 borderColor: PDFLib.rgb(0, 0, 0),
    //                 borderWidth: 1
    //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //             });
    //             // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
    //             page.drawText(currentTable, {
    //                 x: x + 2 * cellWidth,
    //                 y: y + tableInfo.rows * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
    //                 size: 20 * Number(tableGroup[1].scaleX),
    //                 color: PDFLib.rgb(0, 0, 0)
    //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //             });

    //             // x  = x + 5 * cellHeight;
    //             for (let row = 0; row < rows; row++) {
    //                 for (let col = 0; col < columns; col++) {
    //                     // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
    //                     page.drawRectangle({
    //                         x: x + col * (col === 0 ? cellWidth : cellWidth * 2),
    //                         y: y + row * cellHeight,
    //                         width: col === 0 ? cellWidth * 2 : cellWidth * 4,
    //                         height: cellHeight,
    //                         borderColor: PDFLib.rgb(0, 0, 0),
    //                         borderWidth: 1
    //                         // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //                     });
    //                     // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
    //                     page.drawText(cells[xx], {
    //                         //(col === 0 ? cellWidth * 2 : cellWidth * 4)
    //                         x: x + col * (col === 0 ? cellWidth + 50 : cellWidth * 2) + 10,
    //                         y: y + row * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
    //                         size: 14 * Number(tableGroup[1].scaleX),
    //                         color: PDFLib.rgb(0, 0, 0)
    //                         // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //                     });
    //                     xx++;
    //                 }
    //             }
    //         }

    //         // Convert fabric canvas to high-resolution image
    //         const fabricDataUrl = fabricCanvas.toDataURL({
    //             format: 'png',
    //             quality: 1 // Max quality
    //         });
    //         const pngImage = await pdfDoc.embedPng(fabricDataUrl);
    //     }
    // } else {
    //     console.log('we are in multi table');
    //     for (let i = 1; i < numPages; i++) {
    //         const page = pdfDoc.getPages()[i - 1];
    //         const { width, height } = page.getSize();

    //         console.log('the pdf is priting', currentPage, tableInfo);
    //         console.log('page number', i, 'numPages', numPages, 'tableGroup', Object.keys(tableGroup));
    //         if (tableInfo && tableGroup[i] != null) {
    //             const cellWidth = tableInfo.cellWidth * Number(tableGroup[i].scaleX);
    //             const cellHeight = tableInfo.cellHeight * Number(tableGroup[i].scaleY);
    //             const rows = tableInfo.rows;
    //             const columns = tableInfo.columns;
    //             const x = tableGroup[i].left;
    //             let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
    //             // console.log('tableGroup',i, tableGroup[i])
    //             let xx = 0;
    //             page.drawRectangle({
    //                 x: x,
    //                 y: y + tableInfo.rows * cellHeight,
    //                 width: cellWidth * 6,
    //                 height: cellHeight,
    //                 borderColor: PDFLib.rgb(0, 0, 0),
    //                 borderWidth: 1
    //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //             });
    //             // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
    //             page.drawText(currentTable, {
    //                 x: x + cellWidth + 10,
    //                 y: y + tableInfo.rows * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
    //                 size: 20 * Math.max(Number(tableGroup[1].scaleX), Number(tableGroup[1].scaleY)),
    //                 color: PDFLib.rgb(0, 0, 0)
    //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
    //             });

    //             for (let row = 0; row < rows; row++) {
    //                 for (let col = 0; col < columns; col++) {
    //                     page.drawRectangle({
    //                         //(col === 0 ? col * cellWidth : col * cellWidth)
    //                         x: x + col * cellWidth,
    //                         y: y + row * cellHeight,
    //                         width: col === 0 ? cellWidth * 2 : cellWidth * 4,
    //                         height: cellHeight,
    //                         borderColor: PDFLib.rgb(0, 0, 0),
    //                         borderWidth: 1
    //                     });

    //                     page.drawText(multipleTables[currentTable][xx], {
    //                         x: x + col * cellWidth + 10,
    //                         y: y + row * cellHeight + cellHeight - 24 * Number(tableGroup[i].scaleY), // Adjust text position
    //                         size: 14 * Math.max(Number(tableGroup[1].scaleX), Number(tableGroup[1].scaleY)),
    //                         color: PDFLib.rgb(0, 0, 0)
    //                     });
    //                     xx++;
    //                 }
    //             }
    //         }

    //         // Convert fabric canvas to high-resolution image
    //         const fabricDataUrl = fabricCanvas.toDataURL({
    //             format: 'png',
    //             quality: 1 // Max quality
    //         });
    //         const pngImage = await pdfDoc.embedPng(fabricDataUrl);
    //     }
    // }
    if (angleToRotate > 0) {
      console.log("rendering oriented tables");
      if (Object.keys(tableGroup).length == 1) {
        for (let i = 0; i < numPages; i++) {
          const page = pdfDoc.getPages()[0];
          const { width, height } = page.getSize();

          console.log(
            "the pdf is priting single table",
            currentPage,
            tableInfo,
            tableGroup
          );
          console.log(
            "page number",
            i,
            "numPages",
            numPages,
            "tableGroup",
            Object.keys(tableGroup)
          );
          if (tableInfo && tableGroup[1] != null) {
            const cellWidth =
              tableInfo.cellWidth * Number(tableGroup[1].scaleX);
            const cellHeight =
              tableInfo.cellHeight * Number(tableGroup[1].scaleY);
            const rows = tableInfo.rows;
            const columns = tableInfo.columns;
            // let x = tableGroup[1].left;
            // let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
            // console.log('tableGroup',i, tableGroup[i])
            let x =
              width -
              (tableGroup[1].top + tableInfo.rows * cellHeight) -
              cellHeight;
            let y = height - tableGroup[1].left; // Adjust y-coordinate for PDF coordinate system

            console.log(
              "old co-ordinates",
              x,
              y,
              "size",
              width,
              height,
              "orientation angle",
              angleToRotate
            );
            const tempC = { x, y };
            // x = tempC.y,
            // y = tempC.x
            // x = headingCoord.x
            // y = headingCoord.y

            let xx = 0;

            // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawRectangle({
              x: x + tableInfo.rows * cellHeight,
              y: y,
              width: cellWidth * 6,
              height: cellHeight,
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
              rotate: PDFLib.degrees(angleToRotate),
            });
            // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawText(currentTable, {
              x:
                x +
                tableInfo.rows * cellHeight +
                24 * Number(tableGroup[1].scaleY),
              y: y - 2 * cellWidth + 24 * Number(tableGroup[1].scaleX),
              size: 20 * Number(tableGroup[1].scaleX),
              color: PDFLib.rgb(0, 0, 0),
              rotate: PDFLib.degrees(angleToRotate),
            });

            // x  = x + 5 * cellHeight;
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < columns; col++) {
                // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
                page.drawRectangle({
                  x: x + row * cellHeight,
                  y: col == 0 ? y : y - 2 * cellWidth,
                  width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                  height: cellHeight,
                  borderColor: PDFLib.rgb(0, 0, 0),
                  borderWidth: 1,
                  rotate: PDFLib.degrees(angleToRotate),
                });
                // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
                page.drawText(multipleTables[currentTable][xx], {
                  //(col === 0 ? cellWidth * 2 : cellWidth * 4)
                  x: x + row * cellHeight + 8,
                  y:
                    y - col * (col === 0 ? cellWidth + 50 : cellWidth * 2) - 14,
                  size: 14 * Number(tableGroup[1].scaleX),
                  color: PDFLib.rgb(0, 0, 0),
                  // rotate: PDFLib.degrees(-tableGroup[1].angle),
                  rotate: PDFLib.degrees(angleToRotate),
                });
                xx++;
              }
            }
          }

          // Convert fabric canvas to high-resolution image
          const fabricDataUrl = fabricCanvas.toDataURL({
            format: "png",
            quality: 1, // Max quality
          });
          const pngImage = await pdfDoc.embedPng(fabricDataUrl);
          console.log("objectsss::", fabricCanvas.getObjects());
          fabricCanvas.clear();
          fabricCanvas.renderAll();
          console.log("objectsss after deleting::", fabricCanvas.getObjects());
          const loader = document.getElementById("loader");
          loader.classList.remove("hidden");
          setTimeout(() => {
            document.getElementById("clearCanvas").click();
            fabricCanvas.clear();
            console.log("fabric objects", fabricCanvas.getObjects().length);
            loader.classList.add("hidden");
          }, 1000);
          // Get all objects on the canvas
          const objects = fabricCanvas.getObjects();

          // Remove the first object (or any specific one)
          if (objects.length > 0) {
            fabricCanvas.clear();
            fabricCanvas.remove(objects); // Removes the first object
            fabricCanvas.renderAll();
            console.log("i am inside objects.length>0");
          }
        }
      } else {
        console.log("we are in multi table");
        for (let i = 1; i < numPages; i++) {
          const page = pdfDoc.getPages()[i - 1];
          const { width, height } = page.getSize();

          console.log("the pdf is priting", currentPage, tableInfo);
          console.log(
            "page number",
            i,
            "numPages",
            numPages,
            "tableGroup",
            Object.keys(tableGroup)
          );
          if (tableInfo && tableGroup[i] != null) {
            const cellWidth =
              tableInfo.cellWidth * Number(tableGroup[i].scaleX);
            const cellHeight =
              tableInfo.cellHeight * Number(tableGroup[i].scaleY);
            const rows = tableInfo.rows;
            const columns = tableInfo.columns;
            const x = tableGroup[i].left;
            let y =
              height -
              (tableGroup[1].top + tableInfo.rows * cellHeight) -
              cellHeight; // Adjust y-coordinate for PDF coordinate system
            // console.log('tableGroup',i, tableGroup[i])
            let xx = 0;
            page.drawRectangle({
              x: x,
              y: y + tableInfo.rows * cellHeight,
              width: cellWidth * 6,
              height: cellHeight,
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });
            // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawText(currentTable, {
              x: x + cellWidth + 10,
              y:
                y +
                tableInfo.rows * cellHeight +
                cellHeight -
                24 * Number(tableGroup[1].scaleY),
              size:
                20 *
                Math.max(
                  Number(tableGroup[1].scaleX),
                  Number(tableGroup[1].scaleY)
                ),
              color: PDFLib.rgb(0, 0, 0),
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });

            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < columns; col++) {
                page.drawRectangle({
                  //(col === 0 ? col * cellWidth : col * cellWidth)
                  x: x + col * cellWidth,
                  y: y + row * cellHeight,
                  width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                  height: cellHeight,
                  borderColor: PDFLib.rgb(0, 0, 0),
                  borderWidth: 1,
                });

                page.drawText(multipleTables[currentTable][xx], {
                  x: x + col * cellWidth + 10,
                  y:
                    y +
                    row * cellHeight +
                    cellHeight -
                    24 * Number(tableGroup[i].scaleY), // Adjust text position
                  size:
                    14 *
                    Math.max(
                      Number(tableGroup[1].scaleX),
                      Number(tableGroup[1].scaleY)
                    ),
                  color: PDFLib.rgb(0, 0, 0),
                });
                xx++;
              }
            }
          }

          // Convert fabric canvas to high-resolution image
          const fabricDataUrl = fabricCanvas.toDataURL({
            format: "png",
            quality: 1, // Max quality
          });
          const pngImage = await pdfDoc.embedPng(fabricDataUrl);
        }
        fabricCanvas.clear();
        fabricCanvas.renderAll();
      }
    } else {
      console.log("rendering normal tables");
      if (Object.keys(tableGroup).length == 1) {
        for (let i = 0; i < numPages; i++) {
          const page = pdfDoc.getPages()[0];
          const { width, height } = page.getSize();

          console.log(
            "the pdf is priting single table",
            currentPage,
            tableInfo,
            tableGroup
          );
          console.log(
            "page number",
            i,
            "numPages",
            numPages,
            "tableGroup",
            Object.keys(tableGroup)
          );
          if (tableInfo && tableGroup[1] != null) {
            const cellWidth =
              tableInfo.cellWidth * Number(tableGroup[1].scaleX);
            const cellHeight =
              tableInfo.cellHeight * Number(tableGroup[1].scaleY);
            const rows = tableInfo.rows;
            const columns = tableInfo.columns;
            let x = tableGroup[1].left;
            let y =
              height -
              (tableGroup[1].top + tableInfo.rows * cellHeight) -
              cellHeight; // Adjust y-coordinate for PDF coordinate system
            // console.log('tableGroup',i, tableGroup[i])

            let xx = 0;

            // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawRectangle({
              x: x,
              y: y + tableInfo.rows * cellHeight,
              width: cellWidth * 6,
              height: cellHeight,
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });
            // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawText(currentTable, {
              x: x + 2 * cellWidth,
              y:
                y +
                tableInfo.rows * cellHeight +
                cellHeight -
                24 * Number(tableGroup[1].scaleY),
              size: 20 * Number(tableGroup[1].scaleX),
              color: PDFLib.rgb(0, 0, 0),
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });

            // x  = x + 5 * cellHeight;
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < columns; col++) {
                // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
                page.drawRectangle({
                  x: x + col * (col === 0 ? cellWidth : cellWidth * 2),
                  y: y + row * cellHeight,
                  width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                  height: cellHeight,
                  borderColor: PDFLib.rgb(0, 0, 0),
                  borderWidth: 1,
                  // rotate: PDFLib.degrees(-tableGroup[1].angle),
                });
                // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
                page.drawText(multipleTables[currentTable][xx], {
                  //(col === 0 ? cellWidth * 2 : cellWidth * 4)
                  x:
                    x + col * (col === 0 ? cellWidth + 50 : cellWidth * 2) + 10,
                  y:
                    y +
                    row * cellHeight +
                    cellHeight -
                    24 * Number(tableGroup[1].scaleY),
                  size: 14 * Number(tableGroup[1].scaleX),
                  color: PDFLib.rgb(0, 0, 0),
                  // rotate: PDFLib.degrees(-tableGroup[1].angle),
                });
                xx++;
              }
            }
          }

          // Convert fabric canvas to high-resolution image
          const fabricDataUrl = fabricCanvas.toDataURL({
            format: "png",
            quality: 1, // Max quality
          });
          const pngImage = await pdfDoc.embedPng(fabricDataUrl);
          console.log("objectsss::", fabricCanvas.getObjects());
          fabricCanvas.clear();
          fabricCanvas.renderAll();
          console.log("objectsss after deleting::", fabricCanvas.getObjects());
          const loader = document.getElementById("loader");
          loader.classList.remove("hidden");
          setTimeout(() => {
            document.getElementById("clearCanvas").click();
            fabricCanvas.clear();
            console.log("fabric objects", fabricCanvas.getObjects().length);
            loader.classList.add("hidden");
          }, 1000);
          // Get all objects on the canvas
          const objects = fabricCanvas.getObjects();

          // Remove the first object (or any specific one)
          if (objects.length > 0) {
            fabricCanvas.clear();
            fabricCanvas.remove(objects); // Removes the first object
            fabricCanvas.renderAll();
            console.log("i am inside objects.length>0");
          }
        }
      } else {
        console.log("we are in multi table");
        for (let i = 1; i < numPages; i++) {
          const page = pdfDoc.getPages()[i - 1];
          const { width, height } = page.getSize();

          console.log("the pdf is priting", currentPage, tableInfo);
          console.log(
            "page number",
            i,
            "numPages",
            numPages,
            "tableGroup",
            Object.keys(tableGroup)
          );
          if (tableInfo && tableGroup[i] != null) {
            const cellWidth =
              tableInfo.cellWidth * Number(tableGroup[i].scaleX);
            const cellHeight =
              tableInfo.cellHeight * Number(tableGroup[i].scaleY);
            const rows = tableInfo.rows;
            const columns = tableInfo.columns;
            const x = tableGroup[i].left;
            let y =
              height -
              (tableGroup[1].top + tableInfo.rows * cellHeight) -
              cellHeight; // Adjust y-coordinate for PDF coordinate system
            // console.log('tableGroup',i, tableGroup[i])
            let xx = 0;
            page.drawRectangle({
              x: x,
              y: y + tableInfo.rows * cellHeight,
              width: cellWidth * 6,
              height: cellHeight,
              borderColor: PDFLib.rgb(0, 0, 0),
              borderWidth: 1,
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });
            // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
            page.drawText(currentTable, {
              x: x + cellWidth + 10,
              y:
                y +
                tableInfo.rows * cellHeight +
                cellHeight -
                24 * Number(tableGroup[1].scaleY),
              size:
                20 *
                Math.max(
                  Number(tableGroup[1].scaleX),
                  Number(tableGroup[1].scaleY)
                ),
              color: PDFLib.rgb(0, 0, 0),
              // rotate: PDFLib.degrees(-tableGroup[1].angle),
            });

            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < columns; col++) {
                page.drawRectangle({
                  //(col === 0 ? col * cellWidth : col * cellWidth)
                  x: x + col * cellWidth,
                  y: y + row * cellHeight,
                  width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                  height: cellHeight,
                  borderColor: PDFLib.rgb(0, 0, 0),
                  borderWidth: 1,
                });

                page.drawText(multipleTables[currentTable][xx], {
                  x: x + col * cellWidth + 10,
                  y:
                    y +
                    row * cellHeight +
                    cellHeight -
                    24 * Number(tableGroup[i].scaleY), // Adjust text position
                  size:
                    14 *
                    Math.max(
                      Number(tableGroup[1].scaleX),
                      Number(tableGroup[1].scaleY)
                    ),
                  color: PDFLib.rgb(0, 0, 0),
                });
                xx++;
              }
            }
          }

          // Convert fabric canvas to high-resolution image
          const fabricDataUrl = fabricCanvas.toDataURL({
            format: "png",
            quality: 1, // Max quality
          });
          const pngImage = await pdfDoc.embedPng(fabricDataUrl);
        }
        fabricCanvas.clear();
        fabricCanvas.renderAll();
      }
    }
    function scalePath(path, scaleX, scaleY) {
      // Get the current path data (points)
      const originalPath = path;

      // Scale each point in the path
      const scaledPath = originalPath.map((segment) => {
        // Create a new segment with the command type preserved
        const newSegment = [segment[0]]; // First item is the command type (e.g., 'Q', 'L', etc.)

        // Scale the x and y coordinates
        for (let i = 1; i < segment.length; i += 2) {
          const x = segment[i] * scaleX; // Scale x
          const y = segment[i + 1] * scaleY; // Scale y
          newSegment.push(x, y); // Push scaled coordinates
        }

        return newSegment; // Return the new scaled segment
      });

      // Update the path with the new scaled points

      // Return the new scaled path array
      return scaledPath;
    }
    function translatePathToBoundingBox(path, coords) {
      // Assuming coords is an object with properties bl, br, tl, tr
      const { bl, br, tl, tr } = coords;

      // Calculate bounding box center
      const centerX = (bl.x + br.x) / 2; // Midpoint of bottom edge
      const centerY = (tl.y + bl.y) / 2; // Midpoint of left edge

      // Get current path data to calculate its bounding box
      const currentPath = path;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      currentPath.forEach((segment) => {
        for (let i = 1; i < segment.length; i += 2) {
          const x = segment[i];
          const y = segment[i + 1];

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      });

      // Calculate the center of the current path
      const pathCenterX = (minX + maxX) / 2;
      const pathCenterY = (minY + maxY) / 2;

      // Calculate translation needed to move path center to bounding box center
      const translateX = centerX - pathCenterX;
      const translateY = centerY - pathCenterY;

      // Translate path points
      const translatedPath = currentPath.map((segment) => {
        const newSegment = [segment[0]]; // Preserve the command type

        for (let i = 1; i < segment.length; i += 2) {
          const x = segment[i] + translateX; // Translate x
          const y = segment[i + 1] + translateY; // Translate y
          newSegment.push(x, y); // Push translated coordinates
        }

        return newSegment; // Return the new translated segment
      });

      return translatedPath; // Return the new translated path
    }
    const svgPaths = extractPathsAsSvg(fabricCanvas);

    svgPaths.forEach((svgPath, index) => {
      console.log("co ordinates", svgPath);
      const scaledArray = scalePath(
        svgPath.path.path,
        svgPath.path.scaleX,
        svgPath.path.scaleY
      );
      const translatedArray = translatePathToBoundingBox(
        scaledArray,
        svgPath.path.aCoords
      );
      const result = translatedArray
        .map((subArray) =>
          subArray
            .map((item) => (typeof item === "number" ? item.toString() : item))
            .join(" ")
        )
        .join(" ");
      console.log("selected RGB", hexToRgb(selectedColor));
      let color = hexToRgb(svgPath.path.stroke);
      page.drawSvgPath(result, {
        x: 0,
        y: height,
        borderColor: PDFLib.rgb(color.r / 255, color.g / 255, color.b / 255),
        borderWidth:
          svgPath.path.strokeWidth *
          Math.max(svgPath.path.scaleX, svgPath.path.scaleY),
      });
    });

    let circles = fabricCanvas
      .getObjects()
      .filter((obj) => obj.type === "circle");
    console.log("Circles", circles);
    circles.forEach((circle) => {
      page.drawCircle({
        x: circle.left + 100 * circle.scaleX, // X-coordinate of the center
        y: height - circle.top - 100 * circle.scaleX, // Y-coordinate of the center
        radius: 5, // Radius of the circle
        // color: PDFLib.rgb(0, 0.5, 0.5), // Optional: fill color (cyan here)
        // borderColor:  PDFLib.rgb(0, 0, 0), // Optional: border color (black here)

        borderWidth: 2, // Optional: border width
      });
    });
    const pdfinfo = JSON.parse(localStorage.getItem("pdfFullInfo"));
    const pdfBytesEdited = await pdfDoc.save();
    const formData = new FormData();
    formData.append(
      "DrawingReferencePDFFile",
      new Blob([pdfBytesEdited], { type: "application/pdf" }),
      "edited.pdf"
    );
    formData.append(
      "CreatedBy",
      pdfinfo?.memberData?.DrawingFile[0]?.createdBy
    );
    formData.append("DrawingId", pdfinfo?.drawingId);
    // Send the FormData to the server
    const response = await fetch(
      `${apiURL}/nc/files/api/nc/referencepdffile/create`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (response.ok) {
      console.log("PDF sent to server successfully.");
      showToast();
      const transitionBody = {
        memberId: pdfinfo?.memberData?.DrawingFile[0]?.createdBy,
        drawingId: pdfinfo?.drawingId,
        stages: [
          {
            stageName: "HQ-APPROVAL",
            assignedMembers: JSON.parse(localStorage.getItem("members")),
          },
          {
            stageName: "HQ-RELEASE",
            assignedMembers: JSON.parse(localStorage.getItem("releasemember")),
          },
        ],
      };
      const transitionResponse = await fetch(
        `${apiURL}/awf/api/wf/stageresetapproval`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(transitionBody),
          headers: {
            "Content-Type": "application/json", // Ensure you're telling the server you're sending JSON
          },
          // body : transitionBody,

          // body : 'hello there this is body'
        }
      );
      const signatureBody = {
        DrawingId: pdfinfo?.drawingId,
        newHistory: [
          {
            SignTitle: JSON.parse(localStorage.getItem("pdfFullInfo"))
              .signatureBlock,
            MemberDetails: JSON.parse(localStorage.getItem("members")).map(
              (m) => ({
                MemberName: m,
              })
            ),
          },
        ],
      };
      const signatureResponse = await fetch(
        `${apiURL}/awf/api/sign/signature-history/add-history`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(signatureBody),
          headers: {
            "Content-Type": "application/json", // Ensure you're telling the server you're sending JSON
          },
          // body : transitionBody,

          // body : 'hello there this is body'
        }
      );

      try {
        const bodyPayloadReviewed = {
          drawingId: pdfinfo?.drawingId,
          stage: "Release",
          userNames: JSON.parse(localStorage.getItem("releasemember")),
        };
        const response = await fetch(
          `${apiURL}/notifications/api/user-drawing-status`,
          {
            method: "POST", // Use PUT method
            body: JSON.stringify(bodyPayloadReviewed), // Convert to JSON string,
            headers: {
              "Content-Type": "application/json", // Ensure JSON format
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Response:", responseData);
      } catch (error) {
        console.error("Error updating drawing status:", error);
      }

      try {
        const bodyPayloadReviewed = {
          drawingId: pdfinfo?.drawingId,
          stage: "Approve",
          userNames: JSON.parse(localStorage.getItem("members")),
        };
        const response = await fetch(
          `${apiURL}/notifications/api/user-drawing-status`,
          {
            method: "POST", // Use PUT method
            body: JSON.stringify(bodyPayloadReviewed), // Convert to JSON string,
            headers: {
              "Content-Type": "application/json", // Ensure JSON format
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Response:", responseData);
      } catch (error) {
        console.error("Error updating drawing status:", error);
      }
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.error("Error sending PDF to server:", response.statusText);
    }
    const pdfBlob = new Blob([pdfBytesEdited], { type: "application/pdf" });

    ///// Convert the Blob to Base64 string
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   const base64data = reader.result; // Base64 encoded string of the PDF
    //   localStorage.setItem('editedPdfBase64', base64data); // Save the Base64 string in localStorage
    // };

    //// Read the Blob as a Base64 string
    // reader.readAsDataURL(pdfBlob);
    // const pdfUrl = URL.createObjectURL(new Blob([pdfBytesEdited], { type: 'application/pdf' }));
    // const link = document.createElement('a');
    // link.href = pdfUrl;
    // link.download = 'edited.pdf';
    // link.click();
  });
function hideLoader() {
  const loader = document.getElementById("loader");
  loader.classList.add("hidden");
}
document.getElementById("saveTableBtn").addEventListener("click", async () => {
  // Clear existing fabricCanvas objects
  console.log("Active Object:", fabricCanvas.getActiveObject());
  console.log("Objects on Canvas:", fabricCanvas.getObjects());

  const canvas = document.getElementById("pdf-canvas");
  textElements = fabricCanvas.getObjects().filter((obj) => obj.type === "text");
  const pathElements = fabricCanvas
    .getObjects()
    .filter((obj) => obj.type === "path");
  console.log("path Elements", pathElements);
  if (pathElements.length === 0) {
    console.log("No text elements found.");
  } else {
    // Create SVG content from text elements
    const svgContent = pathElements
      .map((text) => {
        return `<text x="${text.left}" y="${text.top}" fill="${text.fill}" font-size="${text.fontSize}">${text.text}</text>`;
      })
      .join("\n");

    // Construct SVG string
    const svgString = `
            <svg width="${fabricCanvas.width}" height="${fabricCanvas.height}" xmlns="http://www.w3.org/2000/svg">
              ${svgContent}
            </svg>
        `;
  }

  if (textElements.length === 0) {
    console.log("No text elements found.");
  } else {
    // Create SVG content from text elements
    const svgContent = textElements
      .map((text) => {
        return `<text x="${text.left}" y="${text.top}" fill="${text.fill}" font-size="${text.fontSize}">${text.text}</text>`;
      })
      .join("\n");

    // Construct SVG string
    const svgString = `
            <svg width="${fabricCanvas.width}" height="${fabricCanvas.height}" xmlns="http://www.w3.org/2000/svg">
              ${svgContent}
            </svg>
        `;
  }

  console.log("downloading pdf");
  if (!pdfBytes) return;

  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const numPages = pdfDoc.getPageCount();
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();
  const angleRadians = (60 * Math.PI) / 180;
  textElements.map((textElement) => {
    // console.log('textElement', textElement.text, textElement.scaleX, textElement.scaleY)
    console.log("textElement", textElement);
    console.log("selected COlor", hexToRgb(textElement.fill));
    const textColor = hexToRgb(textElement.fill);
    page.drawText(textElement.text, {
      x: textElement.left, // X-coordinate for the text
      y: height - (textElement.top + 20 * textElement.scaleY), // Y-coordinate for the text
      size: 20 * Math.ceil(Number(textElement.scaleX)),
      borderWidth: 2, // Outline width
      rotate: PDFLib.degrees(-textElement.angle),
      color: PDFLib.rgb(
        textColor.r / 255,
        textColor.g / 255,
        textColor.b / 255
      ),
    });
  });

  console.log("page number", "numPages", numPages, "tableGroup", tableGroup);
  console.log();
  // if (Object.keys(tableGroup).length == 1) {
  //     for (let i = 0; i < numPages; i++) {
  //         const page = pdfDoc.getPages()[0];
  //         const { width, height } = page.getSize();

  //         console.log('the pdf is priting single table', currentPage, tableInfo, tableGroup);
  //         console.log('page number', i, 'numPages', numPages, 'tableGroup', Object.keys(tableGroup));
  //         if (tableInfo && tableGroup[1] != null) {
  //             const cellWidth = tableInfo.cellWidth * Number(tableGroup[1].scaleX);
  //             const cellHeight = tableInfo.cellHeight * Number(tableGroup[1].scaleY);
  //             const rows = tableInfo.rows;
  //             const columns = tableInfo.columns;
  //             let x = tableGroup[1].left;
  //             let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
  //             // console.log('tableGroup',i, tableGroup[i])

  //             let xx = 0;

  //             // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
  //             page.drawRectangle({
  //                 x: x,
  //                 y: y + tableInfo.rows * cellHeight,
  //                 width: cellWidth * 6,
  //                 height: cellHeight,
  //                 borderColor: PDFLib.rgb(0, 0, 0),
  //                 borderWidth: 1
  //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //             });
  //             // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
  //             page.drawText(currentTable, {
  //                 x: x + 2 * cellWidth,
  //                 y: y + tableInfo.rows * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
  //                 size: 20 * Number(tableGroup[1].scaleX),
  //                 color: PDFLib.rgb(0, 0, 0)
  //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //             });

  //             // x  = x + 5 * cellHeight;
  //             for (let row = 0; row < rows; row++) {
  //                 for (let col = 0; col < columns; col++) {
  //                     // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
  //                     page.drawRectangle({
  //                         x: x + col * (col === 0 ? cellWidth : cellWidth * 2),
  //                         y: y + row * cellHeight,
  //                         width: col === 0 ? cellWidth * 2 : cellWidth * 4,
  //                         height: cellHeight,
  //                         borderColor: PDFLib.rgb(0, 0, 0),
  //                         borderWidth: 1
  //                         // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //                     });
  //                     // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
  //                     page.drawText(multipleTables[currentTable][xx], {
  //                         //(col === 0 ? cellWidth * 2 : cellWidth * 4)
  //                         x: x + col * (col === 0 ? cellWidth + 50 : cellWidth * 2) + 10,
  //                         y: y + row * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
  //                         size: 14 * Number(tableGroup[1].scaleX),
  //                         color: PDFLib.rgb(0, 0, 0)
  //                         // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //                     });
  //                     xx++;
  //                 }
  //             }
  //         }

  //         // Convert fabric canvas to high-resolution image
  //         const fabricDataUrl = fabricCanvas.toDataURL({
  //             format: 'png',
  //             quality: 1 // Max quality
  //         });
  //         const pngImage = await pdfDoc.embedPng(fabricDataUrl);
  //         console.log('objectsss::', fabricCanvas.getObjects());
  //         fabricCanvas.clear();
  //         fabricCanvas.renderAll();
  //         console.log('objectsss after deleting::', fabricCanvas.getObjects());
  //         const loader = document.getElementById('loader');
  //         loader.classList.remove('hidden');
  //         setTimeout(() => {
  //             document.getElementById('clearCanvas').click();
  //             fabricCanvas.clear();
  //             console.log('fabric objects', fabricCanvas.getObjects().length);
  //             loader.classList.add('hidden');
  //         }, 1000);
  //         // Get all objects on the canvas
  //         const objects = fabricCanvas.getObjects();

  //         // Remove the first object (or any specific one)
  //         if (objects.length > 0) {
  //             fabricCanvas.clear();
  //             fabricCanvas.remove(objects); // Removes the first object
  //             fabricCanvas.renderAll();
  //             console.log('i am inside objects.length>0');
  //         }
  //     }
  // } else {
  //     console.log('we are in multi table');
  //     for (let i = 1; i < numPages; i++) {
  //         const page = pdfDoc.getPages()[i - 1];
  //         const { width, height } = page.getSize();

  //         console.log('the pdf is priting', currentPage, tableInfo);
  //         console.log('page number', i, 'numPages', numPages, 'tableGroup', Object.keys(tableGroup));
  //         if (tableInfo && tableGroup[i] != null) {
  //             const cellWidth = tableInfo.cellWidth * Number(tableGroup[i].scaleX);
  //             const cellHeight = tableInfo.cellHeight * Number(tableGroup[i].scaleY);
  //             const rows = tableInfo.rows;
  //             const columns = tableInfo.columns;
  //             const x = tableGroup[i].left;
  //             let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
  //             // console.log('tableGroup',i, tableGroup[i])
  //             let xx = 0;
  //             page.drawRectangle({
  //                 x: x,
  //                 y: y + tableInfo.rows * cellHeight,
  //                 width: cellWidth * 6,
  //                 height: cellHeight,
  //                 borderColor: PDFLib.rgb(0, 0, 0),
  //                 borderWidth: 1
  //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //             });
  //             // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
  //             page.drawText(currentTable, {
  //                 x: x + cellWidth + 10,
  //                 y: y + tableInfo.rows * cellHeight + cellHeight - 24 * Number(tableGroup[1].scaleY),
  //                 size: 20 * Math.max(Number(tableGroup[1].scaleX), Number(tableGroup[1].scaleY)),
  //                 color: PDFLib.rgb(0, 0, 0)
  //                 // rotate: PDFLib.degrees(-tableGroup[1].angle),
  //             });

  //             for (let row = 0; row < rows; row++) {
  //                 for (let col = 0; col < columns; col++) {
  //                     page.drawRectangle({
  //                         //(col === 0 ? col * cellWidth : col * cellWidth)
  //                         x: x + col * cellWidth,
  //                         y: y + row * cellHeight,
  //                         width: col === 0 ? cellWidth * 2 : cellWidth * 4,
  //                         height: cellHeight,
  //                         borderColor: PDFLib.rgb(0, 0, 0),
  //                         borderWidth: 1
  //                     });

  //                     page.drawText(multipleTables[currentTable][xx], {
  //                         x: x + col * cellWidth + 10,
  //                         y: y + row * cellHeight + cellHeight - 24 * Number(tableGroup[i].scaleY), // Adjust text position
  //                         size: 14 * Math.max(Number(tableGroup[1].scaleX), Number(tableGroup[1].scaleY)),
  //                         color: PDFLib.rgb(0, 0, 0)
  //                     });
  //                     xx++;
  //                 }
  //             }
  //         }

  //         // Convert fabric canvas to high-resolution image
  //         const fabricDataUrl = fabricCanvas.toDataURL({
  //             format: 'png',
  //             quality: 1 // Max quality
  //         });
  //         const pngImage = await pdfDoc.embedPng(fabricDataUrl);
  //     }
  //     fabricCanvas.clear();
  //     fabricCanvas.renderAll();
  // }
  if (angleToRotate > 0) {
    console.log("rendering oriented tables");
    if (Object.keys(tableGroup).length == 1) {
      for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        console.log(
          "the pdf is priting single table",
          currentPage,
          tableInfo,
          tableGroup
        );
        console.log(
          "page number",
          i,
          "numPages",
          numPages,
          "tableGroup",
          Object.keys(tableGroup)
        );
        if (tableInfo && tableGroup[1] != null) {
          const cellWidth = tableInfo.cellWidth * Number(tableGroup[1].scaleX);
          const cellHeight =
            tableInfo.cellHeight * Number(tableGroup[1].scaleY);
          const rows = tableInfo.rows;
          const columns = tableInfo.columns;
          // let x = tableGroup[1].left;
          // let y = height - (tableGroup[1].top + tableInfo.rows * cellHeight) - cellHeight; // Adjust y-coordinate for PDF coordinate system
          // console.log('tableGroup',i, tableGroup[i])
          let x =
            width -
            (tableGroup[1].top + tableInfo.rows * cellHeight) -
            cellHeight;
          let y = height - tableGroup[1].left; // Adjust y-coordinate for PDF coordinate system

          console.log(
            "old co-ordinates",
            x,
            y,
            "size",
            width,
            height,
            "orientation angle",
            angleToRotate
          );
          const tempC = { x, y };
          // x = tempC.y,
          // y = tempC.x
          // x = headingCoord.x
          // y = headingCoord.y

          let xx = 0;

          // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawRectangle({
            x: x + tableInfo.rows * cellHeight,
            y: y,
            width: cellWidth * 6,
            height: cellHeight,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 1,
            rotate: PDFLib.degrees(angleToRotate),
          });
          // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawText(currentTable, {
            x:
              x +
              tableInfo.rows * cellHeight +
              24 * Number(tableGroup[1].scaleY),
            y: y - 2 * cellWidth + 24 * Number(tableGroup[1].scaleX),
            size: 20 * Number(tableGroup[1].scaleX),
            color: PDFLib.rgb(0, 0, 0),
            rotate: PDFLib.degrees(angleToRotate),
          });

          // x  = x + 5 * cellHeight;
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
              page.drawRectangle({
                x: x + row * cellHeight,
                y: col == 0 ? y : y - 2 * cellWidth,
                width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                height: cellHeight,
                borderColor: PDFLib.rgb(0, 0, 0),
                borderWidth: 1,
                rotate: PDFLib.degrees(angleToRotate),
              });
              // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
              page.drawText(multipleTables[currentTable][xx], {
                //(col === 0 ? cellWidth * 2 : cellWidth * 4)
                x: x + row * cellHeight + 8,
                y: y - col * (col === 0 ? cellWidth + 50 : cellWidth * 2) - 14,
                size: 14 * Number(tableGroup[1].scaleX),
                color: PDFLib.rgb(0, 0, 0),
                // rotate: PDFLib.degrees(-tableGroup[1].angle),
                rotate: PDFLib.degrees(angleToRotate),
              });
              xx++;
            }
          }
        }

        // Convert fabric canvas to high-resolution image
        const fabricDataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1, // Max quality
        });
        const pngImage = await pdfDoc.embedPng(fabricDataUrl);
        console.log("objectsss::", fabricCanvas.getObjects());
        fabricCanvas.clear();
        fabricCanvas.renderAll();
        console.log("objectsss after deleting::", fabricCanvas.getObjects());
        const loader = document.getElementById("loader");
        loader.classList.remove("hidden");
        setTimeout(() => {
          document.getElementById("clearCanvas").click();
          fabricCanvas.clear();
          console.log("fabric objects", fabricCanvas.getObjects().length);
          loader.classList.add("hidden");
        }, 1000);
        // Get all objects on the canvas
        const objects = fabricCanvas.getObjects();

        // Remove the first object (or any specific one)
        if (objects.length > 0) {
          fabricCanvas.clear();
          fabricCanvas.remove(objects); // Removes the first object
          fabricCanvas.renderAll();
          console.log("i am inside objects.length>0");
        }
      }
    } else {
      console.log("we are in multi table");
      for (let i = 1; i < numPages; i++) {
        const page = pdfDoc.getPages()[i - 1];
        const { width, height } = page.getSize();

        console.log("the pdf is priting", currentPage, tableInfo);
        console.log(
          "page number",
          i,
          "numPages",
          numPages,
          "tableGroup",
          Object.keys(tableGroup)
        );
        if (tableInfo && tableGroup[i] != null) {
          const cellWidth = tableInfo.cellWidth * Number(tableGroup[i].scaleX);
          const cellHeight =
            tableInfo.cellHeight * Number(tableGroup[i].scaleY);
          const rows = tableInfo.rows;
          const columns = tableInfo.columns;
          const x = tableGroup[i].left;
          let y =
            height -
            (tableGroup[1].top + tableInfo.rows * cellHeight) -
            cellHeight; // Adjust y-coordinate for PDF coordinate system
          // console.log('tableGroup',i, tableGroup[i])
          let xx = 0;
          page.drawRectangle({
            x: x,
            y: y + tableInfo.rows * cellHeight,
            width: cellWidth * 6,
            height: cellHeight,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 1,
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });
          // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawText(currentTable, {
            x: x + cellWidth + 10,
            y:
              y +
              tableInfo.rows * cellHeight +
              cellHeight -
              24 * Number(tableGroup[1].scaleY),
            size:
              20 *
              Math.max(
                Number(tableGroup[1].scaleX),
                Number(tableGroup[1].scaleY)
              ),
            color: PDFLib.rgb(0, 0, 0),
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              page.drawRectangle({
                //(col === 0 ? col * cellWidth : col * cellWidth)
                x: x + col * cellWidth,
                y: y + row * cellHeight,
                width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                height: cellHeight,
                borderColor: PDFLib.rgb(0, 0, 0),
                borderWidth: 1,
              });

              page.drawText(multipleTables[currentTable][xx], {
                x: x + col * cellWidth + 10,
                y:
                  y +
                  row * cellHeight +
                  cellHeight -
                  24 * Number(tableGroup[i].scaleY), // Adjust text position
                size:
                  14 *
                  Math.max(
                    Number(tableGroup[1].scaleX),
                    Number(tableGroup[1].scaleY)
                  ),
                color: PDFLib.rgb(0, 0, 0),
              });
              xx++;
            }
          }
        }

        // Convert fabric canvas to high-resolution image
        const fabricDataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1, // Max quality
        });
        const pngImage = await pdfDoc.embedPng(fabricDataUrl);
      }
      fabricCanvas.clear();
      fabricCanvas.renderAll();
    }
  } else {
    console.log("rendering normal tables");
    if (Object.keys(tableGroup).length == 1) {
      for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        console.log(
          "the pdf is priting single table",
          currentPage,
          tableInfo,
          tableGroup
        );
        console.log(
          "page number",
          i,
          "numPages",
          numPages,
          "tableGroup",
          Object.keys(tableGroup)
        );
        if (tableInfo && tableGroup[1] != null) {
          const cellWidth = tableInfo.cellWidth * Number(tableGroup[1].scaleX);
          const cellHeight =
            tableInfo.cellHeight * Number(tableGroup[1].scaleY);
          const rows = tableInfo.rows;
          const columns = tableInfo.columns;
          let x = tableGroup[1].left;
          let y =
            height -
            (tableGroup[1].top + tableInfo.rows * cellHeight) -
            cellHeight; // Adjust y-coordinate for PDF coordinate system
          // console.log('tableGroup',i, tableGroup[i])

          let xx = 0;

          // let newCordHeading = rotatePointAroundPoint(x ,y +  tableInfo.rows * cellHeight,intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawRectangle({
            x: x,
            y: y + tableInfo.rows * cellHeight,
            width: cellWidth * 6,
            height: cellHeight,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 1,
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });
          // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawText(currentTable, {
            x: x + 2 * cellWidth,
            y:
              y +
              tableInfo.rows * cellHeight +
              cellHeight -
              24 * Number(tableGroup[1].scaleY),
            size: 20 * Number(tableGroup[1].scaleX),
            color: PDFLib.rgb(0, 0, 0),
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });

          // x  = x + 5 * cellHeight;
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              // let newCord = rotatePointAroundPoint(x + col * cellWidth,(y + row * cellHeight),intersect.x,intersect.y, -tableGroup[1].angle )
              page.drawRectangle({
                x: x + col * (col === 0 ? cellWidth : cellWidth * 2),
                y: y + row * cellHeight,
                width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                height: cellHeight,
                borderColor: PDFLib.rgb(0, 0, 0),
                borderWidth: 1,
                // rotate: PDFLib.degrees(-tableGroup[1].angle),
              });
              // newCord = rotatePointAroundPoint(x + col * cellWidth + 10,(y + row * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY)))),intersect.x,intersect.y, -tableGroup[1].angle )
              page.drawText(multipleTables[currentTable][xx], {
                //(col === 0 ? cellWidth * 2 : cellWidth * 4)
                x: x + col * (col === 0 ? cellWidth + 50 : cellWidth * 2) + 10,
                y:
                  y +
                  row * cellHeight +
                  cellHeight -
                  24 * Number(tableGroup[1].scaleY),
                size: 14 * Number(tableGroup[1].scaleX),
                color: PDFLib.rgb(0, 0, 0),
                // rotate: PDFLib.degrees(-tableGroup[1].angle),
              });
              xx++;
            }
          }
        }

        // Convert fabric canvas to high-resolution image
        const fabricDataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1, // Max quality
        });
        const pngImage = await pdfDoc.embedPng(fabricDataUrl);
        console.log("objectsss::", fabricCanvas.getObjects());
        fabricCanvas.clear();
        fabricCanvas.renderAll();
        console.log("objectsss after deleting::", fabricCanvas.getObjects());
        const loader = document.getElementById("loader");
        loader.classList.remove("hidden");
        setTimeout(() => {
          document.getElementById("clearCanvas").click();
          fabricCanvas.clear();
          console.log("fabric objects", fabricCanvas.getObjects().length);
          loader.classList.add("hidden");
        }, 1000);
        // Get all objects on the canvas
        const objects = fabricCanvas.getObjects();

        // Remove the first object (or any specific one)
        if (objects.length > 0) {
          fabricCanvas.clear();
          fabricCanvas.remove(objects); // Removes the first object
          fabricCanvas.renderAll();
          console.log("i am inside objects.length>0");
        }
      }
    } else {
      console.log("we are in multi table");
      for (let i = 1; i < numPages; i++) {
        const page = pdfDoc.getPages()[i - 1];
        const { width, height } = page.getSize();

        console.log("the pdf is priting", currentPage, tableInfo);
        console.log(
          "page number",
          i,
          "numPages",
          numPages,
          "tableGroup",
          Object.keys(tableGroup)
        );
        if (tableInfo && tableGroup[i] != null) {
          const cellWidth = tableInfo.cellWidth * Number(tableGroup[i].scaleX);
          const cellHeight =
            tableInfo.cellHeight * Number(tableGroup[i].scaleY);
          const rows = tableInfo.rows;
          const columns = tableInfo.columns;
          const x = tableGroup[i].left;
          let y =
            height -
            (tableGroup[1].top + tableInfo.rows * cellHeight) -
            cellHeight; // Adjust y-coordinate for PDF coordinate system
          // console.log('tableGroup',i, tableGroup[i])
          let xx = 0;
          page.drawRectangle({
            x: x,
            y: y + tableInfo.rows * cellHeight,
            width: cellWidth * 6,
            height: cellHeight,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 1,
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });
          // newCordHeading = rotatePointAroundPoint(x + cellWidth + 10, y + tableInfo.rows * cellHeight + cellHeight - ( 24 * (Number(tableGroup[1].scaleY))),intersect.x,intersect.y, -tableGroup[1].angle )
          page.drawText(currentTable, {
            x: x + cellWidth + 10,
            y:
              y +
              tableInfo.rows * cellHeight +
              cellHeight -
              24 * Number(tableGroup[1].scaleY),
            size:
              20 *
              Math.max(
                Number(tableGroup[1].scaleX),
                Number(tableGroup[1].scaleY)
              ),
            color: PDFLib.rgb(0, 0, 0),
            // rotate: PDFLib.degrees(-tableGroup[1].angle),
          });

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              page.drawRectangle({
                //(col === 0 ? col * cellWidth : col * cellWidth)
                x: x + col * cellWidth,
                y: y + row * cellHeight,
                width: col === 0 ? cellWidth * 2 : cellWidth * 4,
                height: cellHeight,
                borderColor: PDFLib.rgb(0, 0, 0),
                borderWidth: 1,
              });

              page.drawText(multipleTables[currentTable][xx], {
                x: x + col * cellWidth + 10,
                y:
                  y +
                  row * cellHeight +
                  cellHeight -
                  24 * Number(tableGroup[i].scaleY), // Adjust text position
                size:
                  14 *
                  Math.max(
                    Number(tableGroup[1].scaleX),
                    Number(tableGroup[1].scaleY)
                  ),
                color: PDFLib.rgb(0, 0, 0),
              });
              xx++;
            }
          }
        }

        // Convert fabric canvas to high-resolution image
        const fabricDataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1, // Max quality
        });
        const pngImage = await pdfDoc.embedPng(fabricDataUrl);
      }
      fabricCanvas.clear();
      fabricCanvas.renderAll();
    }
  }
  function scalePath(path, scaleX, scaleY) {
    // Get the current path data (points)
    const originalPath = path;

    // Scale each point in the path
    const scaledPath = originalPath.map((segment) => {
      // Create a new segment with the command type preserved
      const newSegment = [segment[0]]; // First item is the command type (e.g., 'Q', 'L', etc.)

      // Scale the x and y coordinates
      for (let i = 1; i < segment.length; i += 2) {
        const x = segment[i] * scaleX; // Scale x
        const y = segment[i + 1] * scaleY; // Scale y
        newSegment.push(x, y); // Push scaled coordinates
      }

      return newSegment; // Return the new scaled segment
    });

    // Update the path with the new scaled points

    // Return the new scaled path array
    return scaledPath;
  }
  function translatePathToBoundingBox(path, coords) {
    // Assuming coords is an object with properties bl, br, tl, tr
    const { bl, br, tl, tr } = coords;

    // Calculate bounding box center
    const centerX = (bl.x + br.x) / 2; // Midpoint of bottom edge
    const centerY = (tl.y + bl.y) / 2; // Midpoint of left edge

    // Get current path data to calculate its bounding box
    const currentPath = path;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    currentPath.forEach((segment) => {
      for (let i = 1; i < segment.length; i += 2) {
        const x = segment[i];
        const y = segment[i + 1];

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    });

    // Calculate the center of the current path
    const pathCenterX = (minX + maxX) / 2;
    const pathCenterY = (minY + maxY) / 2;

    // Calculate translation needed to move path center to bounding box center
    const translateX = centerX - pathCenterX;
    const translateY = centerY - pathCenterY;

    // Translate path points
    const translatedPath = currentPath.map((segment) => {
      const newSegment = [segment[0]]; // Preserve the command type

      for (let i = 1; i < segment.length; i += 2) {
        const x = segment[i] + translateX; // Translate x
        const y = segment[i + 1] + translateY; // Translate y
        newSegment.push(x, y); // Push translated coordinates
      }

      return newSegment; // Return the new translated segment
    });

    return translatedPath; // Return the new translated path
  }
  const svgPaths = extractPathsAsSvg(fabricCanvas);

  svgPaths.forEach((svgPath, index) => {
    console.log("co ordinates", svgPath);
    const scaledArray = scalePath(
      svgPath.path.path,
      svgPath.path.scaleX,
      svgPath.path.scaleY
    );
    const translatedArray = translatePathToBoundingBox(
      scaledArray,
      svgPath.path.aCoords
    );
    const result = translatedArray
      .map((subArray) =>
        subArray
          .map((item) => (typeof item === "number" ? item.toString() : item))
          .join(" ")
      )
      .join(" ");
    console.log("selected RGB", hexToRgb(selectedColor));
    let color = hexToRgb(svgPath.path.stroke);
    page.drawSvgPath(result, {
      x: 0,
      y: height,
      borderColor: PDFLib.rgb(color.r / 255, color.g / 255, color.b / 255),
      borderWidth:
        svgPath.path.strokeWidth *
        Math.max(svgPath.path.scaleX, svgPath.path.scaleY),
    });
  });

  let circles = fabricCanvas
    .getObjects()
    .filter((obj) => obj.type === "circle");
  console.log("Circles", circles);
  circles.forEach((circle) => {
    page.drawCircle({
      x: circle.left + 100 * circle.scaleX, // X-coordinate of the center
      y: height - circle.top - 100 * circle.scaleX, // Y-coordinate of the center
      radius: 5, // Radius of the circle
      // color: PDFLib.rgb(0, 0.5, 0.5), // Optional: fill color (cyan here)
      // borderColor:  PDFLib.rgb(0, 0, 0), // Optional: border color (black here)

      borderWidth: 2, // Optional: border width
    });
  });
  const pdfinfo = JSON.parse(localStorage.getItem("pdfFullInfo"));
  const pdfBytesEdited = await pdfDoc.save();
  //     const formData = new FormData();
  //     formData.append('DrawingReferencePDFFile', new Blob([pdfBytesEdited], { type: 'application/pdf' }), 'edited.pdf');
  //   formData.append('CreatedBy',pdfinfo?.memberData?.DrawingFile[0]?.createdBy)
  //   formData.append('DrawingId', pdfinfo?.drawingId);
  //     // Send the FormData to the server
  //     const response = await fetch('https://localhost:5000/nc/files/api/nc/referencepdffile/create', {
  //         method: 'POST',
  //         credentials: 'include',
  //         body: formData
  //     });

  //     if (response.ok) {
  //         console.log('PDF sent to server successfully.');
  //         showToast();
  //         const transitionBody = {
  //             memberId : pdfinfo?.memberData?.DrawingFile[0]?.createdBy,
  //             drawingId: pdfinfo?.drawingId,
  //             stages : [
  //                 {
  //                     stageName : 'DIV-APPROVAL',
  //                     assignedMembers : JSON.parse(localStorage.getItem('members'))
  //                 }
  //             ]
  //         }
  //         const transitionResponse = await fetch('https://localhost:5000/awf/api/wf/stageresetapproval',{
  //             method : 'POST',
  //             credentials : 'include',
  //             body : JSON.stringify(transitionBody),
  //             headers: {
  //                 'Content-Type': 'application/json'  // Ensure you're telling the server you're sending JSON
  //             },
  //             // body : transitionBody,

  //             // body : 'hello there this is body'
  //         })
  //         setTimeout(() => {
  //             window.location.reload();
  //         }, 2000);
  //     } else {
  //         console.error('Error sending PDF to server:', response.statusText);
  //     }
  const pdfBlob = new Blob([pdfBytesEdited], { type: "application/pdf" });

  ///// Convert the Blob to Base64 string
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result; // Base64 encoded string of the PDF
    sessionStorage.setItem("editedPdfBase64", base64data); // Save the Base64 string in localStorage
    tableUpdatedPDf(base64data);

    delete tableGroup[currentPage];
    const activeObject = fabricCanvas.getActiveObject();
    console.log("activeObject::", activeObject);
    console.log("getAllObject::", fabricCanvas.getObjects());
    fabricCanvas.clear();
    fabricCanvas.renderAll();

    //   if (activeObject) {
    //       fabricCanvas.remove(activeObject);

    //       console.log("table Group while deleteing",JSON.stringify(tableGroup[currentPage]) === JSON.stringify(activeObject))
    //       if(JSON.stringify(tableGroup[currentPage]) === JSON.stringify(activeObject)){
    //           delete tableGroup[currentPage]
    //       }
    //   }
  };

  // Read the Blob as a Base64 string
  reader.readAsDataURL(pdfBlob);

  if (tableGroup[currentPage]) {
    // Remove the group from the canvas
    fabricCanvas.remove(tableGroup[currentPage]);

    // Clear the reference from tableGroup (optional)
    delete tableGroup[currentPage];

    // Re-render the canvas
    fabricCanvas.renderAll();

    console.log(`Table group on page ${currentPage} has been removed.`);
  } else {
    console.log(`No table group found on page ${currentPage}.`);
  }
  console.log(`Table group on page i am outside if and else has been removed.`);
  // fabricCanvas.clear(); // Clear the canvas
  // fabricCanvas.renderAll();
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("clearCanvas").click();
    fabricCanvas.clear();
    console.log("fabric objects", fabricCanvas.getObjects().length);
    loader.classList.add("hidden");
  }, 1000);
});

document.getElementById("clearCanvas").addEventListener("click", () => {
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  setTimeout(() => {
    console.log("fabric objects", fabricCanvas.getObjects().length);
    loader.classList.add("hidden");
  }, 1000);
  fabricCanvas.clear(); // Clear the canvas
});

const canvasContainer = document.getElementById("canvasContainer");

document.getElementById("drawCanvas").addEventListener("click", function () {
  if (
    canvasContainer.style.display === "none" ||
    canvasContainer.style.display === ""
  ) {
    canvasContainer.style.display = "block"; // Show the div

    drawCanvas.clear();
  } else {
    const paths = drawCanvas.getObjects("path"); // Get all paths from the source canvas

    paths.forEach((path) => {
      // Clone each path and add it to the target canvas
      path.clone(function (clonedPath) {
        fabricCanvas.add(clonedPath);
        fabricCanvas.renderAll(); // Re-render the target canvas
      });
    });
    canvasContainer.style.display = "none"; // Hide the div
  }
  drawCanvas.isDrawingMode = !drawCanvas.isDrawingMode;
  this.innerText = drawCanvas.isDrawingMode
    ? "Disable Free Drawing"
    : "Enable Free Drawing";
});

document.getElementById("zoomIn").addEventListener("click", () => {
  let scaleWidth = 1;
  pdfDoc.getPage(currentPage).then((page) => {
    const viewport = page.getViewport({ scale: zoomLevel });
    const canvas = document.getElementById("pdf-canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    originalWidth = viewport.width;
    originalHeight = viewport.height;
    console.log(
      "the scalewidth",
      scaleWidth,
      1920 / (viewport.width * 1.3),
      1080 / viewport.height
    );
    zoomLevel *= Number(1920 / (viewport.width * 1.3));
    fabricCanvas.setZoom(zoomLevel);

    loadPage(currentPage);
    loader.classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("clearCanvas").click();
      fabricCanvas.clear();
      console.log("fabric objects", fabricCanvas.getObjects().length);
      loader.classList.add("hidden");
    }, 1000);
    console.log("PDF Width:", viewport.width, "PDF Height:", viewport.height);
  });
});
document.getElementById("zoomOut").addEventListener("click", () => {
  zoomLevel *= 0.9;
  fabricCanvas.setZoom(zoomLevel);
  loadPage(currentPage);
});
// When 'Done' is clicked, you can implement some logic here
doneButton.addEventListener("click", () => {
  alert("Done working with the canvas!");
  // Add any additional logic for 'Done'
});

// When 'Close' is clicked, hide the canvas container
closeButton.addEventListener("click", () => {
  canvasContainer.style.display = "none"; // Hide the div
});

function updatePathProperties(selectedColor, selectedThickness) {
  const paths = drawCanvas.getObjects("path");
  paths.forEach((p) => {
    p.set("stroke", selectedColor); // Change stroke color
    p.set("strokeWidth", selectedThickness); // Change stroke thickness
  });
  drawCanvas.renderAll(); // Re-render the canvas
}

document.getElementById("colorPicker").addEventListener("input", (event) => {
  const selectedColor = event.target.value; // Get the selected color
  const selectedThickness = document.getElementById("thicknessInput").value; // Get the thickness
  updatePathProperties(selectedColor, selectedThickness); // Update paths
});

// Event listener for thickness input change
document.getElementById("thicknessInput").addEventListener("input", (event) => {
  const selectedThickness = event.target.value; // Get the selected thickness
  const selectedColor = document.getElementById("colorPicker").value; // Get the color
  updatePathProperties(selectedColor, selectedThickness); // Update paths
});

function updateTextProperties(selectedColor, selectedFont) {
  const texts = fabricCanvas.getObjects("text");
  texts.forEach((t) => {
    t.set("fill", selectedColor); // Change text color
    t.set("fontFamily", selectedFont); // Change font family
  });
  fabricCanvas.renderAll(); // Re-render the canvas
}
document
  .getElementById("fontStyleInput")
  .addEventListener("change", (event) => {
    const selectedFont = event.target.value;
    const selectedColor = document.getElementById("textColorPicker").value;
    updateTextProperties(selectedColor, selectedFont);
  });

// Event listener for text color input change
document
  .getElementById("textColorPicker")
  .addEventListener("input", (event) => {
    const selectedColor = event.target.value;
    const selectedFont = document.getElementById("fontStyleInput").value;
    updateTextProperties(selectedColor, selectedFont);
  });
