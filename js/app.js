document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const gallery = document.getElementById('gallery');
    const creditInput = document.getElementById('credit');
    const saveMetadataBtn = document.getElementById('saveMetadataBtn');

    let files = [];

    // Prevent default drag/drop behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drag area
    function highlight() {
        dropArea.classList.add('highlight');
    }

    // Unhighlight drag area
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    // Handle file drop
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        console.log('Dropped files:', droppedFiles);
        // You can plug in your file handling logic here
    }

    // Attach drag/drop events to a given area
    function bindDragDropEvents(area) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, highlight, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, unhighlight, false);
        });
        area.addEventListener('drop', handleDrop, false);
    }

    // Bind events to initial drop area
    bindDragDropEvents(dropArea);

    // Save EXIF metadata — always writes Artist tag whether empty or filled
    saveMetadataBtn.addEventListener('click', function() {
        const credit = creditInput.value.trim();
        let exifObj = { "0th": {} };

        // Always write the Artist tag — even if blank
        exifObj["0th"][piexif.ImageIFD.Artist] = credit;

        console.log('Saving EXIF Artist:', credit);

        // Optional: create exifBytes and apply to image dataURL here
        // let exifBytes = piexif.dump(exifObj);
        // let newDataUrl = piexif.insert(exifBytes, originalDataUrl);
        // etc.
    });

    // File input handler
    fileInput.addEventListener('change', function(e) {
        console.log('Files selected:', this.files);
        // You can plug in your file loading logic here
    });
});
