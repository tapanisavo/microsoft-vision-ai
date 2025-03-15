import React, { useRef, useState, useEffect } from 'react';

function App() {
  const ref = useRef(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');  

  useEffect(() => {
    const element = ref?.current;

    if (element) {
      element.addEventListener('change', () => {
        const file = element.files[0];

        if (file) {
          const reader = new FileReader();

          reader.onloadend = (event) => {
            setPreviewImageUrl(event.target.result);
            processImage(event.target.result);
          };

          reader.readAsDataURL(file);
        }
        else {
          setPreviewImageUrl('');
        }
      })
    }    
  }, [setPreviewImageUrl]);

  const [imageContents, setImageContents] = useState('')

  function processImage(value) {
    fetch('/api/processImage', {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: {imageUrl: value}
    })
    .then(response => response.json())
    .then(json => setImageContents(json.text))
    .catch(() => setImageContents('Failed to read image!'));    
  }

  return (
    <div>
      <input ref={ref} type="file" name="file" accept='image/*' />
      {
        previewImageUrl ?
          <img src={previewImageUrl} style={{ display: 'block', height: '200px' }} alt="Preview" /> :
          null
      }

      <div className='response'>{imageContents}</div>
    </div>
  );
}

export default App;