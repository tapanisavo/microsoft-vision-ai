import React, { useRef, useState, useEffect } from 'react';

function App() {
  const ref = useRef(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const element = ref?.current;

    if (element) {
      element.addEventListener('change', () => {
        setPreviewImageUrl('');
        setRawResponse('');
        setTableData([]);

        const file = element.files[0];

        if (file) {
          const reader = new FileReader();

          reader.onloadend = (event) => {
            setPreviewImageUrl(event.target.result);
          };

          reader.readAsDataURL(file);
        }
      })
    }    
  });

  const [pendingImageUrl, setPendingImageUrl] = useState('');

  function onSendImageClick() {
    const base64 = previewImageUrl.split(',')[1];

    if (base64) {
      setPendingImageUrl(previewImageUrl);
      processImage(base64);
    }
  }

  function processImage(value) {
    fetch('/api/processImage', {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({imageUrl: value})
    })
    .then(response => response.json())
    .then(json => processResults(json.result))
    .catch((error) => {
      console.log(error);
      setPendingImageUrl('');
      setRawResponse('Failed to read image!');
    });    
  }

  function processResults(json) {
    setPendingImageUrl('');

    if (json.status !== "succeeded") {      
      setRawResponse('Failed to process image!');
      return;
    }

    const tableData = [];

    for(let documentIndex = 0; documentIndex < json.analyzeResult.documents.length; documentIndex++) {
      const document = json.analyzeResult.documents[documentIndex];
      const {fields: {Items, MerchantName, MerchantPhoneNumber, ReceiptType, Total, TransactionDate, TransactionTime}} = document;

      if (ReceiptType) {
        tableData.push(['Receipt type: ', ReceiptType.valueString])
      }

      if (TransactionDate && TransactionTime) {
        tableData.push(['Purchase date: ', TransactionDate.valueDate + ' ' + TransactionTime.valueTime])
      }

      if (MerchantName) {
        tableData.push(['Merchant: ', MerchantName.valueString + (MerchantPhoneNumber ? ` (${MerchantPhoneNumber.valuePhoneNumber})` : '')])
      }

      tableData.push(['Items:'])

      if (Items) {
        tableData.push(...Items.valueArray.map(({ valueObject }) => 
          [valueObject.Description.valueString, valueObject.TotalPrice.valueCurrency.amount + ' ' + valueObject.TotalPrice.valueCurrency.currencyCode])
        )
      }

      if (Total) {
        tableData.push(['Total', Total.valueCurrency.amount + ' ' + Total.valueCurrency.currencyCode])
      }
    }

    setTableData(tableData);
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      <input ref={ref} type="file" name="file" accept='image/*' style={{marginBottom: '20px'}} />
      {
        previewImageUrl ?
          <div>            
            <img src={previewImageUrl} style={{ display: 'block', height: '200px' }} alt="Preview" />
            <button 
              disabled={pendingImageUrl === previewImageUrl} 
              style={{display: 'block', margin: '20px 0', padding: '10px', width:'150px'}}
              onClick={onSendImageClick.bind(this)}
            >Send</button>
          </div> :
          null
      }
      
      {
        tableData.length ?
        <table>
          <tbody>
            {tableData.map(row => <tr>{row.map((column) => <td>{column}</td>)}</tr>)}
          </tbody>
        </table> :
        null
      }

      <div className='response'>{rawResponse}</div>
    </div>
  );
}

export default App;