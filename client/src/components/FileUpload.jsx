import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  X, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music,
  Archive,
  Check,
  AlertCircle
} from 'lucide-react';
import { fileAPI } from '../services/api';
import toast from 'react-hot-toast';

const FileUpload = ({ onFileShared, roomId }) => {
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [sharedFiles, setSharedFiles] = useState([]);

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    if (type.includes('zip') || type.includes('compressed')) return Archive;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        toast.error(`${rejection.file.name}: ${rejection.errors[0].message}`);
      });
    }

    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/zip': ['.zip'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  // Upload file
  const uploadFile = async (fileItem) => {
    try {
      setUploadingFiles(prev => new Set(prev).add(fileItem.id));
      
      const formData = new FormData();
      formData.append('file', fileItem.file);

      const response = await fileAPI.uploadFile(formData);
      
      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploaded', uploadedFile: response.data.file }
          : f
      ));

      // Share file with room
      if (onFileShared && roomId) {
        onFileShared({
          ...response.data.file,
          roomId
        });
      }

      toast.success(`${fileItem.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'error', error: error.response?.data?.error || 'Upload failed' }
          : f
      ));
      toast.error(`Failed to upload ${fileItem.name}`);
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileItem.id);
        return newSet;
      });
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Download file
  const downloadFile = async (file) => {
    try {
      const response = await fileAPI.downloadFile(file.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${file.name}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 ${
          isDragActive ? 'text-primary-500' : 'text-secondary-400'
        }`} />
        <p className="text-lg font-medium text-secondary-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
        </p>
        <p className="text-sm text-secondary-600">
          Supports images, documents, audio, video, and more. Max 50MB per file.
        </p>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-medium text-secondary-900">Files to Upload</h4>
            {files.map((fileItem) => {
              const FileIcon = getFileIcon(fileItem.type);
              const isUploading = uploadingFiles.has(fileItem.id);
              
              return (
                <motion.div
                  key={fileItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-secondary-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      fileItem.status === 'uploaded' 
                        ? 'bg-green-100' 
                        : fileItem.status === 'error'
                        ? 'bg-red-100'
                        : 'bg-secondary-100'
                    }`}>
                      {fileItem.status === 'uploaded' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : fileItem.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <FileIcon className={`h-5 w-5 ${
                          isUploading ? 'text-primary-600' : 'text-secondary-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">
                        {fileItem.name}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatFileSize(fileItem.size)}
                        {fileItem.status === 'error' && (
                          <span className="text-red-500 ml-2">
                            • {fileItem.error}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {fileItem.status === 'pending' && (
                      <button
                        onClick={() => uploadFile(fileItem)}
                        disabled={isUploading}
                        className="btn-primary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                    
                    {fileItem.status === 'uploaded' && fileItem.uploadedFile && (
                      <button
                        onClick={() => downloadFile(fileItem.uploadedFile)}
                        className="p-1 text-secondary-600 hover:text-primary-600 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-1 text-secondary-600 hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Upload All Button */}
            {files.some(f => f.status === 'pending') && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  files
                    .filter(f => f.status === 'pending')
                    .forEach(uploadFile);
                }}
                className="w-full btn-primary py-2"
              >
                Upload All Files
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;