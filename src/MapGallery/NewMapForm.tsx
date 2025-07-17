// src/MapGallery/NewMapForm.tsx
import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { saveMap } from "../idbService";
import { useAuth } from "../auth/AuthContext";
import "./NewMapForm.css";

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

export const NewMapForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [isPublic, setIsPublic] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    const file = fileRef.current?.files?.[0];
    const name = nameRef.current?.value.trim();
    const description = descRef.current?.value.trim() || undefined;
    if (!file) return alert("Pick an image file");
    if (!name) return alert("Give your map a name");
    if (!user) return alert("You must be logged in to save maps");
    
    const id = uuidv4();
    await saveMap(id, file, name, description, [], user.id, isPublic);
    onSaved();
  };

  return (
    <div className="mg-form-overlay">
      <div className="mg-form">
        <h2>New Map</h2>
        <label>
          Image: <input ref={fileRef} type="file" accept="image/*" />
        </label>
        <label>
          Name: <input ref={nameRef} type="text" />
        </label>
        <label>
          Description:
          <textarea ref={descRef} rows={3} />
        </label>
        <label className="mg-form-checkbox">
          <input 
            type="checkbox" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span className="mg-checkbox-label">Make this map public (visible to all users)</span>
        </label>
        <div className="mg-form-buttons">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};
