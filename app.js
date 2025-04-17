document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const gallery = document.getElementById('gallery');
    const dropArea = document.getElementById('dropArea');
    const metadataPanel = document.getElementById('metadataPanel');
    const noSelectionMessage = document.getElementById('noSelectionMessage');
    const metadataContent = document.getElementById('metadataContent');
    const previewImage = document.getElementById('previewImage');
    const filenameEl = document.getElementById('filename');
    const fileInfoEl = document.getElementById('fileInfo');
    const descriptionInput = document.getElementById('description');
    const creditInput = document.getElementById('credit');
    const saveMetadataBtn = document.getElementById('saveMetadataBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const saveAllBtn = document.getElementById('saveAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const removeAllBtn = document.getElementById('removeAllBtn');
    const selectedCountEl = document.getElementById('selectedCount');
    const recentCreditsDropdown = document.getElementById('recentCredits');
    
    // State
    let files = [];
    let selectedFiles = new Set();
    let currentlySelectedFile = null;
    let editedFiles = new Set(); // Track which files have been edited
    let recentCredits = []; // Array to store recently used credits
    
    // Initialize from localStorage if available
    try {
        const storedCredits = localStorage.getItem('recentPhotoCredits');
        if (storedCredits) {
            recentCredits = JSON.parse(storedCredits);
            updateRecentCreditsDropdown();
        }
    } catch (e) {
        console.error('Error loading recent credits:', e);
    }
    
    // Initialize drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        
        // Check if the browser supports directory reading
        if (dt.items && dt.items.length > 0) {
            const items = dt.items;
            let filePromises = [];
            
            // Function to process files and directories recursively
            async function traverseFileTree(item, path = "") {
                if (item.isFile) {
                    return new Promise(resolve => {
                        item.file(file => {
                            // Set webkitRelativePath-like property for consistency
                            if (path) {
                                file.relativePath = path + file.name;
                            }
                            resolve(file);
                        });
                    });
                } else if (item.isDirectory) {
                    // Get folder contents
                    const dirReader = item.createReader();
                    const entries = await new Promise(resolve => {
                        const entriesArr = [];
                        function readEntries() {
                            dirReader.readEntries(async (entries) => {
                                if (entries.length === 0) {
                                    resolve(entriesArr);
                                } else {
                                    entriesArr.push(...entries);
                                    readEntries(); // Continue reading if more entries exist
                                }
                            }, error => console.error("Error reading directory:", error));
                        }
                        readEntries();
                    });
                    
                    // Process each entry recursively
                    const promises = entries.map(entry => 
                        traverseFileTree(entry, path + item.name + "/")
                    );
                    return Promise.all(promises).then(fileArrays => 
                        fileArrays.flat()
                    );
                }
            }
            
            // Process each dropped item
            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry ? 
                             items[i].webkitGetAsEntry() : 
                             items[i].getAsEntry();
                
                if (item) {
                    filePromises.push(traverseFileTree(item));
                }
            }
            
            // Wait for all files to be processed
            Promise.all(filePromises)
                .then(fileArrays => {
                    const allFiles = fileArrays.flat().filter(file => file !== undefined);
                    // Filter for image types (JPG, PNG, TIFF)
                    const imageFiles = allFiles.filter(file => {
                        const extension = file.name.toLowerCase().split('.').pop();
                        return ['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(extension) ||
                               file.type.startsWith('image/');
                    });
                    
                    if (imageFiles.length > 0) {
                        handleFiles(imageFiles);
                        showStatus(`Loaded ${imageFiles.length} images${allFiles.length > imageFiles.length ? ' (skipped ' + (allFiles.length - imageFiles.length) + ' non-image files)' : ''}`, 'success');
                    } else if (allFiles.length > 0) {
                        showStatus('No supported image files found', 'warning');
                    }
                })
                .catch(error => {
                    console.error('Error processing dropped items:', error);
                    showStatus('Error processing dropped items', 'error');
                });
        } else {
            // Fallback for browsers that don't support directory entries
            const droppedFiles = dt.files;
            
            if (droppedFiles.length > 0) {
                // Filter for image types
                const imageFiles = Array.from(droppedFiles).filter(file => {
                    const extension = file.name.toLowerCase().split('.').pop();
                    return ['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(extension) ||
                           file.type.startsWith('image/');
                });
                
                if (imageFiles.length > 0) {
                    handleFiles(imageFiles);
                    showStatus(`Loaded ${imageFiles.length} images${droppedFiles.length > imageFiles.length ? ' (skipped ' + (droppedFiles.length - imageFiles.length) + ' non-image files)' : ''}`, 'success');
                } else {
                    showStatus('No supported image files found', 'warning');
                }
            }
        }
    }
    
    // File Input handling
    fileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            // Filter for image types
            const imageFiles = Array.from(this.files).filter(file => {
                const extension = file.name.toLowerCase().split('.').pop();
                return ['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(extension) ||
                       file.type.startsWith('image/');
            });
            
            if (imageFiles.length > 0) {
                handleFiles(imageFiles);
                if (this.files.length > imageFiles.length) {
                    showStatus(`Loaded ${imageFiles.length} images (skipped ${this.files.length - imageFiles.length} non-image files)`, 'success');
                } else {
                    showStatus(`Loaded ${imageFiles.length} images`, 'success');
                }
            } else {
                showStatus('No supported image files found', 'warning');
            }
        }
    });
    
    function handleFiles(fileList) {
        // If this is a new upload
        if (gallery.querySelector('.drag-area') === null) {
            // Add persistent drag area back to gallery
            gallery.innerHTML = '';
            
            // Create and add the drag area
            const dragArea = document.createElement('div');
            dragArea.id = 'dropArea';
            dragArea.className = 'drag-area';
            dragArea.innerHTML = `
                Drop photos or folders here to add them to the gallery<br>
                <small>(Supported formats: JPG, PNG, TIFF)</small>
            `;
            
            // Initialize the drag and drop events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dragArea.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dragArea.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dragArea.addEventListener(eventName, unhighlight, false);
            });
            
            dragArea.addEventListener('drop', handleDrop, false);
            
            // Add to gallery
            gallery.appendChild(dragArea);
        }
        
        // Add new files to our file collection
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.type.startsWith('image/')) {
                addFileToGallery(file);
            }
        }
        
        updateSelectedCount();
        updateButtonStates();
    }
    
    function addFileToGallery(file) {
        const fileIndex = files.length;
        files.push({
            file: file,
            metadata: {
                description: '',
                credit: ''
            },
            dataUrl: null, // Will store the data URL once processed
            editedDataUrl: null, // Will store edited version
            edited: false
        });
        
        // Create thumbnail
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';
        thumbnailContainer.dataset.index = fileIndex;
        
        const thumbnail = document.createElement('img');
        thumbnail.className = 'thumbnail';
        thumbnail.alt = file.name;
        
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading';
        loadingIndicator.textContent = 'Loading...';
        thumbnailContainer.appendChild(loadingIndicator);
        
        // Load thumbnail image
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store the data URL
            files[fileIndex].dataUrl = e.target.result;
            
            // Create thumbnail
            thumbnail.src = e.target.result;
            thumbnailContainer.appendChild(thumbnail);
            
            // If this is a JPEG, try to read metadata
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                try {
                    const exifObj = piexif.load(e.target.result);
                    
                    // Check for description in Exif
                    if (exifObj["0th"] && exifObj["0th"][piexif.ImageIFD.ImageDescription]) {
                        files[fileIndex].metadata.description = piexif.helper.bytesToString(exifObj["0th"][piexif.ImageIFD.ImageDescription]);
                    }
                    
                    // Check for artist/credit in Exif
                    if (exifObj["0th"] && exifObj["0th"][piexif.ImageIFD.Artist]) {
                        files[fileIndex].metadata.credit = piexif.helper.bytesToString(exifObj["0th"][piexif.ImageIFD.Artist]);
                    }
                } catch (error) {
                    console.error('Error reading EXIF data:', error);
                }
            }
            
            // Remove loading indicator
            thumbnailContainer.removeChild(loadingIndicator);
            
            // Add filename label
            const fileNameElement = document.createElement('div');
            fileNameElement.className = 'file-name';
            fileNameElement.textContent = file.name;
            thumbnailContainer.appendChild(fileNameElement);
        };
        reader.readAsDataURL(file);
        
        // Add click event to select thumbnail
        thumbnailContainer.addEventListener('click', function(e) {
            const index = parseInt(this.dataset.index);
            toggleSelection(index, e.ctrlKey || e.metaKey);
        });
        
        gallery.appendChild(thumbnailContainer);
    }
    
    function toggleSelection(index, multiSelect) {
        const fileData = files[index];
        if (!fileData) return;
        
        // Get all thumbnail containers
        const thumbnailContainers = document.querySelectorAll('.thumbnail-container');
        const clickedContainer = thumbnailContainers[index];
        
        if (!multiSelect) {
            // Clear previous selections if not multi-selecting
            thumbnailContainers.forEach(container => {
                container.classList.remove('selected');
            });
            selectedFiles.clear();
            
            // Select the clicked item
            clickedContainer.classList.add('selected');
            selectedFiles.add(index);
            currentlySelectedFile = index;
            
            // Update metadata panel with this file's data
            updateMetadataPanel(index);
        } else {
            // Toggle selection for this item
            if (selectedFiles.has(index)) {
                clickedContainer.classList.remove('selected');
                selectedFiles.delete(index);
                
                // If this was the current file, clear the panel
                if (currentlySelectedFile === index) {
                    currentlySelectedFile = null;
                    hideMetadataPanel();
                }
            } else {
                clickedContainer.classList.add('selected');
                selectedFiles.add(index);
                currentlySelectedFile = index;
                
                // Update metadata panel with this file's data
                updateMetadataPanel(index);
            }
        }
        
        updateSelectedCount();
        updateButtonStates();
    }
    
    function updateMetadataPanel(fileIndex) {
        const fileData = files[fileIndex];
        if (!fileData) return;
        
        // Show metadata content, hide no selection message
        noSelectionMessage.style.display = 'none';
        metadataContent.style.display = 'block';
        
        // Update preview
        previewImage.src = fileData.editedDataUrl || fileData.dataUrl;
        filenameEl.textContent = fileData.file.name;
        
        // Update file info
        const lastModified = new Date(fileData.file.lastModified);
        const fileSizeMB = (fileData.file.size / (1024 * 1024)).toFixed(2);
        
        fileInfoEl.innerHTML = `
            <div><strong>Size:</strong> ${fileSizeMB} MB</div>
            <div><strong>Type:</strong> ${fileData.file.type}</div>
            <div><strong>Last Modified:</strong> ${lastModified.toLocaleString()}</div>
        `;
        
        // Update metadata fields
        descriptionInput.value = fileData.metadata.description || '';
        creditInput.value = fileData.metadata.credit || '';
        
        // Highlight if edited
        descriptionInput.style.borderColor = fileData.edited ? '#0078d7' : '#444';
        creditInput.style.borderColor = fileData.edited ? '#0078d7' : '#444';
    }
    
    function hideMetadataPanel() {
        noSelectionMessage.style.display = 'block';
        metadataContent.style.display = 'none';
    }
    
    function updateSelectedCount() {
        selectedCountEl.textContent = `${selectedFiles.size} selected`;
    }
    
    function updateButtonStates() {
        const hasFiles = files.length > 0;
        const hasSelectedFiles = selectedFiles.size > 0;
        
        // Main buttons
        saveAllBtn.disabled = !hasFiles || editedFiles.size === 0;
        downloadAllBtn.disabled = !hasFiles;
        deselectAllBtn.disabled = !hasSelectedFiles;
        
        // Individual file buttons
        saveMetadataBtn.disabled = currentlySelectedFile === null;
        downloadBtn.disabled = currentlySelectedFile === null;
    }
    
    // Save metadata for current file
    saveMetadataBtn.addEventListener('click', function() {
        if (currentlySelectedFile === null) return;
        
        const fileData = files[currentlySelectedFile];
        const description = descriptionInput.value.trim();
        const credit = creditInput.value.trim();
        
        // Check if values have changed
        if (fileData.metadata.description === description && 
            fileData.metadata.credit === credit) {
            showStatus('No changes to save', 'warning');
            return;
        }
        
        // Update metadata in memory
        fileData.metadata.description = description;
        fileData.metadata.credit = credit;
        
        // Add credit to recent credits if not empty and not already in the list
        if (credit && !recentCredits.includes(credit)) {
            recentCredits.unshift(credit); // Add to beginning of array
            
            // Limit to 10 recent credits
            if (recentCredits.length > 10) {
                recentCredits.pop();
            }
            
            // Save to localStorage
            try {
                localStorage.setItem('recentPhotoCredits', JSON.stringify(recentCredits));
            } catch (e) {
                console.error('Error saving recent credits:', e);
            }
            
            // Update dropdown
            updateRecentCreditsDropdown();
        }
        
        // For JPEG images, update the EXIF data
        if (fileData.file.type === 'image/jpeg' || fileData.file.type === 'image/jpg') {
            try {
                // Load existing EXIF data
                const exifObj = piexif.load(fileData.dataUrl);
                
                // Add description and credit to EXIF
                if (!exifObj["0th"]) {
                    exifObj["0th"] = {};
                }
                
                // Fix: Convert strings to bytes for EXIF data
                if (description) {
                    exifObj["0th"][piexif.ImageIFD.ImageDescription] = piexif.helper.stringToBytes(description);
                }
                
                if (credit) {
                    exifObj["0th"][piexif.ImageIFD.Artist] = piexif.helper.stringToBytes(credit);
                }
                
                // Convert EXIF to binary
                const exifBytes = piexif.dump(exifObj);
                
                // Insert EXIF into JPEG
                const updatedDataUrl = piexif.insert(exifBytes, fileData.dataUrl);
                
                // Store the edited version
                fileData.editedDataUrl = updatedDataUrl;
                
                // Update preview
                previewImage.src = updatedDataUrl;
                
                // Mark as edited
                fileData.edited = true;
                editedFiles.add(currentlySelectedFile);
                
                showStatus('Metadata successfully saved to image!', 'success');
            } catch (error) {
                console.error('Error saving EXIF data:', error);
                showStatus('Error saving metadata: ' + error.message, 'error');
            }
        } else {
            // For non-JPEG images
            fileData.edited = true;
            editedFiles.add(currentlySelectedFile);
            showStatus('Metadata saved (note: non-JPEG files have limited metadata support)', 'warning');
        }
        
        updateButtonStates();
    });
    
    // Download current image
    downloadBtn.addEventListener('click', function() {
        if (currentlySelectedFile === null) return;
        
        const fileData = files[currentlySelectedFile];
        downloadFile(fileData);
    });
    
    // Download all edited files
    saveAllBtn.addEventListener('click', function() {
        if (editedFiles.size === 0) return;
        
        let downloadCount = 0;
        
        editedFiles.forEach(fileIndex => {
            const fileData = files[fileIndex];
            if (fileData.edited) {
                downloadFile(fileData);
                downloadCount++;
            }
        });
        
        showStatus(`Downloaded ${downloadCount} edited files`, 'success');
    });
    
    // Download all files
    downloadAllBtn.addEventListener('click', function() {
        if (files.length === 0) return;
        
        let downloadCount = 0;
        
        files.forEach(fileData => {
            downloadFile(fileData);
            downloadCount++;
        });
        
        showStatus(`Downloaded all ${downloadCount} files`, 'success');
    });
    
    // Deselect all files
    deselectAllBtn.addEventListener('click', function() {
        const thumbnailContainers = document.querySelectorAll('.thumbnail-container');
        thumbnailContainers.forEach(container => {
            container.classList.remove('selected');
        });
        
        selectedFiles.clear();
        currentlySelectedFile = null;
        hideMetadataPanel();
        
        updateSelectedCount();
        updateButtonStates();
    });
    
    // Remove all photos
    removeAllBtn.addEventListener('click', function() {
        if (files.length === 0) return;
        
        if (confirm('Are you sure you want to remove all photos from the gallery? This cannot be undone.')) {
            // Clear the gallery
            gallery.innerHTML = '';
            
            // Re-create the drop area
            const dragArea = document.createElement('div');
            dragArea.id = 'dropArea';
            dragArea.className = 'drag-area';
            dragArea.innerHTML = `
                Drop photos or folders here to add them to the gallery<br>
                <small>(Supported formats: JPG, PNG, TIFF)</small>
            `;
            
            // Initialize the drag and drop events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dragArea.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dragArea.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dragArea.addEventListener(eventName, unhighlight, false);
            });
            
            dragArea.addEventListener('drop', handleDrop, false);
            
            // Add to gallery
            gallery.appendChild(dragArea);
            
            // Reset state
            files = [];
            selectedFiles.clear();
            currentlySelectedFile = null;
            editedFiles.clear();
            
            // Hide metadata panel
            hideMetadataPanel();
            
            // Update UI
            updateSelectedCount();
            updateButtonStates();
            
            showStatus('All photos removed from gallery', 'success');
        }
    });
    
    // Recent credits dropdown
    recentCreditsDropdown.addEventListener('change', function() {
        const selectedCredit = this.value;
        if (selectedCredit) {
            creditInput.value = selectedCredit;
            // Reset dropdown to placeholder
            this.selectedIndex = 0;
        }
    });
    
    function updateRecentCreditsDropdown() {
        // Clear existing options except the first placeholder
        while (recentCreditsDropdown.options.length > 1) {
            recentCreditsDropdown.remove(1);
        }
        
        // Add recent credits as options
        recentCredits.forEach(credit => {
            const option = document.createElement('option');
            option.value = credit;
            option.textContent = credit;
            recentCreditsDropdown.appendChild(option);
        });
    }
    
    function downloadFile(fileData) {
        if (!fileData) return;
        
        // Determine file source (original or edited)
        const dataUrl = fileData.edited ? fileData.editedDataUrl : fileData.dataUrl;
        if (!dataUrl) return;
        
        // Get original filename and add an indicator for edited files
        let filename = fileData.file.name;
        if (fileData.edited) {
            // Split filename at last dot to preserve original extension
            const lastDotIndex = filename.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                const name = filename.substring(0, lastDotIndex);
                const ext = filename.substring(lastDotIndex);
                filename = `${name}_theark${ext}`;
            } else {
                filename = `${filename}_theark`;
            }
        }
        
        // Create and click download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function showStatus(message, type) {
        // Create status element
        const statusEl = document.createElement('div');
        statusEl.className = `status ${type}`;
        statusEl.textContent = message;
        
        // Add to metadata panel
        metadataPanel.appendChild(statusEl);
        
        // Auto-remove after delay
        setTimeout(() => {
            metadataPanel.removeChild(statusEl);
        }, 3000);
    }
});