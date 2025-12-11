
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        const lockRatioCheckbox = document.getElementById('lockRatio');
        const previewCanvas = document.getElementById('previewCanvas');
        const previewDimensions = document.getElementById('previewDimensions');
        const fileSize = document.getElementById('fileSize');
        const filenamePreview = document.getElementById('filenamePreview');
        const downloadBtn = document.getElementById('downloadBtn');
        const widthError = document.getElementById('width-error');
        const heightError = document.getElementById('height-error');
        const presetBtns = document.querySelectorAll('.preset-btn');

        let currentRatio = 16 / 9;
        let lastChangedInput = 'width';

        function validateInput(value, errorElement) {
            const num = parseInt(value);
            if (isNaN(num) || num < 1) {
                errorElement.textContent = 'Must be at least 1px';
                return false;
            }
            if (num > 8192) {
                errorElement.textContent = 'Maximum 8192px';
                return false;
            }
            errorElement.textContent = '';
            return true;
        }

        function updatePreview() {
            const width = parseInt(widthInput.value) || 0;
            const height = parseInt(heightInput.value) || 0;

            const widthValid = validateInput(widthInput.value, widthError);
            const heightValid = validateInput(heightInput.value, heightError);

            widthInput.classList.toggle('error', !widthValid);
            heightInput.classList.toggle('error', !heightValid);

            const isValid = widthValid && heightValid;
            downloadBtn.disabled = !isValid;

            if (isValid) {
                previewDimensions.textContent = `${width} × ${height}`;
                
                // Calculate preview size maintaining aspect ratio
                const maxWidth = 280;
                const maxHeight = 180;
                const ratio = width / height;
                
                let previewWidth, previewHeight;
                if (ratio > maxWidth / maxHeight) {
                    previewWidth = Math.min(width, maxWidth);
                    previewHeight = previewWidth / ratio;
                } else {
                    previewHeight = Math.min(height, maxHeight);
                    previewWidth = previewHeight * ratio;
                }
                
                previewCanvas.style.width = `${Math.max(60, previewWidth)}px`;
                previewCanvas.style.height = `${Math.max(40, previewHeight)}px`;

                // Estimate file size (rough approximation for PNG with transparency)
                const pixels = width * height;
                const estimatedBytes = Math.max(100, pixels * 0.004 + 100);
                if (estimatedBytes < 1024) {
                    fileSize.textContent = `~${Math.round(estimatedBytes)} B`;
                } else if (estimatedBytes < 1024 * 1024) {
                    fileSize.textContent = `~${(estimatedBytes / 1024).toFixed(1)} KB`;
                } else {
                    fileSize.textContent = `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
                }

                filenamePreview.textContent = `transparent_${width}x${height}.png`;
            }
            // Recompute scale after preview/layout changes so everything fits the viewport
            updateScale();
        }

        // Scale the main container down if it would otherwise be taller than the viewport.
        function updateScale() {
            const container = document.querySelector('.container');
            if (!container) return;
            // Reset any previous transform so we can measure natural height
            container.style.transform = '';
            // Measure current container height
            const rect = container.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const margin = 24; // keep a small breathing room

            if (rect.height + margin > viewportH && rect.height > 0) {
                // Compute scale but don't go below 0.5 to maintain legibility
                const scale = Math.max(0.5, (viewportH - margin) / rect.height);
                container.style.transform = `scale(${scale})`;
                container.style.transformOrigin = 'top center';
            } else {
                container.style.transform = '';
            }
        }
        
        // Recompute scale on resize and after the initial render
        window.addEventListener('resize', updateScale);

        function clearActivePresets() {
            presetBtns.forEach(btn => btn.classList.remove('active'));
        }

        function handleWidthChange() {
            lastChangedInput = 'width';
            if (lockRatioCheckbox.checked) {
                const width = parseInt(widthInput.value);
                if (!isNaN(width)) {
                    heightInput.value = Math.round(width / currentRatio);
                }
            }
            clearActivePresets();
            updatePreview();
        }

        function handleHeightChange() {
            lastChangedInput = 'height';
            if (lockRatioCheckbox.checked) {
                const height = parseInt(heightInput.value);
                if (!isNaN(height)) {
                    widthInput.value = Math.round(height * currentRatio);
                }
            }
            clearActivePresets();
            updatePreview();
        }

        widthInput.addEventListener('input', handleWidthChange);
        heightInput.addEventListener('input', handleHeightChange);

        lockRatioCheckbox.addEventListener('change', () => {
            if (lockRatioCheckbox.checked) {
                const width = parseInt(widthInput.value);
                const height = parseInt(heightInput.value);
                if (!isNaN(width) && !isNaN(height) && height > 0) {
                    currentRatio = width / height;
                }
            }
        });

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                clearActivePresets();
                btn.classList.add('active');
                
                widthInput.value = btn.dataset.width;
                heightInput.value = btn.dataset.height;
                
                const [ratioW, ratioH] = btn.dataset.ratio.split(':').map(Number);
                currentRatio = ratioW / ratioH;
                
                updatePreview();
            });
        });

        downloadBtn.addEventListener('click', () => {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);
            
            if (isNaN(width) || isNaN(height) || width < 1 || height < 1 || width > 8192 || height > 8192) {
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transparent_${width}x${height}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        });

        // Initialize
        updatePreview();
        document.querySelector('.preset-btn[data-ratio="16:9"]').classList.add('active');
        // ensure scale is correct on load
        // slight timeout allows final layout measurements (fonts, rendering) to settle
        setTimeout(updateScale, 20);