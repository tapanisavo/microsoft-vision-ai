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
          };

          reader.readAsDataURL(file);
        }
        else {
          setPreviewImageUrl('');
        }
      })
    }    
  }, [setPreviewImageUrl]);

  return (
    <div>
      <input ref={ref} type="file" name="file" accept='image/*' />
      {
        previewImageUrl ?
        <img src={previewImageUrl} style={{ display: 'block', height: '200px' }} alt="Preview" /> :
        null
      }
    </div>
  );
}

export default App;