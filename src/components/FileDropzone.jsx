import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon } from 'lucide-react';

export default function FileDropzone({ onFileDrop, file, accept, dropText, isSquare = false, previewUrl }) {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      onFileDrop(acceptedFiles[0]);
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept,
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-white/20 bg-white/5 hover:bg-white/10'
      } ${isSquare ? 'aspect-square w-32 rounded-2xl' : 'w-full py-8 text-center'}`}
    >
      <input {...getInputProps()} />
      
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className={`object-cover ${isSquare ? 'w-full h-full rounded-2xl' : 'h-32 rounded-lg'}`} />
      ) : file ? (
        <div className="flex flex-col items-center text-brand-primary">
          <FileIcon size={32} className="mb-2" />
          <span className="text-sm font-medium">{file.name}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-secondary">
          <UploadCloud size={isSquare ? 24 : 32} className="mb-2 text-white/50" />
          <span className={`text-sm ${isSquare ? 'text-center px-4' : ''}`}>{dropText || 'Drag & drop a file here, or click to select'}</span>
        </div>
      )}
    </div>
  );
}
