import React, { useRef, useState, useEffect } from 'react';

function App() {
  const ref = useRef(null);
  const [isPdf, setIsPdf] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const element = ref?.current;

    if (element) {
      element.addEventListener('change', () => {
        setIsPdf(false);
        setPreviewUrl('');
        setRawResponse('');
        setTableData([]);

        const file = element.files[0];

        if (file) {
          const reader = new FileReader();

          reader.onloadend = (event) => {
            setPreviewUrl(event.target.result);
            setIsPdf(event.target.result.includes('application/pdf'));
          };

          reader.readAsDataURL(file);
        }
      })
    }    
  });

  const [pendingUrl, setPendingUrl] = useState('');

  function onSendImageClick() {
    const [mimeType, base64] = previewUrl.split(',');
    setPendingUrl(previewUrl);

    if (base64) {
      if(mimeType.includes('pdf')) {        
        processInvoice(base64);
      }
      else {        
        processReceipt(base64);
      }
    }
  }

  function processInvoice(value) {
    fetch('/api/processInvoice', {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({dataUrl: value})
    })
    .then(response => response.json())
    .then(json => processInvoiceResults(json.result))
    .catch(() => {
      setPendingUrl('');
      setRawResponse('Failed to read PDF!');
    });    
  }

  function processInvoiceResults(json) {
    setPendingUrl('');

    if (json.status !== "succeeded") {      
      setRawResponse('Failed to process image!');
      return;
    }

    const tableData = [];

    for(let documentIndex = 0; documentIndex < json.analyzeResult.documents.length; documentIndex++) {
      const document = json.analyzeResult.documents[documentIndex];
      const {fields} = document;

      tableData.push(
        ['RECIPIENT'],        
        [(fields?.CustomerAddressRecipient?.valueString || '')],
        [(fields?.CustomerAddress?.valueAddress?.road || '') + ' ' + (fields?.CustomerAddress?.valueAddress?.houseNumber || '')],
        [(fields?.CustomerAddress?.valueAddress?.postalCode || '') + ' ' + (fields?.CustomerAddress?.valueAddress?.city || '')],
        [''],
        ['DELIVERY ADDRESS'],        
        [(fields?.ShippingAddressRecipient?.valueString || '')],
        [(fields?.ShippingAddress?.valueAddress?.road || '') + ' ' + (fields?.ShippingAddress?.valueAddress?.houseNumber || '')],
        [(fields?.ShippingAddress?.valueAddress?.postalCode || '') + ' ' + (fields?.ShippingAddress?.valueAddress?.city || '')],
        [''],
        ['INVOICE INFORMATION'],  
        [''],
        ['BusinessID:', fields?.CustomerTaxId?.valueString || ''],
        ['InvoiceID:', fields?.InvoiceId?.valueString || ''],
        ['InvoiceDate:', fields?.InvoiceDate?.valueDate || ''],
        ['DueDate:', fields?.DueDate?.valueDate || ''],        
        [''],
        ['PRODUCTS'],
        ['Description', 'Quantity', 'Unit', 'Unit price', 'VAT-%', 'VAT Total'],
        ...(fields?.Items?.valueArray || [])?.map(({ valueObject }) => [
          (valueObject?.Description?.valueString || ''),          
          (valueObject?.Quantity?.valueNumber || ''),
          (valueObject?.Unit?.valueString || ''),
          (valueObject?.UnitPrice?.valueCurrency?.amount || ''),
          (valueObject?.TaxRate?.valueString || ''),
          (valueObject?.Amount?.valueCurrency?.amount || '') + ' ' + (valueObject?.Amount?.valueCurrency?.currencyCode || ''),
        ]),
        [''],
        ['Sub total:', (fields?.SubTotal?.valueCurrency?.amount || '') + ' ' + (fields?.SubTotal?.valueCurrency?.currencyCode || '')],
        ['Total tax:', (fields?.TotalTax?.valueCurrency?.amount || '') + ' ' + (fields?.TotalTax?.valueCurrency?.currencyCode || '')],
        ['Total:', (fields?.InvoiceTotal?.valueCurrency?.amount || '') + ' ' + (fields?.InvoiceTotal?.valueCurrency?.currencyCode || '')],
        [''],
        ['PAYMENT DETAILS'],
        [''],
        ['IBAN', 'SWIFT'],
        ...(fields?.PaymentDetails?.valueArray || [])?.map(({ valueObject }) => [
          (valueObject?.IBAN?.valueString || ''), 
          (valueObject?.SWIFT?.valueString || '')
        ])
      )
    }

    setTableData(tableData);
  }

  function processReceipt(value) {
    fetch('/api/processReceipt', {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({dataUrl: value})
    })
    .then(response => response.json())
    .then(json => processReceiptResults(json.result))
    .catch(() => {
      setPendingUrl('');
      setRawResponse('Failed to read image!');
    });    
  }

  function processReceiptResults(json) {
    setPendingUrl('');

    if (json.status !== "succeeded") {      
      setRawResponse('Failed to process image!');
      return;
    }

    const tableData = [];

    for(let documentIndex = 0; documentIndex < json.analyzeResult.documents.length; documentIndex++) {
      const document = json.analyzeResult.documents[documentIndex];
      const {fields: {Items, MerchantName, MerchantPhoneNumber, ReceiptType, Total, TransactionDate, TransactionTime, TaxDetails}} = document;

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
        tableData.push(...Items.valueArray.map(({ valueObject }) => [
          valueObject?.Description?.valueString, 
          (valueObject?.TotalPrice?.valueCurrency?.amount || '') + ' ' + (valueObject?.TotalPrice?.valueCurrency?.currencyCode || '')
        ]))
      }

      if (Total) {
        tableData.push(['Total', (Total?.valueCurrency?.amount || '') + ' ' + (Total?.valueCurrency?.currencyCode || '')])
      }

      if (TaxDetails) {
        tableData.push(
          [''],
          ['VAT details'],
          [''],
          ['Description', 'Rate', 'Amount', 'NetAmount'],
          ...TaxDetails.valueArray.map(({ valueObject }) => [
            valueObject?.Description?.valueString || '',
            valueObject?.Rate?.content || '',
            (valueObject?.Amount?.valueCurrency?.amount || '') + ' ' + (valueObject?.Amount?.valueCurrency?.currencyCode || ''),
            (valueObject?.NetAmount?.valueCurrency?.amount || '') + ' ' + (valueObject?.NetAmount?.valueCurrency?.currencyCode || '')
          ])
        );
      }
    }

    setTableData(tableData);
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      <input ref={ref} type="file" name="file" accept='image/*,application/pdf' style={{marginBottom: '20px'}} />
      {
        previewUrl ?
          <div>            
            {!isPdf ? <img src={previewUrl} style={{ display: 'block', height: '200px' }} alt="Preview" /> : null}
            <button 
              disabled={pendingUrl === previewUrl} 
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
            {tableData.map(row => 
              <tr>
                {row.map((column) => 
                  <td style={{padding: '2px 5px'}}>{column}</td>
                )}
              </tr>
            )}
          </tbody>
        </table> :
        null
      }

      <div className='response'>{rawResponse}</div>
    </div>
  );
}

export default App;