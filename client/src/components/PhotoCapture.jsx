import React, { useState } from 'react';

export default function PhotoCapture({ onChange }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    onChange(null);
  };

  return (
    <div className="photo-capture">
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="photo-capture__preview" />
          <button className="photo-capture__remove" onClick={handleRemove}>
            Remove
          </button>
        </>
      ) : (
        <>
          <div>Tap to take photo or upload</div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFileChange}
            aria-label="Take photo or upload"
          />
        </>
      )}
    </div>
  );
}
