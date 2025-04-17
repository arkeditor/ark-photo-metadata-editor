document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("fileInput");
    const dropArea = document.getElementById("dropArea");
    const gallery = document.getElementById("gallery");

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropArea.classList.add("highlight");
    }

    function unhighlight(e) {
        dropArea.classList.remove("highlight");
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.maxWidth = "200px";
                img.style.margin = "10px";
                gallery.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    function bindDragEvents(area) {
        ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });
        ["dragenter", "dragover"].forEach(eventName => {
            area.addEventListener(eventName, highlight, false);
        });
        ["dragleave", "drop"].forEach(eventName => {
            area.addEventListener(eventName, unhighlight, false);
        });
        area.addEventListener("drop", handleDrop, false);
    }

    // Bind to initial dropArea
    bindDragEvents(dropArea);

    // Bind file input
    fileInput.addEventListener("change", function(e) {
        handleFiles(this.files);
    });
});
