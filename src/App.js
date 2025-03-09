import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    const {text} = fetch(`/api/processImage`);
    setData(text);
  });

  return <div>{data}</div>;
}

export default App;