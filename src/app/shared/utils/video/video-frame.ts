/* global Blob atob*/
export function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;
  
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
  
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
  
  /**
   * Function is creating canvas element, drawing frame from the video, saving it as base64,
   *  than coverting to blob and attaching to URL
   * @param  {[object]}   video    [HTML5 video object]
   * @param  {[int]}   w        [thumbnail width]
   * @param  {[int]}   h        [thumbnail height]
   * @param  {Function} callback [callback with file blob:url as an parameter]
   * @return {[function]}            [callback()]
   */
  export function getVideoFrame(video, w, h, callback) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const img = new Image();
    c.width = w;
    c.height = h;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, w, h);
    img.onload = () => {
      const blob = b64toBlob(img.src.slice(22), 'image/png', 512);
      const url = window.URL.createObjectURL(blob);
      callback(url);
    };
    img.src = c.toDataURL();
  }
  
  export default getVideoFrame;
  