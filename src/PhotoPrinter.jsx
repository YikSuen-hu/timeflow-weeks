import React, { useState } from 'react';
import { Upload, X, Printer, Image as ImageIcon } from 'lucide-react';

const PhotoPrinter = ({ onBack }) => {
    const [images, setImages] = useState([]);

    const handleFileUpload = (e, size) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            size: size
        }));
        setImages(prev => [...prev, ...newImages]);
        // Reset input to allow re-uploading same file
        e.target.value = '';
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 transition-colors">

            {/* Print Styles for this component */}
            <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm; 
          }
          body * {
            visibility: hidden;
          }
          .photo-print-area, .photo-print-area * {
            visibility: visible;
          }
          .photo-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm !important; /* A4 width 210mm - 20mm margin */
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            {/* Header (No Print) */}
            <div className="no-print max-w-5xl mx-auto mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-slate-600 dark:text-slate-300"
                    >
                        ← Back to TimeFlow
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ImageIcon className="text-pink-500" />
                        Photo Sticker Printer
                    </h1>
                </div>
                <div className="flex gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 font-bold transition-all active:scale-95">
                        <Upload size={18} />
                        Upload 24mm
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 24)} />
                    </label>
                    <label className="cursor-pointer px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg shadow-pink-500/30 flex items-center gap-2 font-bold transition-all active:scale-95">
                        <Upload size={18} />
                        Upload 20mm
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 20)} />
                    </label>
                    <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-lg border border-transparent hover:bg-slate-700 dark:hover:bg-slate-200 flex items-center gap-2 font-bold transition-all active:scale-95"
                    >
                        <Printer size={18} />
                        Print A4
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-2xl min-h-[297mm] p-[10mm] relative">
                {images.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                        <Upload size={64} className="mb-4 opacity-50" />
                        <p className="text-lg">Upload images to fill the grid</p>
                        <p className="text-sm mt-2">Target size: 24mm x 24mm</p>
                    </div>
                ) : null}

                {/* The Grid - Now Flexbox for mixed sizes */}
                <div className="photo-print-area flex flex-wrap content-start" style={{
                    width: '100%',
                }}>
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="relative group border-[0.25px] border-slate-200 overflow-hidden bg-gray-100" // 0.25px thin border
                            style={{
                                width: `${img.size}mm`,
                                height: `${img.size}mm`,
                                margin: 0
                            }}
                        >
                            <img
                                src={img.url}
                                alt={`Print ${img.size}mm`}
                                className="w-full h-full object-cover"
                            />
                            {/* Delete Overlay (No Print) */}
                            <button
                                onClick={() => removeImage(img.id)}
                                className="no-print absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                            >
                                <X size={16} />
                            </button>
                            <div className="no-print absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                {img.size}mm
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="no-print text-center text-slate-400 mt-8 text-sm">
                Tips: Use A4 paper, "100% Scale", "No Margins" (or minimal margins) for best fit.
            </div>
        </div>
    );
};

export default PhotoPrinter;
