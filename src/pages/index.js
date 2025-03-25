import React, { useRef, useState } from 'react';

import PDFComponent from '../components/PDFComponentModified';
import FabricCanvas from '@/components/FabricCanvas';
import PDFWithFabric from '@/components/PDFWithFabric';


const multiselectValues = [
    { name: 'Employee 001', code: 'AU' },
    { name: 'Employee 002', code: 'BR' },
    { name: 'Employee 003', code: 'CN' },
    { name: 'Employee 004', code: 'EG' },
    { name: 'Employee 005', code: 'FR' },
    { name: 'Employee 006', code: 'DE' },

];


const itemTemplate = (option) => {
    return (
        <div className="flex align-items-center ">
            {/* <span className={`mr-2 flag flag-${option.code.toLowerCase()}`} style={{ width: '18px', height: '12px' }} /> */}
            <span>{option.name}</span>
        </div>
    );
};

const FileDemo = () => {
  
    // const [multiselectValue, setMultiselectValue] = useState(null);
    const [b, setB] = useState(true)
    const [pdf, setPDF] = useState(true)

    return (
        <div className="grid">

            {!pdf && <div className="col-12">
                <div className="card">


                    <br />
                    {/* <MultiSelect value={multiselectValue} onChange={(e) => setMultiselectValue(e.value)} options={multiselectValues} optionLabel="name" placeholder="Select Employees" filter display="comma" itemTemplate={itemTemplate}
                         className=''
                         
                         /> */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button disabled={b} onClick={() => setPDF(true)} >
                            <a target="_blank" style={{ color: 'white' }} >
                                Add Signature Table
                            </a>
                            {/* <Link href="http://10.244.3.93:5173" style={{ color: "white" }} scroll={false}>
                                Add Signature Table
                            </Link> */}

                        </button>
                    </div>

                </div>

            </div>}
              <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Allow clicks to pass through to the PDF
        }}
      >
        <FabricCanvas />
      </div>
      {pdf && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <PDFWithFabric />
        </div>
      )}

     
    </div>
        </div>
    );
};

export default FileDemo;
